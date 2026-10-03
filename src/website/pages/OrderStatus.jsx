import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  CheckCircle2,
  Flame,
  PackageCheck,
  PartyPopper,
  User,
  Phone,
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertCircle,
  ClipboardCheck,
  Search,
  Tag,
} from 'lucide-react'
import { ordersApi } from '../../shared/api'
import { useCart } from '../../shared/context/CartContext'
import { useCustomer } from '../../shared/context/CustomerContext'
import StatusPill from '../../shared/components/StatusPill'
import FssaiBadge from '../../shared/components/FssaiBadge'
import Loader from '../../shared/components/Loader'
import logoImg from '../../assets/logo.png'

const TRACKER_STEPS = [
  { key: 'new', label: 'Placed', icon: ClipboardCheck, desc: 'Kitchen received order' },
  { key: 'preparing', label: 'Preparing', icon: Flame, desc: 'Chef is cooking fresh' },
  { key: 'packed', label: 'Packed', icon: PackageCheck, desc: 'Ready for pickup' },
  { key: 'delivered', label: 'Delivered', icon: PartyPopper, desc: 'Order completed' },
]

const STATUS_ORDER = ['new', 'preparing', 'packed', 'delivered']

export default function OrderStatus() {
  const location = useLocation()
  const navigate = useNavigate()
  const { lastOrderId } = useCart()
  const { customer, orders: customerOrders } = useCustomer()

  const searchParams = new URLSearchParams(location.search)
  const queryOrderId = searchParams.get('id')
  const storedOrderId = (() => {
    try {
      const stored = localStorage.getItem('cb_last_order_id')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()

  const orderId = location.state?.orderId || queryOrderId || lastOrderId || storedOrderId
  const justPlacedFromLocation = location.state?.justPlaced || false

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(Boolean(orderId))
  const [refreshing, setRefreshing] = useState(false)
  const [itemsExpanded, setItemsExpanded] = useState(true)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(justPlacedFromLocation)
  const [searchInput, setSearchInput] = useState('')

  const [overlayTitle, setOverlayTitle] = useState(
    justPlacedFromLocation ? 'Order Placed! 🎉' : 'Order Confirmed!'
  )
  const [overlaySubtitle, setOverlaySubtitle] = useState(
    'Your order has been received & kitchen preparation is starting.'
  )
  const prevStatusRef = useRef(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      return
    }
    try {
      const data = await ordersApi.getById(orderId)
      setOrder(data)
    } catch (err) {
      console.error(err)
      setOrder(null)
    }
  }, [orderId])

  // Auto-dismiss overlay after 3 seconds
  useEffect(() => {
    if (showSuccessOverlay) {
      const timer = setTimeout(() => {
        setShowSuccessOverlay(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessOverlay])

  // Trigger celebration splash screen when order status changes to 'delivered'
  useEffect(() => {
    if (order) {
      if (prevStatusRef.current === null) {
        prevStatusRef.current = order.status
      } else if (order.status === 'delivered' && prevStatusRef.current !== 'delivered') {
        setOverlayTitle('Order Delivered! 🥳')
        setOverlaySubtitle('Your order has been delivered successfully. Enjoy your delicious meal!')
        setShowSuccessOverlay(true)
        prevStatusRef.current = order.status
      } else {
        prevStatusRef.current = order.status
      }
    }
  }, [order])

  useEffect(() => {
    if (!orderId) return
    let isMounted = true

    ordersApi.getById(orderId)
      .then((data) => {
        if (isMounted) {
          setOrder(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (isMounted) {
          setOrder(null)
          setLoading(false)
        }
      })

    const interval = setInterval(() => {
      ordersApi.getById(orderId)
        .then((data) => {
          if (isMounted) setOrder(data)
        })
        .catch(console.error)
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [orderId])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrder()
    setRefreshing(false)
  }

  const handleManualTrack = (e) => {
    if (e) e.preventDefault()
    if (!searchInput.trim()) return
    const clean = searchInput.trim().replace(/^#/, '')
    navigate(`/order-status?id=${clean}`)
  }

  if (!orderId) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner border border-orange-100">
            🔍
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-900 m-0">Track Your Order</h2>
            <p className="text-xs sm:text-sm text-gray-500 m-0">
              Enter your Order Number to check real-time kitchen progress.
            </p>
          </div>
        </div>

        {/* Manual Order ID Search Box */}
        <form onSubmit={handleManualTrack} className="bg-white border border-gray-200 p-4 rounded-3xl shadow-sm space-y-3">
          <label className="text-xs font-bold text-gray-700 block">Order ID or Token Number</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. ord-20260917-1"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field !pl-9 !py-2.5 text-sm font-semibold"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="btn-primary !px-5 !py-2.5 !rounded-xl text-xs font-black shrink-0 cursor-pointer disabled:opacity-50"
            >
              Track
            </button>
          </div>
        </form>

        {/* If customer is logged in, show their recent orders */}
        {customer && customerOrders?.length > 0 && (
          <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 m-0">Recent Orders</h3>
            <div className="divide-y divide-gray-100">
              {customerOrders.slice(0, 3).map((co) => (
                <button
                  key={co.id || co.orderNo}
                  type="button"
                  onClick={() => navigate(`/order-status?id=${co.id}`)}
                  className="w-full py-2.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <div>
                    <span className="font-extrabold text-sm text-gray-900 block">#{co.orderNo}</span>
                    <span className="text-[11px] text-gray-400 font-medium">₹{Number(co.totalAmount || 0).toFixed(0)}</span>
                  </div>
                  <StatusPill status={co.status} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/')}
            className="btn-outline !px-6 !py-2.5 !rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Menu
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loader fullScreen={false} text="Fetching Order Status..." subtext="Connecting to Chick Blast kitchen" />
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4">
        <AlertCircle size={48} className="mx-auto text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900 m-0">Order Not Found</h2>
        <p className="text-xs text-gray-500 m-0">We couldn't find an order with ID #{orderId}</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/order-status')}
            className="btn-outline !px-5 !py-2 !rounded-xl text-xs font-extrabold cursor-pointer"
          >
            Search Another
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary !px-5 !py-2 !rounded-xl text-xs font-extrabold cursor-pointer"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  const currentStepIdx = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const totalItemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0

  return (
    <>
      {/* Full Screen Green Order Placed Splash Overlay (Auto-dismisses in 3 seconds) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-b from-emerald-500 via-emerald-600 to-green-700 text-white flex flex-col items-center justify-between p-6 sm:p-10 overflow-y-auto animate-fade-in">
          {/* Top Bar with Auto-Dismiss Indicator */}
          <div className="w-full max-w-md flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/30 text-xs font-black uppercase tracking-wider text-white">
              <CheckCircle2 size={16} className="text-white" />
              {order.status === 'delivered' ? 'Delivered' : 'Order Confirmed'}
            </div>
            <button
              onClick={() => setShowSuccessOverlay(false)}
              className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs border border-white/30 transition-colors cursor-pointer"
            >
              Skip ✕
            </button>
          </div>

          {/* Central Giant Tick Icon & Dynamic Message */}
          <div className="flex flex-col items-center text-center space-y-4 my-auto py-6">
            <div className="relative my-2">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-950/40 ring-8 ring-white/30 animate-tick-pop animate-ripple mx-auto">
                <svg
                  className="w-20 h-20 sm:w-24 sm:h-24 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h1 className="text-3xl sm:text-4xl font-black text-white m-0 tracking-tight drop-shadow-md">
                {overlayTitle}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 font-semibold m-0 leading-snug">
                {overlaySubtitle}
              </p>
            </div>

            {/* Token Card */}
            <div className="w-full max-w-sm bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-2 text-center my-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-200 block">
                🎟️ YOUR ORDER NUMBER / TOKEN
              </span>
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-white m-0 drop-shadow-lg">
                #{order.orderNo}
              </div>
              <p className="text-xs text-emerald-100 font-semibold m-0 pt-1">
                Quote this token number when collecting your food
              </p>

              <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                <span>{order.customerName}</span>
                <span>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Bottom 3-Second Progress Bar & Action */}
          <div className="w-full max-w-sm space-y-3 pb-4">
            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div className="bg-white h-full animate-progress-3s rounded-full" />
            </div>
            <button
              onClick={() => setShowSuccessOverlay(false)}
              className="w-full py-3 px-6 rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 text-sm font-black shadow-xl shadow-emerald-950/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border-none"
            >
              <span>View Order Details</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-lg sm:max-w-xl mx-auto space-y-5 pb-28">
        {/* Brand Header */}
        <div className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Chick Blast" className="h-9 w-auto object-contain" />
            <div>
              <h2 className="text-lg font-black text-gray-900 m-0 leading-tight">Live Order Tracking</h2>
              <p className="text-xs text-gray-400 font-semibold m-0">Real-time Kitchen Progress</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors border border-orange-200/60 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Refresh Order Status"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Highlighted Order Token Banner */}
        <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white text-center shadow-xl shadow-emerald-600/20 border border-emerald-400/30 overflow-hidden">
          <div className="relative z-10 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-widest text-white border border-white/30">
              <CheckCircle2 size={13} /> YOUR ORDER NO
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white m-0 drop-shadow-md">
              #{order.orderNo}
            </h1>
            <p className="text-xs text-emerald-100 font-bold m-0 max-w-sm mx-auto">
              Please quote this Order Number when picking up or receiving your food
            </p>
          </div>
        </div>

        {/* Visual Step Tracker Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                STATUS UPDATE
              </span>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 m-0">
                {isCancelled
                  ? 'Order Cancelled'
                  : order.status === 'new'
                  ? 'Order Placed Successfully'
                  : order.status === 'preparing'
                  ? 'Meals Being Prepared'
                  : order.status === 'packed'
                  ? 'Packed & Ready for Pickup'
                  : 'Order Delivered'}
              </h3>
            </div>
            <StatusPill status={order.status} />
          </div>

          {/* Step Progress Bar & Icons */}
          {!isCancelled && (
            <div className="space-y-3 pt-1">
              <div className="relative flex items-center justify-between">
                <div className="absolute inset-x-[12.5%] top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
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
                    <div key={step.key} className="flex-1 flex justify-center relative z-10">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          isPassed
                            ? isCurrent
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-110 ring-4 ring-emerald-100'
                              : 'bg-emerald-500 text-white shadow-2xs'
                            : 'bg-white text-gray-300 border border-gray-200'
                        }`}
                      >
                        <Icon size={18} className={isCurrent ? 'animate-pulse' : ''} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-start justify-between pt-1">
                {TRACKER_STEPS.map((step, idx) => {
                  const isPassed = currentStepIdx >= idx

                  return (
                    <div key={step.key} className="flex-1 text-center space-y-0.5 px-1">
                      <p
                        className={`text-xs font-bold m-0 leading-tight ${
                          isPassed ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-gray-400 hidden sm:block font-medium m-0">{step.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order Info & Customer Details Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="space-y-0.5">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 m-0">Order #{order.orderNo}</h4>
              <p className="text-[11px] text-gray-400 font-medium m-0">ID: {order.id}</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 shrink-0">
              <Clock size={13} className="text-gray-400" />
              <span>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just Now'}
              </span>
            </div>
          </div>

          {/* Collection Point Banner */}
          <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-orange-600" />
              <span className="font-extrabold text-orange-950 uppercase tracking-wide">
                Counter Collection Point
              </span>
            </div>
            <span className="text-[11px] text-orange-700 font-bold">
              Counter 1
            </span>
          </div>

          {/* Customer Details Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <User size={18} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Customer Name</span>
                <p className="font-extrabold text-xs sm:text-sm text-gray-900 truncate m-0">{order.customerName || 'Guest'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Phone size={18} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Mobile Number</span>
                <p className="font-extrabold text-xs sm:text-sm text-gray-900 truncate m-0">+91 {order.customerMobile}</p>
              </div>
            </div>
          </div>

          {/* Ordered Items Breakdown */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setItemsExpanded(!itemsExpanded)}
              className="w-full p-3.5 bg-white flex items-center justify-between border-none cursor-pointer hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <ShoppingBag size={15} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-black text-gray-900 block leading-snug">
                    Ordered Dishes ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">Click to {itemsExpanded ? 'collapse' : 'view items'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  ₹{Number(order.totalAmount || 0).toFixed(0)}
                </span>
                {itemsExpanded ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>
            </button>

            {itemsExpanded && (
              <div className="p-3.5 pt-0 space-y-2.5 bg-white border-t border-gray-100">
                <div className="divide-y divide-gray-100 pt-1">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 first:pt-1 last:pb-0 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FssaiBadge isVeg={item.label === 'Veg'} size={13} />
                          <span className="font-bold text-gray-900 truncate">{item.name}</span>
                          <span className="text-[11px] font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100">
                            {item.quantity}x
                          </span>
                        </div>
                        <span className="font-black text-gray-900 ml-2 shrink-0">
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>
                      {item.type === 'combo' && item.components?.length > 0 && (
                        <p className="text-[10px] text-orange-700 font-medium pl-5 m-0">
                          Includes: {item.components.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Subtotal & Total Bill Summary */}
                <div className="pt-3 border-t border-gray-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                    <span>Items Subtotal</span>
                    <span>₹{Number(order.itemTotal || order.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  {order.taxAmount != null && (
                    <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                      <span>GST Tax (5%)</span>
                      <span>₹{Number(order.taxAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {order.deliveryFee != null && (
                    <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                      <span>Delivery Fee</span>
                      <span>{order.deliveryFee === 0 ? 'FREE' : `₹${Number(order.deliveryFee).toFixed(2)}`}</span>
                    </div>
                  )}
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                      <span className="flex items-center gap-1">
                        <Tag size={12} /> Discount ({order.discountCode || 'Promo'})
                      </span>
                      <span>-₹{Number(order.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 flex justify-between items-center text-xs font-bold border-t border-gray-100">
                    <span className="text-gray-900 font-extrabold text-sm">Grand Total</span>
                    <span className="text-emerald-600 font-black text-lg">₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
