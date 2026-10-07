import { Printer, Download } from 'lucide-react'
import { printOrderBill } from '../utils/printBill'

/**
 * PrintBillButton
 * Shows a PDF / Print Bill button for delivered orders.
 *
 * Props:
 * - order: The order object
 * - variant: 'primary' | 'outline' | 'compact' | 'ghost'
 * - label: Custom button text (default: "Print PDF Bill")
 * - showOnlyIfDelivered: boolean (default true)
 * - className: custom Tailwind classes
 */
export default function PrintBillButton({
  order,
  variant = 'primary',
  label = 'Print PDF Bill',
  showOnlyIfDelivered = true,
  className = '',
}) {
  if (!order) return null

  const isDelivered = order.status === 'delivered'
  if (showOnlyIfDelivered && !isDelivered) {
    return null
  }

  const handlePrint = (e) => {
    e.stopPropagation()
    printOrderBill(order)
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handlePrint}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200/80 font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-2xs ${className}`}
        title="Print / Download PDF Bill"
      >
        <Printer size={13} />
        <span>{label}</span>
      </button>
    )
  }

  if (variant === 'outline') {
    return (
      <button
        type="button"
        onClick={handlePrint}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-orange-50/50 text-slate-800 hover:text-orange-600 border border-slate-200 hover:border-orange-300 font-bold text-xs sm:text-sm cursor-pointer transition-all active:scale-95 shadow-2xs ${className}`}
        title="Print / Save Order Invoice as PDF"
      >
        <Printer size={16} className="text-orange-500" />
        <span>{label}</span>
      </button>
    )
  }

  // Default: Primary prominent button
  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm cursor-pointer transition-all shadow-md shadow-orange-500/25 active:scale-95 border border-white/20 ${className}`}
      title="Print / Save Official Order Bill (PDF)"
    >
      <Printer size={16} className="text-white shrink-0" />
      <span>{label}</span>
    </button>
  )
}
