import { getDb, FieldValue } from '../../config/firebase.js'
import { appendOrderToCustomer } from '../customers/model.js'
import { invalidateDashboardCache } from '../dashboard/model.js'
import { getCouponByCodeFromDb } from '../coupons/model.js'

export const ORDER_STATUSES = {
  NEW: 'new',
  PREPARING: 'preparing',
  PACKED: 'packed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

export const ACTIVE_STATUSES = [
  ORDER_STATUSES.NEW,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.PACKED,
]

const STATUS_TRANSITIONS = {
  [ORDER_STATUSES.NEW]: [ORDER_STATUSES.PREPARING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PREPARING]: [ORDER_STATUSES.PACKED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PACKED]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
}

// In-memory fallback stores for development mode
const memoryOrders = []
const memoryOrderCounters = {}

export function getTodayDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

export function canTransition(from, to) {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

function serializeDoc(doc) {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString()),
  }
}

export async function getNextOrderNo(db, orderDate) {
  if (!db) {
    memoryOrderCounters[orderDate] = (memoryOrderCounters[orderDate] || 0) + 1
    return memoryOrderCounters[orderDate]
  }

  const counterRef = db.collection('orderCounters').doc(orderDate)

  return db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef)
    let orderNo = 1

    if (counterDoc.exists) {
      orderNo = (counterDoc.data().lastOrderNo || 0) + 1
    }

    transaction.set(counterRef, { lastOrderNo: orderNo }, { merge: true })
    return orderNo
  })
}

