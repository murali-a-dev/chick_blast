import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function GradientModal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  // Lock background body scroll when modal is open
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

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 touch-none overscroll-none"
      onClick={onClose}
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
        className={`bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white shrink-0">
          <h3 className="text-base sm:text-lg font-black text-gray-900 m-0">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors border-none cursor-pointer flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1">{children}</div>
      </div>
    </div>
  )
}
