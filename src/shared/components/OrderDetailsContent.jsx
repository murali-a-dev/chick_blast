import moment from 'moment'
import { User, Phone, Calendar, Clock, ShoppingBag, CheckCircle2 } from 'lucide-react'
import OrderBadge from './OrderBadge'
import StatusPill from './StatusPill'
import FssaiBadge from './FssaiBadge'
import logoImg from '../../assets/logo.png'

export default function OrderDetailsContent({ order }) {
  if (!order) return null

  const totalItemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top Header & Store Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <img
            src={logoImg}
            alt="Chick Blast"
            className="h-8 w-auto object-contain"
          />
          <div>
            <h4 className="text-sm font-bold text-slate-900 m-0 leading-tight">Chick Blast Store</h4>
            <p className="text-[10px] text-slate-400 font-semibold m-0 mt-0.5 uppercase tracking-wider">Order Invoice</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OrderBadge orderNo={order.orderNo} />
          <StatusPill status={order.status} />
        </div>
      </div>

      {/* Customer & Timestamp Info Card */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Customer Details */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Customer</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <User size={13} className="text-slate-500 shrink-0" />
              <span className="truncate">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <a
                href={`tel:${order.customerMobile}`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-orange-600 font-semibold no-underline text-xs"
              >
                <Phone size={12} className="text-slate-400" />
                <span>{order.customerMobile}</span>
              </a>
            </div>
          </div>

          {/* Date & Time Details */}
          <div className="space-y-1 sm:border-l sm:border-slate-200/80 sm:pl-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Date & Time</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Calendar size={13} className="text-slate-500 shrink-0" />
              <span>{moment(order.createdAt).format('DD MMM YYYY')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 font-medium pt-0.5">
              <Clock size={13} className="text-slate-400 shrink-0" />
              <span>{moment(order.createdAt).format('hh:mm A')} ({moment(order.createdAt).fromNow()})</span>
            </div>
          </div>
        </div>

        {/* Fulfillment Type */}
        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Fulfillment Type:</span>
          {order.orderType === 'dine-in' ? (
            <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              🍽️ Dine-In {order.tableNo ? `(Table ${order.tableNo})` : ''}
            </span>
          ) : order.orderType === 'delivery' ? (
            <span className="font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
              🛵 Delivery {order.deliveryAddress ? `(${order.deliveryAddress})` : ''}
            </span>
          ) : (
            <span className="font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
              🥡 Takeaway
            </span>
          )}
        </div>
      </div>

      {/* Ordered Items Table List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-slate-500" /> Order Summary
          </span>
          <span>{totalItemCount} Items</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-50/80 px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
            <span className="col-span-7">Item Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-3 text-right">Price</span>
          </div>

          {/* Items Rows */}
          <div className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="px-3.5 py-2.5 text-xs">
                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-7 flex items-center gap-2 min-w-0 pr-2">
                    <FssaiBadge isVeg={item.label === 'Veg'} size={12} />
                    <span className="font-bold text-slate-900 truncate">{item.name}</span>
                  </div>
                  <span className="col-span-2 text-center font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md text-[11px]">
                    x{item.quantity}
                  </span>
                  <div className="col-span-3 text-right">
                    <span className="font-extrabold text-slate-900 block">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                    {item.quantity > 1 && (
                      <span className="block text-[10px] text-slate-400 font-normal">₹{item.price} ea</span>
                    )}
                  </div>
                </div>
                {item.components && item.components.length > 0 && (
                  <div className="mt-1 pl-5 border-l-2 border-orange-200 text-[11px] text-slate-500 space-y-0.5">
                    {item.components.map((c, cIdx) => (
                      <div key={cIdx}>↳ {c.name} (x{c.quantity})</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bill Breakdown */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Items Subtotal</span>
          <span className="font-semibold text-slate-800">
            ₹{(order.subtotal || order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || order.totalAmount || 0).toFixed(2)}
          </span>
        </div>
        {order.tax > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>GST (5%)</span>
            <span className="font-semibold text-slate-800">₹{order.tax.toFixed(2)}</span>
          </div>
        )}
        {order.deliveryFee !== undefined && (
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span className="font-semibold text-slate-800">
              {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toFixed(2)}`}
            </span>
          </div>
        )}
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600 font-semibold">
            <span>Coupon Discount {order.discountCode ? `(${order.discountCode})` : ''}</span>
            <span>-₹{order.discountAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Bill Calculation & Grand Total Box */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">Total Amount</span>
          <span className="text-[11px] text-slate-400">All taxes & charges included</span>
        </div>
        <span className="text-2xl font-black text-white">
          ₹{(order.totalAmount || 0).toFixed(2)}
        </span>
      </div>

      {/* Payment Information if present */}
      {order.payment && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>Payment Mode: {order.payment.mode}</span>
          </div>
          {order.payment.splitDetails && (
            <div className="text-emerald-800 font-semibold pt-1 flex flex-wrap gap-2">
              {Object.entries(order.payment.splitDetails).map(([key, val]) =>
                val > 0 ? (
                  <span key={key} className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                    {key}: <strong>₹{val}</strong>
                  </span>
                ) : null
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