export async function createOrderInDb(orderData) {
  const db = getDb()
  const orderDate = getTodayDate()
  const orderNo = await getNextOrderNo(db, orderDate)
  const isoNow = new Date().toISOString()
  const customId = `ord-${orderDate.replace(/-/g, '')}-${orderNo}`

  const cName = orderData.customerName || orderData.customerDetails?.name || ''
  const cMobile = orderData.customerMobile || orderData.customerDetails?.mobile || ''
  const cDid = orderData.customerDid || orderData.customerDetails?.customerDid || ''

  const customerDetails = {
    name: cName,
    mobile: cMobile,
    customerDid: cDid,
  }

  const orderType = 'takeaway'
  const tableNo = ''
  const deliveryAddress = ''

  // Validate items against canonical database catalog
  let verifiedItems
  let itemTotal = 0

  if (db && Array.isArray(orderData.items)) {
    try {
      const itemsSnapshot = await db.collection('items').get()
      const catalogMap = new Map()
      itemsSnapshot.docs.forEach((d) => catalogMap.set(d.id, { id: d.id, ...d.data() }))

      verifiedItems = orderData.items.map((clientItem) => {
        const catalogItem = catalogMap.get(clientItem.itemId || clientItem.id)
        const qty = Math.max(1, parseInt(clientItem.quantity, 10) || 1)
        const canonicalPrice = catalogItem ? Number(catalogItem.price) : Number(clientItem.price || 0)
        const name = catalogItem?.name || clientItem.name || 'Item'
        const type = catalogItem?.type || clientItem.type || 'item'
        const label = catalogItem?.label || clientItem.label || 'Non-Veg'
        const imageUrl = catalogItem?.imageUrl || clientItem.imageUrl || ''

        let components = clientItem.components || []
        if (type === 'combo' && catalogItem?.comboItemIds?.length) {
          components = catalogItem.comboItemIds
            .map((cId) => catalogMap.get(cId)?.name)
            .filter(Boolean)
        }

        itemTotal += canonicalPrice * qty

        return {
          itemId: clientItem.itemId || clientItem.id,
          name,
          price: canonicalPrice,
          quantity: qty,
          type,
          label,
          imageUrl,
          components,
        }
      })
    } catch {
      verifiedItems = (orderData.items || []).map((i) => {
        const qty = Math.max(1, parseInt(i.quantity, 10) || 1)
        const price = Number(i.price || 0)
        itemTotal += price * qty
        return {
          itemId: i.itemId || i.id,
          name: i.name,
          price,
          quantity: qty,
          type: i.type || 'item',
          label: i.label || 'Non-Veg',
          imageUrl: i.imageUrl || '',
          components: i.components || [],
        }
      })
    }
  } else {
    verifiedItems = (orderData.items || []).map((i) => {
      const qty = Math.max(1, parseInt(i.quantity, 10) || 1)
      const price = Number(i.price || 0)
      itemTotal += price * qty
      return {
        itemId: i.itemId || i.id,
        name: i.name,
        price,
        quantity: qty,
        type: i.type || 'item',
        label: i.label || 'Non-Veg',
        imageUrl: i.imageUrl || '',
        components: i.components || [],
      }
    })
  }

  // Calculate 5% GST tax
  const taxAmount = Math.round(itemTotal * 0.05 * 100) / 100

  // Takeaway shop: deliveryFee is always 0
  const deliveryFee = 0

  // Calculate Discount from dynamic coupons in DB
  let discountAmount = 0
  const discountCode = (orderData.discountCode || '').toUpperCase().trim()
  if (discountCode) {
    const coupon = await getCouponByCodeFromDb(discountCode)
    if (coupon && coupon.isActive) {
      const now = new Date()
      const expiry = coupon.validTill ? new Date(coupon.validTill) : null
      if (expiry) expiry.setHours(23, 59, 59, 999)
      if (!expiry || now <= expiry) {
        if (!coupon.minOrderAmount || itemTotal >= coupon.minOrderAmount) {
          if (coupon.discountType === 'percentage') {
            const calculated = Math.round(itemTotal * (coupon.discountValue / 100) * 100) / 100
            discountAmount = coupon.maxDiscount ? Math.min(coupon.maxDiscount, calculated) : calculated
          } else {
            discountAmount = Math.min(itemTotal, coupon.discountValue)
          }
        }
      }
    }
  }

  const grandTotal = Math.max(0, Math.round((itemTotal + taxAmount + deliveryFee - discountAmount) * 100) / 100)

  if (!db) {
    const order = {
      id: customId,
      orderNo,
      orderDate,
      orderType,
      tableNo,
      deliveryAddress,
      customerName: cName,
      customerMobile: cMobile,
      customerDid: cDid,
      customerDetails,
      items: verifiedItems,
      itemTotal,
      taxAmount,
      deliveryFee,
      discountCode,
      discountAmount,
      totalAmount: grandTotal,
      status: ORDER_STATUSES.NEW,
      payment: null,
      createdAt: isoNow,
      updatedAt: isoNow,
    }
    memoryOrders.unshift(order)
    appendOrderToCustomer(cDid || cMobile, order)
    invalidateDashboardCache()
    return order
  }

  const now = FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date()
  const order = {
    orderNo,
    orderDate,
    orderType,
    tableNo,
    deliveryAddress,
    customerName: cName,
    customerMobile: cMobile,
    customerDid: cDid,
    customerDetails,
    items: verifiedItems,
    itemTotal,
    taxAmount,
    deliveryFee,
    discountCode,
    discountAmount,
    totalAmount: grandTotal,
    status: ORDER_STATUSES.NEW,
    payment: null,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = db.collection('orders').doc(customId)
  await docRef.set(order)
  invalidateActiveOrdersCache()
  invalidateDashboardCache()
  const created = await docRef.get()
  const serialized = serializeDoc(created)
  appendOrderToCustomer(cDid || cMobile, serialized)
  return serialized
}

let activeOrdersCache = null
let activeOrdersTimestamp = 0
const ACTIVE_ORDERS_TTL = 3000 // 3 seconds

export function invalidateActiveOrdersCache() {
  activeOrdersCache = null
  activeOrdersTimestamp = 0
}

export async function fetchActiveOrders() {
  const now = Date.now()
  if (activeOrdersCache && now - activeOrdersTimestamp < ACTIVE_ORDERS_TTL) {
    return activeOrdersCache
  }

  const db = getDb()

  if (!db) {
    activeOrdersCache = memoryOrders
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    activeOrdersTimestamp = now
    return activeOrdersCache
  }

  const snapshot = await db
    .collection('orders')
    .where('status', 'in', ACTIVE_STATUSES)
    .get()

  const orders = snapshot.docs.map(serializeDoc)
  activeOrdersCache = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  activeOrdersTimestamp = now
  return activeOrdersCache
}

export async function fetchOrders({ fromDate, toDate, status } = {}) {
  const db = getDb()

  if (!db) {
    let result = [...memoryOrders]
    if (fromDate) {
      result = result.filter((o) => o.orderDate >= fromDate)
    }
    if (toDate) {
      result = result.filter((o) => o.orderDate <= toDate)
    }
    if (status) {
      result = result.filter((o) => o.status === status)
    }
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  let query = db.collection('orders')

  if (fromDate) {
    query = query.where('orderDate', '>=', fromDate)
  }
  if (toDate) {
    query = query.where('orderDate', '<=', toDate)
  }
  if (status) {
    query = query.where('status', '==', status)
  }

  const snapshot = await query.get()
  const orders = snapshot.docs.map(serializeDoc)
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function fetchOrderById(id) {
  const db = getDb()

  if (!db) {
    const order = memoryOrders.find((o) => o.id === id)
    return order || null
  }

  const doc = await db.collection('orders').doc(id).get()
  if (!doc.exists) return null
  return serializeDoc(doc)
}

export async function updateOrderStatusInDb(id, newStatus) {
  const db = getDb()

  if (!db) {
    const order = memoryOrders.find((o) => o.id === id)
    if (!order) throw new Error('Order not found')
    if (!canTransition(order.status, newStatus)) {
      throw new Error(`Cannot transition from ${order.status} to ${newStatus}`)
    }
    order.status = newStatus
    order.updatedAt = new Date().toISOString()
    invalidateDashboardCache()
    return order
  }

  const docRef = db.collection('orders').doc(id)
  const doc = await docRef.get()
  if (!doc.exists) throw new Error('Order not found')

  const currentData = doc.data()
  if (!canTransition(currentData.status, newStatus)) {
    throw new Error(`Cannot transition from ${currentData.status} to ${newStatus}`)
  }

  const isoNow = new Date().toISOString()
  await docRef.update({
    status: newStatus,
    updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
  })
  invalidateActiveOrdersCache()
  invalidateDashboardCache()

  return {
    id: doc.id,
    ...currentData,
    status: newStatus,
    updatedAt: isoNow,
  }
}

export async function deliverOrderInDb(id, payment) {
  const db = getDb()

  if (!db) {
    const order = memoryOrders.find((o) => o.id === id)
    if (!order) throw new Error('Order not found')
    if (order.status !== ORDER_STATUSES.PACKED) {
      throw new Error('Order must be packed before delivery')
    }
    order.status = ORDER_STATUSES.DELIVERED
    order.payment = payment
    order.updatedAt = new Date().toISOString()
    invalidateActiveOrdersCache()
    invalidateDashboardCache()
    return order
  }

  const docRef = db.collection('orders').doc(id)
  const doc = await docRef.get()
  if (!doc.exists) throw new Error('Order not found')

  const currentData = doc.data()
  if (currentData.status !== ORDER_STATUSES.PACKED) {
    throw new Error('Order must be packed before delivery')
  }

  const isoNow = new Date().toISOString()
  await docRef.update({
    status: ORDER_STATUSES.DELIVERED,
    payment,
    updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
  })
  invalidateActiveOrdersCache()
  invalidateDashboardCache()

  return {
    id: doc.id,
    ...currentData,
    status: ORDER_STATUSES.DELIVERED,
    payment,
    updatedAt: isoNow,
  }
}

export async function getPackedOrdersFromDb() {
  const db = getDb()

  if (!db) {
    return memoryOrders
      .filter((o) => (o.status || '').toLowerCase() === ORDER_STATUSES.PACKED)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  }

  try {
    const snapshot = await db
      .collection('orders')
      .where('status', '==', ORDER_STATUSES.PACKED)
      .get()

    const list = snapshot.docs.map(serializeDoc)
    list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    return list
  } catch (err) {
    console.warn('Fallback getting packed orders from Firestore:', err.message)
    const snapshot = await db.collection('orders').get()
    return snapshot.docs
      .map(serializeDoc)
      .filter((o) => (o.status || '').toLowerCase() === ORDER_STATUSES.PACKED)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  }
}

