import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { customersApi } from '../api'

const CustomerContext = createContext(null)

const STORAGE_KEY = 'chick_blast_customer'

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalConfig, setAuthModalConfig] = useState({})
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)

  // Prevent background scrolling when modals are active
  useEffect(() => {
    if (isAuthModalOpen || isAccountModalOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow || ''
      }
    }
  }, [isAuthModalOpen, isAccountModalOpen])

  // Sync customer to localStorage
  useEffect(() => {
    try {
      if (customer) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customer))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (e) {
      console.error('Failed to sync customer to localStorage:', e)
    }
  }, [customer])

  // Initial load check: if customer exists in localStorage, re-validate with backend
  useEffect(() => {
    const targetMobile = customer?.MobileNo || customer?.mobile
    if (!targetMobile) return

    let isMounted = true
    customersApi.getProfile(targetMobile)
      .then((profileData) => {
        if (isMounted && profileData?.customer) {
          setCustomer(profileData.customer)
          if (Array.isArray(profileData.orders)) {
            setOrders(profileData.orders)
          }
        }
      })
      .catch((err) => {
        console.warn('Initial customer login validation check:', err.message)
      })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch orders when customer is active or changes
  const fetchCustomerOrders = useCallback(async (mobileNo) => {
    const targetMobile = mobileNo || customer?.MobileNo || customer?.mobile
    if (!targetMobile) {
      setOrders([])
      return
    }

    setLoadingOrders(true)
    try {
      const orderList = await customersApi.getOrderHistory(targetMobile)
      setOrders(Array.isArray(orderList) ? orderList : [])
    } catch (err) {
      console.warn('Could not fetch customer orders:', err.message)
    } finally {
      setLoadingOrders(false)
    }
  }, [customer?.MobileNo, customer?.mobile])

  useEffect(() => {
    const targetMobile = customer?.MobileNo || customer?.mobile
    if (!targetMobile) return

    let isMounted = true
    Promise.resolve().then(() => {
      if (isMounted) setLoadingOrders(true)
    })
    customersApi.getOrderHistory(targetMobile)
      .then((orderList) => {
        if (isMounted) {
          setOrders(Array.isArray(orderList) ? orderList : [])
        }
      })
      .catch((err) => {
        console.warn('Could not fetch customer orders:', err.message)
      })
      .finally(() => {
        if (isMounted) setLoadingOrders(false)
      })

    return () => {
      isMounted = false
    }
  }, [customer?.MobileNo, customer?.mobile])

  const openAuthModal = useCallback((config = {}) => {
    setAuthModalConfig(config)
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
    setAuthModalConfig({})
  }, [])

  const openAccountModal = useCallback(() => {
    const targetMobile = customer?.MobileNo || customer?.mobile
    if (targetMobile) {
      fetchCustomerOrders(targetMobile)
    }
    setIsAccountModalOpen(true)
  }, [customer?.MobileNo, customer?.mobile, fetchCustomerOrders])

  const closeAccountModal = useCallback(() => {
    setIsAccountModalOpen(false)
  }, [])

  const loginCustomer = useCallback((customerData, orderList = []) => {
    setCustomer(customerData)
    if (Array.isArray(orderList) && orderList.length > 0) {
      setOrders(orderList)
    }
  }, [])

  const logoutCustomer = useCallback(() => {
    setCustomer(null)
    setOrders([])
    setIsAccountModalOpen(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('cb_last_order_id')
      localStorage.removeItem('cb_cart_items')
      localStorage.removeItem('cb_discount_code')
      localStorage.removeItem('cb_applied_coupon')
      window.dispatchEvent(new CustomEvent('cb_customer_logout'))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const updateCustomerName = useCallback(async (newName) => {
    if (!customer) return
    const trimmed = (newName || '').trim()
    if (!trimmed) throw new Error('Customer name cannot be empty')

    const targetId = customer.did || customer.id || `cst_${customer.MobileNo || customer.mobile}`
    const updated = await customersApi.updateProfile(targetId, { name: trimmed })

    const updatedCustomer = {
      ...customer,
      ...updated,
      Name: trimmed,
      name: trimmed,
    }
    setCustomer(updatedCustomer)
    return updatedCustomer
  }, [customer])

  const isLoggedIn = Boolean(customer?.MobileNo || customer?.mobile)

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isLoggedIn,
        orders,
        loadingOrders,
        isAuthModalOpen,
        authModalConfig,
        openAuthModal,
        closeAuthModal,
        isAccountModalOpen,
        openAccountModal,
        closeAccountModal,
        loginCustomer,
        logoutCustomer,
        updateCustomerName,
        refreshCustomerOrders: () =>
          fetchCustomerOrders(customer?.MobileNo || customer?.mobile),
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  const ctx = useContext(CustomerContext)
  if (!ctx) {
    throw new Error('useCustomer must be used within CustomerProvider')
  }
  return ctx
}
