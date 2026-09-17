import { useEffect } from 'react'
import { AlertTriangle, XCircle, X, Loader2 } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  loading = false,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      bgIcon: 'bg-rose-50 text-rose-600 border-rose-100',
      btnConfirm: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
      icon: XCircle,
    },
    warning: {
      bgIcon: 'bg-amber-50 text-amber-600 border-amber-100',
      btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
      icon: AlertTriangle,
    },
    info: {
      bgIcon: 'bg-sky-50 text-sky-600 border-sky-100',
      btnConfirm: 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs',
      icon: AlertTriangle,
    },
  }

  const currentVariant = variantStyles[variant] || variantStyles.danger
  const IconComponent = currentVariant.icon

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 touch-none overscroll-none"
      onClick={loading ? undefined : onClose}
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
        className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Top Header & Close Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className={`p-3 rounded-2xl border ${currentVariant.bgIcon} shrink-0`}>
            <IconComponent size={24} />
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors border-none cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Text Content */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-gray-900 leading-tight m-0">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed m-0">{message}</p>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm transition-all border-none cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 ${currentVariant.btnConfirm}`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
