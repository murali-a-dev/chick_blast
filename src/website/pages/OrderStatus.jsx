import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  Flame,
  PackageCheck,
  PartyPopper,
  User,
  Phone,
  ArrowLeft,
  Clock,
  ClipboardCheck,
  Tag,
  ChevronRight,
  Sparkles,
  MapPin,
} from 'lucide-react'
import { ordersApi } from '../../shared/api'
import { useCustomer } from '../../shared/context/CustomerContext'
import StatusPill from '../../shared/components/StatusPill'
import FssaiBadge from '../../shared/components/FssaiBadge'
import PrintBillButton from '../../shared/components/PrintBillButton'
import Loader from '../../shared/components/Loader'
import logoImg from '../../assets/logo.png'

const TRACKER_STEPS = [
  { key: 'new', label: 'Placed', icon: ClipboardCheck, subtitle: 'Received by kitchen' },
  { key: 'preparing', label: 'Preparing', icon: Flame, subtitle: 'Cooking hot & fresh' },
  { key: 'packed', label: 'Ready', icon: PackageCheck, subtitle: 'Packed for pickup' },
  { key: 'delivered', label: 'Delivered', icon: PartyPopper, subtitle: 'Order completed' },
]

const STATUS_ORDER = ['new', 'preparing', 'packed', 'delivered']

