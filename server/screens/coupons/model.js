import { getDb, FieldValue } from '../../config/firebase.js'

// In-memory fallback coupons for development or when Firebase is in mock mode
let memoryCoupons = [
  {
    id: 'coupon-chick10',
    code: 'CHICK10',
    title: '10% Off on Crispy Treats',
    description: 'Get 10% discount on orders above ₹100 up to ₹100',
    discountType: 'percentage', // 'percentage' | 'flat'
    discountValue: 10,
    minOrderAmount: 100,
    maxDiscount: 100,
    validTill: '2027-12-31',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'coupon-welcome50',
    code: 'WELCOME50',
    title: 'Welcome ₹50 Discount',
    description: 'Flat ₹50 off on orders above ₹199',
    discountType: 'flat',
    discountValue: 50,
    minOrderAmount: 199,
    maxDiscount: null,
    validTill: '2027-12-31',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'coupon-feast100',
    code: 'FEAST100',
    title: 'Mega Feast ₹100 Off',
    description: 'Flat ₹100 off on large orders above ₹499',
    discountType: 'flat',
    discountValue: 100,
    minOrderAmount: 499,
    maxDiscount: null,
    validTill: '2027-12-31',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'coupon-chickfree',
    code: 'CHICK15',
    title: '15% Off Celebration',
    description: 'Get 15% discount on orders above ₹250 up to ₹75',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 250,
    maxDiscount: 75,
    validTill: '2027-12-31',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function getAllCouponsFromDb() {
  const db = getDb()
  if (!db) {
    return [...memoryCoupons]
  }

  try {
    const snapshot = await db.collection('coupons').get()
    if (snapshot.empty) {
      // Seed default coupons if collection is empty
      for (const c of memoryCoupons) {
        await db.collection('coupons').doc(c.id).set({
          ...c,
          createdAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
          updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
        })
      }
      return [...memoryCoupons]
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      }
    })
  } catch (err) {
    console.error('Error fetching coupons from Firestore:', err.message)
    return [...memoryCoupons]
  }
}

export async function getCouponByCodeFromDb(code) {
  if (!code) return null
  const cleanCode = String(code).toUpperCase().trim()
  const all = await getAllCouponsFromDb()
  return all.find((c) => c.code?.toUpperCase() === cleanCode) || null
}

export async function createCouponInDb(payload) {
  const db = getDb()
  const cleanCode = String(payload.code || '').toUpperCase().trim()
  const id = `coupon-${Date.now()}`
  const isoNow = new Date().toISOString()

  const newCoupon = {
    id,
    code: cleanCode,
    title: payload.title || `${cleanCode} Offer`,
    description: payload.description || '',
    discountType: payload.discountType === 'flat' ? 'flat' : 'percentage',
    discountValue: Number(payload.discountValue) || 0,
    minOrderAmount: Number(payload.minOrderAmount) || 0,
    maxDiscount: payload.maxDiscount ? Number(payload.maxDiscount) : null,
    validTill: payload.validTill || null,
    isActive: payload.isActive !== false,
    createdAt: isoNow,
    updatedAt: isoNow,
  }

  if (!db) {
    memoryCoupons.unshift(newCoupon)
    return newCoupon
  }

  try {
    await db.collection('coupons').doc(id).set({
      ...newCoupon,
      createdAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
      updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
    })
    return newCoupon
  } catch (err) {
    console.error('Error creating coupon in Firestore:', err.message)
    memoryCoupons.unshift(newCoupon)
    return newCoupon
  }
}

export async function updateCouponInDb(id, updates) {
  const db = getDb()
  const isoNow = new Date().toISOString()
  const cleanUpdates = { ...updates, updatedAt: isoNow }
  delete cleanUpdates.id
  delete cleanUpdates.createdAt

  if (cleanUpdates.code) {
    cleanUpdates.code = String(cleanUpdates.code).toUpperCase().trim()
  }
  if (cleanUpdates.discountValue !== undefined) {
    cleanUpdates.discountValue = Number(cleanUpdates.discountValue)
  }
  if (cleanUpdates.minOrderAmount !== undefined) {
    cleanUpdates.minOrderAmount = Number(cleanUpdates.minOrderAmount)
  }
  if (cleanUpdates.maxDiscount !== undefined && cleanUpdates.maxDiscount !== null) {
    cleanUpdates.maxDiscount = Number(cleanUpdates.maxDiscount)
  }

  if (!db) {
    const idx = memoryCoupons.findIndex((c) => c.id === id)
    if (idx === -1) return null
    memoryCoupons[idx] = { ...memoryCoupons[idx], ...cleanUpdates }
    return memoryCoupons[idx]
  }

  try {
    const docRef = db.collection('coupons').doc(id)
    await docRef.update({
      ...cleanUpdates,
      updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
    })
    const doc = await docRef.get()
    return { id: doc.id, ...doc.data() }
  } catch (err) {
    console.error('Error updating coupon in Firestore:', err.message)
    const idx = memoryCoupons.findIndex((c) => c.id === id)
    if (idx !== -1) {
      memoryCoupons[idx] = { ...memoryCoupons[idx], ...cleanUpdates }
      return memoryCoupons[idx]
    }
    return null
  }
}

export async function deleteCouponInDb(id) {
  const db = getDb()
  if (!db) {
    const prevLen = memoryCoupons.length
    memoryCoupons = memoryCoupons.filter((c) => c.id !== id)
    return memoryCoupons.length < prevLen
  }

  try {
    await db.collection('coupons').doc(id).delete()
    memoryCoupons = memoryCoupons.filter((c) => c.id !== id)
    return true
  } catch (err) {
    console.error('Error deleting coupon in Firestore:', err.message)
    memoryCoupons = memoryCoupons.filter((c) => c.id !== id)
    return true
  }
}
