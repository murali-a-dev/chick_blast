import { useState, useEffect, useMemo } from 'react'
import moment from 'moment'
import { Search, Phone, ChevronRight, ShoppingBag, IndianRupee, Clock, X } from 'lucide-react'
import { ordersApi } from '../../shared/api'
import OrderBadge from '../../shared/components/OrderBadge'
import StatusPill from '../../shared/components/StatusPill'
import GradientModal from '../../shared/components/GradientModal'
import OrderDetailsContent from '../../shared/components/OrderDetailsContent'
import ModernDatePicker from '../../shared/components/ModernDatePicker'
import ModernSelect from '../../shared/components/ModernSelect'
import Loader from '../../shared/components/Loader'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'Ordered' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'packed', label: 'Packed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function OrderSummary() {
  const defaultFrom = moment().startOf('month').format('YYYY-MM-DD')
  const defaultTo = moment().format('YYYY-MM-DD')

  const [orders, setOrders] = useState([])
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const params = {}
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
      const data = await ordersApi.getAll(params)
      setOrders(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const params = { fromDate: defaultFrom, toDate: defaultTo }
    ordersApi.getAll(params)
      .then((data) => {
        if (isMounted) {
          setOrders(data || [])
          setSearched(true)
        }
      })
      .catch(console.error)

    return () => {
      isMounted = false
    }
  }, [defaultFrom, defaultTo])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerMobile && o.customerMobile.includes(q)) ||
        (o.orderNo && String(o.orderNo).toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 m-0">Order Summary</h2>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5 m-0">Filtered order history & sales reports</p>
      </div>

      {/* Date & Filter Card - Fully Mobile Responsive */}
      <div className="bg-white border border-slate-200/80 p-3.5 sm:p-5 rounded-2xl shadow-2xs space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-end gap-3 sm:gap-4">
          <div className="w-full md:w-56">
            <ModernDatePicker
              label="From Date"
              value={fromDate}
              onChange={(d) => setFromDate(d)}
            />
          </div>
          <div className="w-full md:w-56">
            <ModernDatePicker
              label="To Date"
              value={toDate}
              onChange={(d) => setToDate(d)}
            />
          </div>
          <div className="w-full md:w-auto pt-1 md:pt-0">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary w-full sm:w-auto !py-2.5 !px-5 flex items-center justify-center gap-2 font-bold shadow-xs cursor-pointer text-xs sm:text-sm"
            >
              <Search size={16} />
              <span>{loading ? 'Searching...' : 'Search Range'}</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by customer name, phone, or #order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-slate-800 focus:bg-white transition-all font-medium text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 border-none bg-transparent"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-full sm:w-48">
            <ModernSelect
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="Filter Status"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {searched && !loading && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
              <ShoppingBag size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider m-0 truncate">Matching Orders</p>
              <h4 className="text-base sm:text-xl font-black text-slate-900 m-0 mt-0.5">{filteredOrders.length}</h4>
            </div>
          </div>
          <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <IndianRupee size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider m-0 truncate">Filtered Revenue</p>
              <h4 className="text-base sm:text-xl font-black text-slate-900 m-0 mt-0.5">₹{totalRevenue.toFixed(2)}</h4>
            </div>
          </div>
        </div>
      )}

      {/* Orders List Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Loading state */}
        {loading ? (
          <div className="py-12">
            <Loader fullScreen={false} size="sm" text="Searching order history..." subtext="" />
          </div>
        ) : !searched ? (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">Select dates and click search</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">No orders matching the filter criteria</div>
        ) : (
          <>
            {/* Mobile View: Cards List (block md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <OrderBadge orderNo={order.orderNo} />
                    <div className="flex items-center gap-1.5">
                      <StatusPill status={order.status} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="font-bold text-slate-900 truncate pr-2">
                      {order.customerName}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-medium shrink-0">
                      <Clock size={13} />
                      <span>{moment(order.createdAt).format('DD MMM, hh:mm A')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 text-xs border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Phone size={13} className="text-slate-400" />
                      <span>{order.customerMobile}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-900">
                        ₹{(order.totalAmount || 0).toFixed(2)}
                      </span>
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table (hidden md:block) */}
            <div className="hidden md:block admin-table border-none shadow-none rounded-none">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Order No</th>
                    <th>Customer Details</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)}>
                      <td className="text-slate-500 font-medium">{moment(order.createdAt).format('DD MMM YYYY, hh:mm A')}</td>
                      <td><OrderBadge orderNo={order.orderNo} /></td>
                      <td>
                        <p className="font-bold text-slate-900 m-0">{order.customerName}</p>
                        <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">{order.customerMobile}</p>
                      </td>
                      <td className="font-extrabold text-slate-900">
                        ₹{(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td><StatusPill status={order.status} /></td>
                    </tr>
                  ))}
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
    </div>
  )
}
