import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { couponsApi } from '../api'

const CartContext = createContext(null)

function getStored(key, fallback) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota errors
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => getStored('cb_cart_items', []))
  const [orderType] = useState('takeaway')
  const setOrderType = useCallback(() => {}, [])
  const [tableNo, setTableNo] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const [lastOrderId, setLastOrderId] = useState(() => getStored('cb_last_order_id', null))
  const [discountCode, setDiscountCode] = useState(() => getStored('cb_discount_code', ''))
  const [appliedCoupon, setAppliedCoupon] = useState(() => getStored('cb_applied_coupon', null))

  // Sync state to localStorage
  useEffect(() => {
    setStored('cb_cart_items', items)
  }, [items])

  useEffect(() => {
    setStored('cb_discount_code', discountCode)
  }, [discountCode])

  useEffect(() => {
    setStored('cb_applied_coupon', appliedCoupon)
  }, [appliedCoupon])

  useEffect(() => {
    setStored('cb_last_order_id', lastOrderId)
  }, [lastOrderId])

  // Listen to logout event to clear customer session from cart context
  useEffect(() => {
    const handleLogout = () => {
      setLastOrderId(null)
      setCustomerName('')
      setCustomerMobile('')
      setItems([])
      setDiscountCode('')
      setAppliedCoupon(null)
      try {
        localStorage.removeItem('cb_last_order_id')
        localStorage.removeItem('cb_cart_items')
        localStorage.removeItem('cb_discount_code')
        localStorage.removeItem('cb_applied_coupon')
      } catch (e) {
        console.error(e)
      }
    }
    window.addEventListener('cb_customer_logout', handleLogout)
    return () => window.removeEventListener('cb_customer_logout', handleLogout)
  }, [])

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.itemId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          itemId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          type: product.type || 'item',
          label: product.label || 'Non-Veg',
          imageUrl: product.imageUrl,
          components: product.components || [],
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.itemId !== itemId))
    } else {
      setItems((prev) =>
        prev.map((i) => (i.itemId === itemId ? { ...i, quantity } : i))
      )
    }
  }, [])

  const removeItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setCustomerName('')
    setCustomerMobile('')
    setDiscountCode('')
    setAppliedCoupon(null)
    setStored('cb_cart_items', [])
    setStored('cb_discount_code', '')
    setStored('cb_applied_coupon', null)
  }, [])

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  // Tax: 5% GST
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100

  // Takeaway shop: Delivery Fee is always 0
  const deliveryFee = 0

  // Calculate discount dynamically based on subtotal and active promo code
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.minOrderAmount && subtotal < appliedCoupon.minOrderAmount) {
      return 0
    }
    if (appliedCoupon.discountType === 'percentage') {
      const calculated = Math.round(subtotal * (appliedCoupon.discountValue / 100) * 100) / 100
      return appliedCoupon.maxDiscount ? Math.min(appliedCoupon.maxDiscount, calculated) : calculated
    }
    return Math.min(subtotal, appliedCoupon.discountValue || 0)
  }, [subtotal, appliedCoupon])

  const applyCoupon = useCallback(
    async (code) => {
      const clean = String(code || '').toUpperCase().trim()
      if (!clean) throw new Error('Please enter a coupon code')
      try {
        const res = await couponsApi.validate(clean, subtotal)
        if (res?.success && res.data) {
          setDiscountCode(res.data.code)
          setAppliedCoupon(res.data)
          return { success: true, message: `${res.data.code} applied! Saved ₹${res.data.discountAmount}` }
        }
        throw new Error(res?.message || 'Invalid coupon code')
      } catch (err) {
        throw new Error(err.message || 'Failed to apply coupon', { cause: err })
      }
    },
    [subtotal]
  )

  const removeCoupon = useCallback(() => {
    setDiscountCode('')
    setAppliedCoupon(null)
    setStored('cb_discount_code', '')
    setStored('cb_applied_coupon', null)
  }, [])

  const grandTotal = Math.max(0, Math.round((subtotal + taxAmount + deliveryFee - discountAmount) * 100) / 100)

  return (
    <CartContext.Provider
      value={{
        items,
        orderType,
        tableNo,
        deliveryAddress,
        customerName,
        customerMobile,
        lastOrderId,
        subtotal,
        taxAmount,
        deliveryFee,
        discountCode,
        discountAmount,
        grandTotal,
        totalAmount: grandTotal, // Backward compatibility
        itemCount,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        setOrderType,
        setTableNo,
        setDeliveryAddress,
        setCustomerName,
        setCustomerMobile,
        setLastOrderId,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
