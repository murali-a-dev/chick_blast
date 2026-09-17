import { getDb, FieldValue } from '../../config/firebase.js'

// In-memory fallback stores for development mode
const memoryCustomers = []

function serializeDoc(doc) {
  const data = doc.data()
  const did = doc.id
  const cleanName = data.name || data.Name || ''
  const cleanMobile = data.mobile || data.MobileNo || ''
  const history = data.orderHistory || data['Order history'] || []

  return {
    id: did,
    did,
    ...data,
    name: cleanName,
    Name: cleanName,
    mobile: cleanMobile,
    MobileNo: cleanMobile,
    orderHistory: history,
    'Order history': history,
    createdAt:
      data.createdAt?.toDate?.()?.toISOString?.() ??
      data.CreatedAt?.toDate?.()?.toISOString?.() ??
      (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
    updatedAt:
      data.updatedAt?.toDate?.()?.toISOString?.() ??
      data.UpdatedAt?.toDate?.()?.toISOString?.() ??
      (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString()),
  }
}

/**
 * Check if a customer exists by mobile number in customers collection
 */
export async function checkCustomerExists(mobileNo) {
  const cleanMobile = String(mobileNo || '').replace(/\D/g, '')
  const db = getDb()

  if (!db) {
    const found = memoryCustomers.find(
      (c) => (c.mobile || c.MobileNo) === cleanMobile
    )
    return {
      exists: Boolean(found),
      customer: found || null,
    }
  }

  // 1. Query 'customers' collection by mobile or MobileNo
  let snapshot = await db
    .collection('customers')
    .where('mobile', '==', cleanMobile)
    .limit(1)
    .get()

  if (snapshot.empty) {
    snapshot = await db
      .collection('customers')
      .where('MobileNo', '==', cleanMobile)
      .limit(1)
      .get()
  }

  if (snapshot.empty) {
    return { exists: false, customer: null }
  }

  const doc = snapshot.docs[0]
  return {
    exists: true,
    customer: serializeDoc(doc),
  }
}

/**
 * Create a new Customer document in customers collection with auto-generated did
 * Fields: did, name, mobile, orderHistory, createdAt, updatedAt
 */
export async function createCustomerInDb({ name, mobileNo }) {
  const cleanMobile = String(mobileNo || '').replace(/\D/g, '')
  const cleanName = String(name || '').trim()
  const db = getDb()
  const isoNow = new Date().toISOString()

  if (!db) {
    const existingIdx = memoryCustomers.findIndex(
      (c) => (c.mobile || c.MobileNo) === cleanMobile
    )
    const did = `cst_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
    const customerObj = {
      id: did,
      did,
      name: cleanName,
      Name: cleanName,
      mobile: cleanMobile,
      MobileNo: cleanMobile,
      orderHistory: [],
      'Order history': [],
      createdAt: isoNow,
      updatedAt: isoNow,
    }

    if (existingIdx >= 0) {
      memoryCustomers[existingIdx] = {
        ...memoryCustomers[existingIdx],
        name: cleanName,
        Name: cleanName,
        updatedAt: isoNow,
      }
      return memoryCustomers[existingIdx]
    }

    memoryCustomers.push(customerObj)
    return customerObj
  }

  // Check if customer already exists in 'customers'
  const existing = await checkCustomerExists(cleanMobile)
  if (existing.exists && existing.customer) {
    const existingDid = existing.customer.did || existing.customer.id
    const docRef = db.collection('customers').doc(existingDid)
    await docRef.set(
      {
        name: cleanName,
        updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
      },
      { merge: true }
    )
    const updated = await docRef.get()
    return serializeDoc(updated)
  }

  // Generate new document with did
  const newDocRef = db.collection('customers').doc()
  const did = newDocRef.id
  const now = FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date()

  const newCustomer = {
    did,
    name: cleanName,
    mobile: cleanMobile,
    orderHistory: [],
    createdAt: now,
    updatedAt: now,
  }

  await newDocRef.set(newCustomer)
  const created = await newDocRef.get()
  return serializeDoc(created)
}

/**
 * Update Customer details (e.g. name) in customers collection
 */
export async function updateCustomerInDb(idOrDid, updateData) {
  const db = getDb()
  const cleanName = updateData.name || updateData.Name
  const isoNow = new Date().toISOString()

  if (!db) {
    const customer = memoryCustomers.find(
      (c) =>
        c.did === idOrDid ||
        c.id === idOrDid ||
        (c.mobile || c.MobileNo) === idOrDid.replace(/\D/g, '')
    )
    if (!customer) throw new Error('Customer not found')
    if (cleanName) {
      customer.name = cleanName.trim()
      customer.Name = cleanName.trim()
    }
    customer.updatedAt = isoNow
    return customer
  }

  let docRef

  // Try direct doc reference in 'customers'
  const directDoc = await db.collection('customers').doc(idOrDid).get()
  if (directDoc.exists) {
    docRef = directDoc.ref
  } else {
    // Search by did or mobile
    const cleanMobile = idOrDid.replace(/\D/g, '')
    const snapshot = await db
      .collection('customers')
      .where('mobile', '==', cleanMobile)
      .limit(1)
      .get()

    if (!snapshot.empty) {
      docRef = snapshot.docs[0].ref
    } else {
      const snapDid = await db
        .collection('customers')
        .where('did', '==', idOrDid)
        .limit(1)
        .get()
      if (!snapDid.empty) {
        docRef = snapDid.docs[0].ref
      } else {
        docRef = db.collection('customers').doc(idOrDid)
      }
    }
  }

  const doc = await docRef.get()
  if (!doc.exists) throw new Error('Customer not found')

  const payload = {
    updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
  }
  if (cleanName) {
    payload.name = cleanName.trim()
  }

  await docRef.update(payload)
  const updatedDoc = await docRef.get()
  return serializeDoc(updatedDoc)
}

/**
 * Fetch Customer Profile & their Order History by mobile or did
 */
export async function fetchCustomerProfile(mobileOrDid) {
  const cleanMobile = String(mobileOrDid || '').replace(/\D/g, '')
  const db = getDb()

  if (!db) {
    const customer = memoryCustomers.find(
      (c) =>
        c.did === mobileOrDid ||
        c.id === mobileOrDid ||
        (c.mobile || c.MobileNo) === cleanMobile
    )
    return customer || null
  }

  // 1. Try finding in 'customers' by did
  const directDoc = await db.collection('customers').doc(mobileOrDid).get()
  if (directDoc.exists) {
    return serializeDoc(directDoc)
  }

  // 2. Query 'customers' by mobile
  if (cleanMobile) {
    let snapshot = await db
      .collection('customers')
      .where('mobile', '==', cleanMobile)
      .limit(1)
      .get()

    if (snapshot.empty) {
      snapshot = await db
        .collection('customers')
        .where('MobileNo', '==', cleanMobile)
        .limit(1)
        .get()
    }

    if (!snapshot.empty) {
      return serializeDoc(snapshot.docs[0])
    }
  }

  return null
}

/**
 * Fetch all orders for a Customer by mobile or did
 */
export async function fetchCustomerOrders(mobileOrDid) {
  const cleanMobile = String(mobileOrDid || '').replace(/\D/g, '')
  const db = getDb()

  if (!db) {
    const customer = memoryCustomers.find(
      (c) =>
        c.did === mobileOrDid ||
        c.id === mobileOrDid ||
        (c.mobile || c.MobileNo) === cleanMobile
    )
    return customer?.orderHistory || []
  }

  // 1. Fetch the customer profile first
  const customer = await fetchCustomerProfile(mobileOrDid)
  const customerDid = customer?.did || customer?.id || (mobileOrDid.length !== 10 ? mobileOrDid : null)
  const embeddedHistory = Array.isArray(customer?.orderHistory) ? customer.orderHistory : []

  // 2. Query direct orders by customerDid (or customerDetails.customerDid)
  let directOrders = []
  if (customerDid) {
    // Query orders placed by this specific customerDid
    const snapDid = await db
      .collection('orders')
      .where('customerDid', '==', customerDid)
      .get()

    const snapDetailsDid = await db
      .collection('orders')
      .where('customerDetails.customerDid', '==', customerDid)
      .get()

    const allDocs = [...snapDid.docs, ...snapDetailsDid.docs]
    const seen = new Set()

    directOrders = allDocs
      .filter((doc) => {
        if (seen.has(doc.id)) return false
        seen.add(doc.id)
        return true
      })
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt?.toDate?.()?.toISOString?.() ??
            (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString?.() ??
            (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString()),
        }
      })
  }

  // If customer is found and has no direct orders with their did, check embeddedHistory
  const map = new Map()
  directOrders.forEach((o) => map.set(o.id, o))
  embeddedHistory.forEach((o) => {
    const orderId = o.id || o.orderId
    if (orderId && !map.has(orderId)) {
      map.set(orderId, o)
    }
  })

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.createdAt || b.CreatedAt || 0) -
      new Date(a.createdAt || a.CreatedAt || 0)
  )
}

/**
 * Helper to append a newly placed order to Customer's 'orderHistory' array
 */
export async function appendOrderToCustomer(customerMobileOrDid, orderSummary) {
  const cleanMobile = String(customerMobileOrDid || '').replace(/\D/g, '')
  if (!customerMobileOrDid && !cleanMobile) return

  const db = getDb()
  const isoNow = new Date().toISOString()

  // Clean, minimal order summary entry for the customer's orderHistory array
  const orderEntry = {
    id: orderSummary.id || '',
    orderNo: orderSummary.orderNo || 0,
    orderDate: orderSummary.orderDate || '',
    items: Array.isArray(orderSummary.items) ? orderSummary.items : [],
    totalAmount: orderSummary.totalAmount || 0,
    status: orderSummary.status || 'new',
    payment: orderSummary.payment || null,
    createdAt: orderSummary.createdAt || isoNow,
  }

  if (!db) {
    const customer = memoryCustomers.find(
      (c) =>
        c.did === customerMobileOrDid ||
        c.id === customerMobileOrDid ||
        (c.mobile || c.MobileNo) === cleanMobile
    )
    if (customer) {
      if (!customer.orderHistory) customer.orderHistory = []
      customer.orderHistory.unshift(orderEntry)
    }
    return
  }

  try {
    const customer = await fetchCustomerProfile(customerMobileOrDid)
    if (customer) {
      const did = customer.did || customer.id
      const docRef = db.collection('customers').doc(did)

      if (FieldValue?.arrayUnion) {
        await docRef.set(
          {
            orderHistory: FieldValue.arrayUnion(orderEntry),
            updatedAt: FieldValue.serverTimestamp
              ? FieldValue.serverTimestamp()
              : new Date(),
          },
          { merge: true }
        )
      } else {
        const history = customer.orderHistory || []
        history.unshift(orderEntry)
        await docRef.set(
          {
            orderHistory: history,
            updatedAt: new Date(),
          },
          { merge: true }
        )
      }
    }
  } catch (err) {
    console.warn('Could not append order to customer history:', err.message)
  }
}