export default function OrderStatus() {
  const location = useLocation()
  const navigate = useNavigate()
  const { customer, isLoggedIn, orders: customerOrders, openAuthModal, refreshCustomerOrders } = useCustomer()

  const [selectedOrderId, setSelectedOrderId] = useState(
    () => location.state?.orderId || null
  )
  const [activeOrder, setActiveOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const pollingRef = useRef(null)

  const customerPhone = customer?.MobileNo || customer?.mobile || null

  // Refresh customer's orders whenever logged-in status changes or on mount
  useEffect(() => {
    if (isLoggedIn && customerPhone) {
      refreshCustomerOrders?.()
    } else {
      // User logged out: immediately reset any active order state
      setActiveOrder(null)
      setSelectedOrderId(null)
    }
  }, [isLoggedIn, customerPhone])

  // Select initial order when customer orders load or change
  useEffect(() => {
    if (!isLoggedIn || !customerPhone) {
      setActiveOrder(null)
      setSelectedOrderId(null)
      return
    }

    if (Array.isArray(customerOrders) && customerOrders.length > 0) {
      // If we already have a selectedOrderId and it's valid for this customer, keep it
      const match = customerOrders.find((o) => o.id === selectedOrderId)
      if (match) {
        setActiveOrder(match)
      } else {
        // Otherwise default to the newest order
        setSelectedOrderId(customerOrders[0].id)
        setActiveOrder(customerOrders[0])
      }
    } else {
      setActiveOrder(null)
    }
  }, [customerOrders, isLoggedIn, customerPhone, selectedOrderId])

  // Live fetch and poll the selected order details
  const fetchSelectedOrder = useCallback(async (isSilent = false) => {
    if (!selectedOrderId || !isLoggedIn || !customerPhone) return
    if (!isSilent) setLoading(true)

    try {
      const data = await ordersApi.getById(selectedOrderId)
      // Safety check: ensure order strictly belongs to the current logged-in customer
      const orderPhone = data?.customerMobile || data?.customerDetails?.mobile
      if (orderPhone && orderPhone !== customerPhone) {
        // Does not belong to this customer; discard
        setActiveOrder(null)
        setSelectedOrderId(null)
        return
      }
      setActiveOrder(data)
    } catch (err) {
      console.error('Failed to fetch order status:', err)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [selectedOrderId, isLoggedIn, customerPhone])

  useEffect(() => {
    if (!selectedOrderId || !isLoggedIn) return

    fetchSelectedOrder(false)

    // Poll every 5s if order is still active (not delivered and not cancelled)
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(() => {
      if (activeOrder && (activeOrder.status === 'delivered' || activeOrder.status === 'cancelled')) {
        clearInterval(pollingRef.current)
        return
      }
      fetchSelectedOrder(true)
    }, 5000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [selectedOrderId, isLoggedIn, activeOrder?.status, fetchSelectedOrder])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      refreshCustomerOrders?.(),
      fetchSelectedOrder(true),
    ])
    setRefreshing(false)
  }

  // 1. Not Logged In State: Clean & simple prompt to log in (no search box)
  if (!isLoggedIn || !customer) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto shadow-inner border border-orange-100">
            <ClipboardCheck size={38} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 m-0">Track Your Orders</h2>
            <p className="text-xs sm:text-sm text-slate-500 m-0 leading-relaxed max-w-xs mx-auto">
              Please log in with your phone number to view live kitchen updates and pickup tokens.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => openAuthModal?.()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
            >
              <User size={18} />
              <span>Log In to View Orders</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 px-5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft size={15} />
              <span>Browse Menu</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Logged In but No Orders
  if (!loading && (!customerOrders || customerOrders.length === 0) && !activeOrder) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <ShoppingBag size={36} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 m-0">No Orders Yet</h2>
            <p className="text-xs sm:text-sm text-slate-500 m-0 leading-relaxed">
              You haven't placed any orders with Chick Blast yet. Fresh, crispy chicken awaits!
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
          >
            <span>Explore Menu &amp; Order</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  if (loading && !activeOrder) {
    return <Loader fullScreen={false} text="Loading Order Status..." subtext="Syncing with kitchen queue" />
  }

  const currentStepIdx = activeOrder ? STATUS_ORDER.indexOf(activeOrder.status) : 0
  const isCancelled = activeOrder?.status === 'cancelled'
  const isDelivered = activeOrder?.status === 'delivered'
  const totalItemCount = activeOrder?.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-0 py-4 sm:py-6 space-y-4 pb-24">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Chick Blast" className="h-9 w-auto object-contain" />
          <div>
            <h1 className="text-base font-black text-slate-900 m-0 leading-tight">Order Status</h1>
            <p className="text-[11px] text-slate-400 font-semibold m-0">Live Kitchen Tracking</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title="Refresh Status"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-orange-500' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Multiple Orders Selector (Clean Pill Chips) */}
      {customerOrders && customerOrders.length > 1 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Recent Orders</span>
            <span className="text-[11px] font-semibold text-slate-400">{customerOrders.length} orders</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {customerOrders.map((o) => {
              const isSelected = (activeOrder?.id || selectedOrderId) === o.id
              const isOrderActive = ['new', 'preparing', 'packed'].includes(o.status)

              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setSelectedOrderId(o.id)
                    setActiveOrder(o)
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={isSelected ? 'text-orange-400 font-black' : 'text-slate-900'}>
                    #{o.orderNo}
                  </span>
                  <span className="capitalize text-[11px] opacity-80">({o.status})</span>
                  {isOrderActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeOrder && (
        <>
          {/* Main Hero Card: Token & Real-time Status */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 block">
                  ORDER TOKEN
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    #{activeOrder.orderNo}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {activeOrder.createdAt
                      ? new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
              </div>
              <StatusPill status={activeOrder.status} />
            </div>

            {/* Dynamic Friendly Message Banner */}
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
                isCancelled
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : isDelivered
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : activeOrder.status === 'packed'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : activeOrder.status === 'preparing'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-orange-50 border-orange-200 text-orange-900'
              }`}
            >
              {isCancelled ? (
                <span>This order was cancelled. Please contact staff for assistance.</span>
              ) : isDelivered ? (
                <>
                  <PartyPopper size={16} className="text-emerald-600 shrink-0" />
                  <span>Order delivered successfully. Enjoy your delicious food! 🎉</span>
                </>
              ) : activeOrder.status === 'packed' ? (
                <>
                  <PackageCheck size={16} className="text-indigo-600 shrink-0" />
                  <span>Your food is packed &amp; ready for pickup at Counter 1! 🛍️</span>
                </>
              ) : activeOrder.status === 'preparing' ? (
                <>
                  <Flame size={16} className="text-amber-600 shrink-0" />
                  <span>Chef is cooking your order hot &amp; fresh in the kitchen. 👨‍🍳</span>
                </>
              ) : (
                <>
                  <ClipboardCheck size={16} className="text-orange-600 shrink-0" />
                  <span>Order placed &amp; queued in kitchen. Preparation starting soon!</span>
                </>
              )}
            </div>

            {/* Visual 4-Step Progress Stepper */}
            {!isCancelled && (
              <div className="pt-2 pb-1">
                <div className="relative flex items-center justify-between">
                  {/* Track line behind steps */}
                  <div className="absolute inset-x-[12.5%] top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0, (currentStepIdx / 3) * 100)}%`,
                      }}
                    />
                  </div>

                  {TRACKER_STEPS.map((step, idx) => {
                    const Icon = step.icon
                    const isPassed = currentStepIdx >= idx
                    const isCurrent = currentStepIdx === idx

                    return (
                      <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all ${
                            isPassed
                              ? isCurrent
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-110 ring-4 ring-orange-100'
                                : 'bg-emerald-500 text-white shadow-2xs'
                              : 'bg-white text-slate-300 border border-slate-200'
                          }`}
                        >
                          <Icon size={18} className={isCurrent ? 'animate-pulse' : ''} />
                        </div>
                        <span
                          className={`text-[11px] font-bold mt-2 ${
                            isPassed ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Pickup & Order Information */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Collection Point
                  </span>
                  <p className="font-extrabold text-xs sm:text-sm text-slate-900 m-0">Counter 1 (Express)</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Customer
                  </span>
                  <p className="font-extrabold text-xs sm:text-sm text-slate-900 truncate m-0">
                    {activeOrder.customerName || customer.Name || 'Valued Guest'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1">
                <span>Ordered Items ({totalItemCount})</span>
                <span>Amount</span>
              </div>

              <div className="divide-y divide-slate-100">
                {activeOrder.items?.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FssaiBadge isVeg={item.label === 'Veg'} size={12} />
                      <span className="font-bold text-slate-800 truncate">{item.name}</span>
                      <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200 shrink-0">
                        x{item.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{Number(activeOrder.itemTotal || activeOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
              {activeOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span className="flex items-center gap-1">
                    <Tag size={12} /> Discount ({activeOrder.discountCode || 'Promo'})
                  </span>
                  <span>-₹{Number(activeOrder.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {activeOrder.taxAmount != null && (
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span>₹{Number(activeOrder.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-base text-emerald-600 font-black">
                  ₹{Number(activeOrder.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions: Print Bill or Back to Menu */}
            <div className="pt-3 space-y-2 border-t border-slate-100">
              {isDelivered && (
                <PrintBillButton
                  order={activeOrder}
                  variant="primary"
                  label="Download / Print Bill PDF"
                  className="w-full !py-3"
                />
              )}

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Order More Items</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
