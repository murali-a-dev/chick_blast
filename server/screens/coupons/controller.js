import {
  getAllCouponsFromDb,
  getCouponByCodeFromDb,
  createCouponInDb,
  updateCouponInDb,
  deleteCouponInDb,
} from './model.js'

export async function getAllCoupons(req, res) {
  try {
    const coupons = await getAllCouponsFromDb()
    return res.json({ success: true, count: coupons.length, data: coupons })
  } catch (err) {
    console.error('getAllCoupons error:', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function createCoupon(req, res) {
  try {
    const { code, discountValue } = req.body
    if (!code || !String(code).trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' })
    }
    if (discountValue === undefined || isNaN(discountValue) || Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid discount value is required' })
    }

    const existing = await getCouponByCodeFromDb(code)
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon with code "${code.toUpperCase()}" already exists` })
    }

    const coupon = await createCouponInDb(req.body)
    return res.status(201).json({ success: true, data: coupon })
  } catch (err) {
    console.error('createCoupon error:', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function updateCoupon(req, res) {
  try {
    const { id } = req.params
    const updated = await updateCouponInDb(id, req.body)
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Coupon not found' })
    }
    return res.json({ success: true, data: updated })
  } catch (err) {
    console.error('updateCoupon error:', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function deleteCoupon(req, res) {
  try {
    const { id } = req.params
    await deleteCouponInDb(id)
    return res.json({ success: true, message: 'Coupon deleted successfully' })
  } catch (err) {
    console.error('deleteCoupon error:', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function validateCoupon(req, res) {
  try {
    const { code, subtotal = 0 } = req.body
    if (!code || !String(code).trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' })
    }

    const coupon = await getCouponByCodeFromDb(code)
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' })
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'This coupon is currently inactive' })
    }

    if (coupon.validTill) {
      const now = new Date()
      const expiry = new Date(coupon.validTill)
      // Set to end of expiry day
      expiry.setHours(23, 59, 59, 999)
      if (now > expiry) {
        return res.status(400).json({ success: false, message: 'This coupon has expired' })
      }
    }

    const orderSubtotal = Number(subtotal) || 0
    if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      })
    }

    let discountAmount = 0
    if (coupon.discountType === 'percentage') {
      const calculated = Math.round(orderSubtotal * (coupon.discountValue / 100) * 100) / 100
      discountAmount = coupon.maxDiscount ? Math.min(coupon.maxDiscount, calculated) : calculated
    } else {
      discountAmount = Math.min(orderSubtotal, coupon.discountValue)
    }

    return res.json({
      success: true,
      data: {
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        discountAmount,
      },
    })
  } catch (err) {
    console.error('validateCoupon error:', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }
}
