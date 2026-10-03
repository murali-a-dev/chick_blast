import { useState, useEffect, useCallback } from 'react'
import moment from 'moment'
import { RefreshCw, Phone, ShoppingBag } from 'lucide-react'
import { ordersApi } from '../../shared/api'
import { STATUS_LABELS } from '../../shared/constants'
import OrderBadge from '../../shared/components/OrderBadge'
import StatusPill from '../../shared/components/StatusPill'
import GradientModal from '../../shared/components/GradientModal'
import OrderDetailsContent from '../../shared/components/OrderDetailsContent'
import DeliveryModal from '../components/DeliveryModal'
import ConfirmModal from '../components/ConfirmModal'
import Toast from '../../shared/components/Toast'
import { useToast } from '../../shared/hooks/useToast'
import Loader from '../../shared/components/Loader'
import StatusActionMenu from '../components/StatusActionMenu'

export default function LiveOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [deliveryOrder, setDeliveryOrder] = useState(null)
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const { toast, showToast, hideToast } = useToast()

  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersApi.refresh()
      setOrders(data || [])
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    ordersApi.refresh()
      .then((data) => {
        if (isMounted) setOrders(data || [])
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    const interval = setInterval(() => {
      ordersApi.refresh()
        .then((data) => {
          if (isMounted) setOrders(data || [])
        })
        .catch(console.error)
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const handleDropdownSelect = async (order, targetStatus) => {
    if (!targetStatus) return
    if (targetStatus === 'delivered') {
      setDeliveryOrder(order)
      return
    }
    if (targetStatus === 'cancelled') {
      setCancelModalOrder(order)
      return
    }

    setActionLoading(order.id)
    try {
      await ordersApi.updateStatus(order.id, targetStatus)
      await fetchOrders()
      showToast(`Order #${order.orderNo} updated to ${STATUS_LABELS[targetStatus] || targetStatus}!`, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return
    setCancelling(true)
    try {
      await ordersApi.updateStatus(cancelModalOrder.id, 'cancelled')
      await fetchOrders()
      showToast(`Order #${cancelModalOrder.orderNo} has been cancelled!`, 'success')
      setCancelModalOrder(null)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCancelling(false)
    }
  }

  const handleDeliver = async (payment) => {
    try {
      await ordersApi.deliver(deliveryOrder.id, payment)
      const ordNo = deliveryOrder.orderNo
      setDeliveryOrder(null)
      await fetchOrders()
      showToast(`Order ${ordNo} delivered successfully!`, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Filter tabs logic
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true
    if (activeTab === 'new') return o.status === 'new'
    if (activeTab === 'preparing') return o.status === 'preparing'
    if (activeTab === 'packed') return o.status === 'packed'
    return true
  })

  const getTabCount = (tabKey) => {
    if (tabKey === 'all') return orders.length
    if (tabKey === 'new') return orders.filter((o) => o.status === 'new').length
    if (tabKey === 'preparing') return orders.filter((o) => o.status === 'preparing').length
    if (tabKey === 'packed') return orders.filter((o) => o.status === 'packed').length
    return 0
  }

  return (
    <div className="space-y-5">
      <Toast toast={toast} onClose={hideToast} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 m-0">Live Orders</h2>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0" title="Live Auto-Sync Active" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0 hidden sm:block">Auto-refreshing every 5 seconds</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary !py-2 !px-3.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Filter Tabs (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        {[
          { key: 'all', label: 'All Active' },
          { key: 'new', label: 'Ordered' },
          { key: 'preparing', label: 'Preparing' },
          { key: 'packed', label: 'Packed' },
        ].map((tab) => {
          const count = getTabCount(tab.key)
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap border cursor-pointer transition-all ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <Loader fullScreen={false} size="sm" text="Fetching live orders..." subtext="" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ShoppingBag size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-600 font-semibold m-0">No active live orders right now</p>
            <p className="text-xs text-slate-400 m-0 mt-1">New incoming orders will appear here automatically</p>
          </div>
        ) : (
          <>
            {/* Mobile View Cards (block md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const isLoadingThis = actionLoading === order.id

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="p-3.5 sm:p-4 hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer space-y-3"
                  >
                    {/* Top Row: Order No, Elapsed Time, Fulfillment & Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <OrderBadge orderNo={order.orderNo} />
                        <span className="text-[11px] text-slate-400 font-medium">
                          {moment(order.createdAt).fromNow()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusPill status={order.status} />
                      </div>
                    </div>

                    {/* Customer & Amount Summary */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 truncate pr-2">{order.customerName}</span>
                        <span className="font-extrabold text-sm text-slate-900 shrink-0">
                          ₹{(order.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <a
                          href={`tel:${order.customerMobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 hover:text-orange-600 no-underline"
                        >
                          <Phone size={12} className="text-slate-500" />
                          <span>{order.customerMobile}</span>
                        </a>
                      </div>
                    </div>

                    {/* Items breakdown with combo expansion */}
                    {order.items && order.items.length > 0 && (
                      <div className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1.5">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between font-medium text-slate-800">
                              <span>
                                {i.name} <span className="text-orange-600 font-bold">x{i.quantity}</span>
                              </span>
                              <span className="text-slate-500 font-semibold">₹{(i.price * i.quantity).toFixed(2)}</span>
                            </div>
                            {i.components && i.components.length > 0 && (
                              <div className="text-[11px] text-slate-500 pl-3 border-l-2 border-orange-200 space-y-0.5">
                                {i.components.map((c, cIdx) => (
                                  <div key={cIdx}>↳ {c.name} (x{c.quantity})</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div
                      className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Update Status</span>
                      <StatusActionMenu
                        order={order}
                        onSelectAction={handleDropdownSelect}
                        loading={isLoadingThis}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block admin-table border-none shadow-none rounded-none">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Order No</th>
                    <th>Customer Name</th>
                    <th>Mobile</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const isLoadingThis = actionLoading === order.id

                    return (
                      <tr key={order.id} onClick={() => setSelectedOrder(order)}>
                        <td className="text-slate-500 font-medium">{moment(order.createdAt).format('DD MMM, hh:mm A')}</td>
                        <td><OrderBadge orderNo={order.orderNo} /></td>
                        <td className="font-bold text-slate-900">{order.customerName}</td>
                        <td className="text-slate-600 font-medium">{order.customerMobile}</td>
                        <td className="font-extrabold text-slate-900">
                          ₹{(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td><StatusPill status={order.status} /></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <StatusActionMenu
                            order={order}
                            onSelectAction={handleDropdownSelect}
                            loading={isLoadingThis}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      <GradientModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        maxWidth="max-w-lg"
      >
        <OrderDetailsContent order={selectedOrder} />
      </GradientModal>

      {/* Delivery Confirmation Modal */}
      <DeliveryModal
        isOpen={!!deliveryOrder}
        onClose={() => setDeliveryOrder(null)}
        order={deliveryOrder}
        onConfirm={handleDeliver}
      />

      {/* Cancel Order Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
        title={`Cancel Order #${cancelModalOrder?.orderNo || ''}?`}
        message={`Are you sure you want to cancel Order #${cancelModalOrder?.orderNo || ''} for ${cancelModalOrder?.customerName || 'customer'}? This status update will notify the customer.`}
        confirmText="Yes, Cancel Order"
        cancelText="Keep Order"
        variant="danger"
      />
    </div>
  )
}
