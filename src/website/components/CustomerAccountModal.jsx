import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  User,
  Phone,
  Clock,
  ShoppingBag,
  Edit2,
  Check,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import { useCustomer } from '../../shared/context/CustomerContext'
import { useCart } from '../../shared/context/CartContext'
import StatusPill from '../../shared/components/StatusPill'
import FssaiBadge from '../../shared/components/FssaiBadge'
import OrderDetailsContent from '../../shared/components/OrderDetailsContent'
import PrintBillButton from '../../shared/components/PrintBillButton'

export default function CustomerAccountModal() {
  const navigate = useNavigate()
  const {
    customer,
    isLoggedIn,
    orders,
    loadingOrders,
    isAccountModalOpen,
    closeAccountModal,
    logoutCustomer,
    updateCustomerName,
    refreshCustomerOrders,
  } = useCustomer()

  const { setCustomerName, setCustomerMobile } = useCart()

  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'profile'
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(() => customer?.Name || customer?.name || '')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null)

  const prevCustomerNameRef = useRef(customer?.Name || customer?.name)
  const currentName = customer?.Name || customer?.name || ''
  if (currentName !== prevCustomerNameRef.current) {
    prevCustomerNameRef.current = currentName
    setNameInput(currentName)
  }

  const modalRef = useRef(null)

  // Strictly prevent background screen scrolling when modal is open
  useEffect(() => {
    if (!isAccountModalOpen) return

    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalTouchAction = document.body.style.touchAction

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.documentElement.style.overflow = 'hidden'

    const preventBackdropScroll = (e) => {
      // If event occurs outside modal content or on backdrop, prevent scroll propagation
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        e.preventDefault()
      }
    }

    window.addEventListener('wheel', preventBackdropScroll, { passive: false })
    window.addEventListener('touchmove', preventBackdropScroll, { passive: false })

    return () => {
      document.body.style.overflow = originalBodyOverflow || ''
      document.body.style.touchAction = originalTouchAction || ''
      document.documentElement.style.overflow = originalHtmlOverflow || ''
      window.removeEventListener('wheel', preventBackdropScroll)
      window.removeEventListener('touchmove', preventBackdropScroll)
    }
  }, [isAccountModalOpen])


  if (!isAccountModalOpen || !isLoggedIn || !customer) return null

  const handleSaveName = async (e) => {
    if (e) e.preventDefault()
    if (!nameInput.trim()) {
      setErrorMsg('Customer name cannot be empty')
      return
    }

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await updateCustomerName(nameInput.trim())
      setCustomerName(nameInput.trim())
      setEditingName(false)
      setSuccessMsg('Profile details updated successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logoutCustomer()
    setCustomerName('')
    setCustomerMobile('')
    closeAccountModal()
  }

  const handleTrackOrder = (orderId) => {
    closeAccountModal()
    navigate('/order-status', { state: { orderId } })
  }

  const createdAtFormatted = customer.CreatedAt || customer.createdAt
    ? new Date(customer.CreatedAt || customer.createdAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent Member'

  return (
    <div
      className="modal-gradient-bg !p-2.5 sm:!p-4 animate-fade-in"
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <div
        ref={modalRef}
        className="modal-content !max-w-xl !rounded-3xl border border-white/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Account Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-orange-950 p-5 sm:p-6 text-white relative shrink-0">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {/* Header Quick Logout Icon Button */}
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md flex items-center justify-center text-red-300 hover:text-red-100 border border-red-500/30 cursor-pointer transition-transform active:scale-90"
              title="Sign Out / Logout"
            >
              <LogOut size={15} />
            </button>

            {/* Close Button */}
            <button
              onClick={closeAccountModal}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border-none cursor-pointer transition-transform active:scale-90"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-2xl font-black text-white">
                {(customer.Name || customer.name) ? (customer.Name || customer.name).charAt(0).toUpperCase() : '👤'}
              </div>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white m-0 truncate">
                  {customer.Name || customer.name || 'Customer'}
                </h2>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-300 flex-wrap">
                <span className="font-semibold flex items-center gap-1">
                  <Phone size={13} className="text-orange-400" />
                  +91 {customer.MobileNo || customer.mobile}
                </span>
                <span className="text-gray-500">•</span>
                <span className="font-medium flex items-center gap-1 text-gray-400">
                  <Calendar size={13} />
                  Joined {createdAtFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/10">
            <button
              onClick={() => {
                setActiveTab('orders')
                setSelectedOrderDetails(null)
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/15'
              }`}
            >
              <ShoppingBag size={14} />
              <span>Order History ({orders.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile')
                setSelectedOrderDetails(null)
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/15'
              }`}
            >
              <User size={14} />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content with Strict Overscroll Contain */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-4 overscroll-contain">
          {/* TAB 1: PREVIOUS ORDER HISTORY */}
          {activeTab === 'orders' && (
            selectedOrderDetails ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderDetails(null)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-200 shadow-2xs"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Order History</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">
                      #{selectedOrderDetails.orderNo || (selectedOrderDetails.id ? String(selectedOrderDetails.id).split('-').pop() : '1')}
                    </span>
                    <StatusPill status={selectedOrderDetails.status} />
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
                  <OrderDetailsContent order={selectedOrderDetails} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900 m-0">Previous Orders</h3>
                  <p className="text-xs text-gray-500 m-0">View your delicious past orders and receipts</p>
                </div>

                <button
                  onClick={refreshCustomerOrders}
                  disabled={loadingOrders}
                  className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-orange-600 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Refresh order history"
                >
                  <RefreshCw size={13} className={loadingOrders ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {loadingOrders && orders.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-gray-500">Loading your order history...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-3">
                  <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl border border-orange-100 shadow-inner">
                    🍗
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-gray-900 m-0">No Orders Placed Yet</h4>
                    <p className="text-xs text-gray-500 m-0 max-w-xs mx-auto">
                      Explore our delicious fried chicken, crispy burgers, momos and drinks.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      closeAccountModal()
                      navigate('/')
                    }}
                    className="btn-primary !px-5 !py-2.5 !rounded-xl text-xs font-black shadow-md shadow-orange-500/25 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Browse Menu</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord, idx) => {
                    const orderId = ord.id || ord.orderId
                    const orderNo = ord.orderNo || (orderId ? orderId.split('-').pop() : '1')
                    const orderDate = ord.createdAt || ord.CreatedAt
                      ? new Date(ord.createdAt || ord.CreatedAt).toLocaleDateString([], {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently'
                    const itemCount = ord.items?.reduce((s, i) => s + i.quantity, 0) || 0

                    return (
                      <div
                        key={orderId || `ord-${idx}`}
                        onClick={() => setSelectedOrderDetails(ord)}
                        className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow space-y-3 cursor-pointer"
                      >
                        {/* Order Card Top Bar */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-black text-xs">
                              #{orderNo}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                              <Clock size={12} /> {orderDate}
                            </span>
                          </div>

                          <StatusPill status={ord.status || 'new'} />
                        </div>

                        {/* Items List */}
                        <div className="space-y-1.5">
                          {ord.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs text-gray-700"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FssaiBadge isVeg={item.label === 'Veg'} size={11} />
                                <span className="font-semibold text-gray-900 truncate">
                                  {item.name}
                                </span>
                                <span className="text-gray-400 font-bold">×{item.quantity}</span>
                              </div>
                              <span className="font-bold text-gray-900 shrink-0">
                                ₹{(item.price * item.quantity).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Card Footer */}
                        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">
                              Total Amount ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                            </span>
                            <span className="text-base font-black text-gray-900">
                              ₹{(ord.totalAmount || 0).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-200/80 flex items-center gap-1 transition-colors cursor-pointer"
                              title="View complete order receipt"
                            >
                              <span>Details</span>
                            </button>

                            {ord.status === 'delivered' && (
                              <PrintBillButton order={ord} variant="compact" label="Print Bill" />
                            )}

                            {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                              <button
                                onClick={() => handleTrackOrder(orderId)}
                                className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-extrabold text-xs border border-orange-200/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>Track</span>
                                <ExternalLink size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        )}

          {/* TAB 2: PROFILE & EDIT DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-900 m-0">Customer Information</h3>
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
                  <Check size={16} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-200">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Editable Name Field with Logout Icon Button right next to Edit Profile button */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Customer Full Name
                </label>

                {editingName ? (
                  <form onSubmit={handleSaveName} className="flex gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="input-field text-sm font-semibold !py-2 flex-1"
                      placeholder="Enter customer name"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary !px-4 !py-2 !rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingName(false)
                        setNameInput(customer.Name || customer.name || '')
                      }}
                      className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs border-none cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <User size={18} className="text-gray-400" />
                      <span className="font-extrabold text-sm text-gray-900">
                        {customer.Name || customer.name || 'Not Set'}
                      </span>
                    </div>

                    {/* Action Buttons: Edit Profile Button + Logout Icon Button Right Next to It */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingName(true)}
                        className="p-1.5 px-2.5 rounded-lg text-orange-600 hover:bg-orange-50 border border-orange-200/70 bg-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Edit Name"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="p-1.5 px-2.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200/70 bg-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Sign Out / Logout"
                      >
                        <LogOut size={13} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Number Field (Locked) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Verified Mobile Number
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <Phone size={18} className="text-gray-400" />
                    <span className="font-extrabold text-sm text-gray-900">
                      +91 {customer.MobileNo || customer.mobile}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck size={13} /> Verified
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 m-0">
                  Mobile number is locked as your primary login identifier.
                </p>
              </div>

              {/* Explicit Sign Out / Logout Option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 border border-red-200 transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Log Out of Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
