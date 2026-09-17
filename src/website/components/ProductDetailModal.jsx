import { useEffect } from 'react'
import { X, Sparkles, CheckCircle2 } from 'lucide-react'
import FssaiBadge from '../../shared/components/FssaiBadge'
import { useCart } from '../../shared/context/CartContext'
import QuantityControl from './QuantityControl'

export default function ProductDetailModal({ product, isOpen, onClose }) {
  const { items, addItem, updateQuantity } = useCart()

  // Lock background body scroll when open
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

  if (!isOpen || !product) return null

  const cartItem = items.find((i) => i.itemId === product.id)
  const quantity = cartItem?.quantity || 0
  const isVeg = product.label === 'Veg'

  const handleAdd = (e) => {
    e.stopPropagation()
    addItem(product)
  }

  const handleIncrement = (e) => {
    e.stopPropagation()
    updateQuantity(product.id, quantity + 1)
  }

  const handleDecrement = (e) => {
    e.stopPropagation()
    updateQuantity(product.id, quantity - 1)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 touch-none overscroll-none"
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
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col border border-gray-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator / Close Top Bar */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto my-2.5 sm:hidden shrink-0 cursor-pointer" onClick={onClose} />

        {/* Product Image Header */}
        <div className="relative aspect-video w-full bg-gray-100 shrink-0 overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-orange-50/50">🍗</div>
          )}
          
          {/* Gradient overlay at image bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Category Tag */}
          <div className="absolute bottom-3 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500 text-white shadow-md">
              {product.category}
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border-none cursor-pointer flex items-center justify-center backdrop-blur-md shadow-md z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Detail Body inside Modal */}
        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1">
          {/* Title & Price Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FssaiBadge isVeg={isVeg} size={16} />
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 m-0 leading-snug">
                  {product.name}
                </h2>
              </div>
              <p className="text-xs text-gray-400 font-semibold m-0 uppercase tracking-wider">
                {isVeg ? 'Vegetarian Dish' : 'Non-Vegetarian Dish'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-orange-500 block leading-none">
                ₹{product.price}
              </span>
              {product.unit && (
                <span className="text-xs text-gray-400 font-medium uppercase mt-1 block">{product.unit}</span>
              )}
            </div>
          </div>

          {/* Quick Highlights */}
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 py-2 border-y border-gray-100">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={15} /> Freshly Prepared
            </span>
            <span className="flex items-center gap-1 text-orange-600">
              <Sparkles size={15} /> Signature Spices
            </span>
          </div>

          {/* Description */}
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/70">
            <h4 className="text-xs font-bold uppercase text-amber-800 tracking-wider mb-1 m-0">About Dish</h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed m-0">
              {product.description || 'Prepared fresh to order with crispy coating, signature spices, and delicious taste.'}
            </p>
          </div>
        </div>

        {/* Footer Cart Action Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center justify-between gap-4 shrink-0">
          <div>
            <span className="text-xs text-gray-400 font-medium block">Total Price</span>
            <span className="text-xl font-black text-gray-900">
              ₹{(product.price * (quantity || 1)).toFixed(0)}
            </span>
          </div>

          <QuantityControl
            quantity={quantity}
            onAdd={handleAdd}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            size="lg"
            addLabel="Add to Cart"
          />
        </div>
      </div>
    </div>
  )
}
