import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export default function Toast({ toast, message, type, onClose }) {
  const activeToast = toast || (message ? { message, type: type || 'info' } : null)

  useEffect(() => {
    if (!activeToast) return
    const timer = setTimeout(() => {
      onClose?.()
    }, 4000)
    return () => clearTimeout(timer)
  }, [activeToast, onClose])

  if (!activeToast) return null

  const isSuccess = activeToast.type === 'success'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/40 animate-in fade-in slide-in-from-bottom-4 duration-300 bg-slate-900/90 text-white min-w-[280px]">
      {isSuccess ? (
        <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
      ) : (
        <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
      )}
      <span className="text-sm font-semibold flex-1">{activeToast.message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
      >
        <X size={16} />
      </button>
    </div>
  )
}
