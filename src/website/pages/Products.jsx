import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  X,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  ChevronDown,
  UtensilsCrossed,
  LayoutGrid,
  List,
  Flame,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { itemsApi } from '../../shared/api'
import { CATEGORIES } from '../../shared/constants'
import { useCart } from '../../shared/context/CartContext'
import FssaiBadge from '../../shared/components/FssaiBadge'
import Loader from '../../shared/components/Loader'
import ProductDetailModal from '../components/ProductDetailModal'
import QuantityControl from '../components/QuantityControl'

const HERO_SLIDES = [
  {
    id: 1,
    tag: 'Chick Blast Signature Menu',
    title: 'Golden Crispy Fried Chicken',
    description: 'Hand-breaded to perfection with our secret 11-spice blend for ultimate crunch & rich juicy flavor.',
    categoryTarget: 'Fried Chicken',
    gradient: 'from-slate-950 via-slate-900 to-orange-950',
    accentBorder: 'border-orange-500/30',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    highlights: ['🔥 Secret Spice Recipe', '⚡ Express 15-Min Prep', '⭐ 4.9★ Bestseller'],
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    tag: 'Flame-Grilled & Fried Special',
    title: 'Loaded Double Crunch Burgers',
    description: 'Juicy crispy fillets stacked with toasted brioche buns, fresh lettuce, melted cheese & signature lava sauce.',
    categoryTarget: 'Burger',
    gradient: 'from-amber-950 via-slate-900 to-red-950',
    accentBorder: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: ['🍔 100% Real Cheese', '🔥 Double Patty Option', '⭐ Hot & Fresh'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    tag: 'Popular Street Favorites',
    title: 'Authentic Spicy Momos & Pizzas',
    description: 'Steamed or crispy fried momos filled with fresh veggies & chicken, served with fiery garlic chutney.',
    categoryTarget: 'Momos',
    gradient: 'from-rose-950 via-slate-900 to-orange-950',
    accentBorder: 'border-rose-500/30',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    highlights: ['🥟 Fiery Garlic Dip', '🍕 Thin Crust Pizzas', '⭐ Customer Favorite'],
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    tag: 'Refreshing Beverages & Treats',
    title: 'Chilled Mocktails & Thick Shakes',
    description: 'Quench your thirst with ice-cold mojitos, sparkling sodas, and rich thick chocolate milkshakes.',
    categoryTarget: 'Drinks',
    gradient: 'from-emerald-950 via-slate-900 to-teal-950',
    accentBorder: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: ['🍹 Served Ice Chilled', '🥤 Rich & Creamy Shakes', '⭐ Combo Favorite'],
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80'
  }
]

// Grid View Card Component
function ProductGridCard({ product, onSelect }) {
  const { items, addItem, updateQuantity } = useCart()
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
      onClick={() => onSelect(product)}
      className="group cursor-pointer bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-xl hover:border-orange-200/80 transition-all duration-300 flex flex-col justify-between overflow-hidden relative hover:-translate-y-1"
    >
      <div>
        {/* Card Image Header */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍗</div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

          {/* Diet & Category Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-xs flex items-center justify-center">
              <FssaiBadge isVeg={isVeg} size={14} />
            </span>
          </div>

          {product.category && (
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-slate-950/80 backdrop-blur-md text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs border border-amber-500/20">
                {product.category}
              </span>
            </div>
          )}
        </div>

        {/* Card Details */}
        <div className="p-4 sm:p-5 space-y-2">
          <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-1 m-0">
            {product.name}
          </h3>

          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 m-0 font-medium min-h-[2.25rem]">
            {product.description || 'Prepared fresh to order with authentic signature spices & crispy goodness.'}
          </p>
        </div>
      </div>

      {/* Footer Price & Add Action */}
      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-3 border-t border-gray-50 mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="font-black text-lg sm:text-xl text-gray-900">
            ₹{product.price}
          </span>
          {product.unit && (
            <span className="text-[10px] text-gray-400 font-semibold uppercase">({product.unit})</span>
          )}
        </div>

        <QuantityControl
          quantity={quantity}
          onAdd={handleAdd}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          size="md"
          addLabel="ADD"
        />
      </div>
    </div>
  )
}

// Swiggy Style Compact List Card Component
function ProductListCard({ product, onSelect }) {
  const { items, addItem, updateQuantity } = useCart()
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
      onClick={() => onSelect(product)}
      className="group cursor-pointer py-4 px-3 sm:px-4 flex items-start justify-between gap-4 border-b border-gray-100 hover:bg-orange-50/30 transition-all duration-200 rounded-2xl relative"
    >
      {/* Left Column: Food Details */}
      <div className="space-y-1.5 flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          <FssaiBadge isVeg={isVeg} size={14} />
          {product.category && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase">
              {product.category}
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-snug m-0 group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1 pt-0.5">
          <span className="font-black text-base sm:text-lg text-gray-900">
            ₹{product.price}
          </span>
          {product.unit && (
            <span className="text-[10px] text-gray-400 font-semibold uppercase">({product.unit})</span>
          )}
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed m-0 pt-0.5 font-medium">
          {product.description || 'Prepared fresh with high quality ingredients and signature seasonings.'}
        </p>
      </div>

      {/* Right Column: Food Image & Overlapping ADD Button */}
      <div className="relative shrink-0 pb-3">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border border-gray-200/70 shadow-2xs relative group-hover:shadow-md transition-all">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🍗</div>
          )}
        </div>

        {/* Overlapping ADD / Stepper Button */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 shrink-0">
          <QuantityControl
            quantity={quantity}
            onAdd={handleAdd}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            size="sm"
            addLabel="ADD"
          />
        </div>
      </div>
    </div>
  )
}

// Main Products Listing Component
export default function Products() {
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('All')
  const [foodType, setFoodType] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [viewMode, setViewMode] = useState('grid')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [showMenuDrawer, setShowMenuDrawer] = useState(false)

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const { itemCount, totalAmount } = useCart()

  useEffect(() => {
    itemsApi
      .getAll()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Auto-slide carousel timer
  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isAutoPlaying])

  // Lock background body scroll when menu drawer is open
  useEffect(() => {
    if (showMenuDrawer) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }
    }
  }, [showMenuDrawer])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  // Filtered and sorted products calculation
  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = category === 'All' || p.category === category
      const matchesFoodType = foodType === 'All' || p.label === foodType
      return matchesSearch && matchesCategory && matchesFoodType
    })

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0))
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0))
    }

    return result
  }, [products, category, foodType, searchQuery, sortBy])

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups = {}
    filtered.forEach((product) => {
      const cat = product.category || 'Others'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(product)
    })
    return groups
  }, [filtered])

  const toggleCategory = (cat) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }))
  }

  const scrollToCategory = (catName) => {
    setCategory(catName)
    setShowMenuDrawer(false)
    setCollapsedCategories((prev) => ({ ...prev, [catName]: false }))
    const el = document.getElementById(`cat-${catName}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="space-y-6 pb-8 relative -mt-4 sm:-mt-6">
      {/* Modern Auto-playing Carousel Hero Banner with Horizontal Sliding Track */}
      <div
        className="relative overflow-hidden rounded-3xl text-white shadow-2xl border border-orange-500/20"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Horizontal Sliding Track */}
        <div
          className="flex transition-transform duration-700 ease-out w-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_SLIDES.map((slide) => (
            <div key={slide.id} className="w-full shrink-0">
              <div className={`p-6 sm:p-9 bg-gradient-to-r ${slide.gradient} ${slide.accentBorder} relative`}>
                {/* Background decorative glows */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Left Slide Details */}
                  <div className="max-w-2xl space-y-3 flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider backdrop-blur-md ${slide.badgeBg}`}>
                      <Flame size={14} className="animate-pulse" />
                      <span>{slide.tag}</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white m-0 leading-tight">
                      {slide.title}
                    </h1>

                    <p className="text-xs sm:text-sm text-gray-300 max-w-xl font-medium leading-relaxed m-0">
                      {slide.description}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-extrabold text-orange-200">
                      {slide.highlights.map((hl, i) => (
                        <span key={i} className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                          {hl}
                        </span>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className="pt-3">
                      <button
                        onClick={() => scrollToCategory(slide.categoryTarget)}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-none flex items-center gap-2"
                      >
                        <span>Explore {slide.categoryTarget}</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Right High-Res Food Image */}
                  <div className="w-full md:w-60 h-44 md:h-52 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 relative group">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-2.5 left-3 text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-amber-300 border border-amber-500/30">
                      {slide.categoryTarget}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 cursor-pointer backdrop-blur-md transition-all shadow-md z-20"
          title="Previous Slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 cursor-pointer backdrop-blur-md transition-all shadow-md z-20"
          title="Next Slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-950/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 border-none cursor-pointer ${
                idx === currentSlide ? 'w-6 bg-orange-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Sticky Glassmorphic Search & Filter Bar */}
      <div className="sticky top-[60px] sm:top-[72px] z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur-xl border-b border-gray-200/70 shadow-xs space-y-3 transition-all">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Top Controls Row: Search Input + Layout Switcher */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500" />
              <input
                type="text"
                placeholder="Search fried chicken, burgers, momos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50/90 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-400 rounded-2xl text-xs sm:text-sm font-semibold border border-gray-200 focus:border-orange-500 shadow-2xs outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-200/60 hover:bg-gray-200 rounded-full p-1 border-none cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Right Tools Group: View Mode Switcher + Reset */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Grid vs List View Mode Toggle */}
              <div className="flex items-center p-1 bg-gray-100/90 rounded-2xl border border-gray-200/60 shadow-2xs">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 sm:p-2 rounded-xl border-none cursor-pointer transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-orange-600 shadow-xs font-bold'
                      : 'text-gray-400 hover:text-gray-700 bg-transparent'
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="List View"
                  className={`p-1.5 sm:p-2 rounded-xl border-none cursor-pointer transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-orange-600 shadow-xs font-bold'
                      : 'text-gray-400 hover:text-gray-700 bg-transparent'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>

              {/* Reset Filters button */}
              {(category !== 'All' || foodType !== 'All' || searchQuery || sortBy !== 'default') && (
                <button
                  onClick={() => {
                    setCategory('All')
                    setFoodType('All')
                    setSearchQuery('')
                    setSortBy('default')
                  }}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs cursor-pointer border border-orange-200/60 transition-colors"
                  title="Reset Filters"
                >
                  <RotateCcw size={13} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Category Horizontal Chips & Diet Toggle Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
              <button
                onClick={() => setCategory('All')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all border-none ${
                  category === 'All'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                    : 'bg-gray-100/90 hover:bg-gray-200/80 text-gray-700 border border-gray-200/60'
                }`}
              >
                <span>All</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${category === 'All' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {products.length}
                </span>
              </button>

              {CATEGORIES.map((cat) => {
                const count = products.filter((p) => p.category === cat).length
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all border-none ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                        : 'bg-gray-100/90 hover:bg-gray-200/80 text-gray-700 border border-gray-200/60'
                    }`}
                  >
                    <span>{cat}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Diet Filter Toggle (All, Veg, Non-Veg) */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl flex-shrink-0 self-start sm:self-auto border border-gray-200/60">
              <button
                onClick={() => setFoodType('All')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                  foodType === 'All'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 bg-transparent'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFoodType('Veg')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                  foodType === 'Veg'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-emerald-700 bg-transparent'
                }`}
              >
                <FssaiBadge isVeg={true} size={12} />
                <span>Veg</span>
              </button>
              <button
                onClick={() => setFoodType('Non-Veg')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                  foodType === 'Non-Veg'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-red-700 bg-transparent'
                }`}
              >
                <FssaiBadge isVeg={false} size={12} />
                <span>Non-Veg</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State using Chick Blast signature Loader */}
      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader
            fullScreen={false}
            size="md"
            text="Loading Chick Blast Menu..."
            subtext="Preparing fresh crispy delicacies for you"
          />
        </div>
      ) : Object.keys(groupedProducts).length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-gray-100 rounded-3xl text-center py-16 px-4 shadow-sm space-y-4 max-w-md mx-auto my-8">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto text-orange-500">
            <ShoppingBag size={38} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-gray-900 m-0">No delicious dishes found</h3>
            <p className="text-xs text-gray-500 m-0 leading-relaxed">
              We couldn't find any items matching "{searchQuery || category || foodType}". Try adjusting your search or filters!
            </p>
          </div>

          <button
            onClick={() => {
              setCategory('All')
              setFoodType('All')
              setSearchQuery('')
              setSortBy('default')
            }}
            className="px-5 py-2.5 rounded-2xl bg-orange-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-orange-500/20 hover:bg-orange-600 border-none cursor-pointer transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        /* Products Content Container: Category Wise Expandable Cards (No icons/images) */
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([catName, catItems]) => {
            const isCollapsed = !!collapsedCategories[catName]

            return (
              <div
                key={catName}
                id={`cat-${catName}`}
                className="bg-white rounded-3xl border border-gray-100/90 shadow-sm overflow-hidden transition-all duration-300 scroll-mt-36"
              >
                {/* Category Accordion Header Card - No icon/image */}
                <button
                  type="button"
                  onClick={() => toggleCategory(catName)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 bg-white hover:bg-orange-50/20 transition-all border-none cursor-pointer text-left select-none group"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 m-0 group-hover:text-orange-600 transition-colors tracking-tight">
                      {catName}
                    </h2>
                    <span className="text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200/60">
                      {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      !isCollapsed
                        ? 'bg-orange-100 text-orange-600 rotate-180'
                        : 'bg-gray-100 text-gray-500 rotate-0 group-hover:bg-orange-50 group-hover:text-orange-600'
                    }`}
                  >
                    <ChevronDown size={18} className="stroke-[2.5]" />
                  </div>
                </button>

                {/* Expandable Items Body */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-6 pt-0 sm:pt-0 border-t border-gray-100/80">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-4">
                        {catItems.map((product) => (
                          <ProductGridCard key={product.id} product={product} onSelect={setSelectedProduct} />
                        ))}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 overflow-hidden pt-1">
                        {catItems.map((product) => (
                          <ProductListCard key={product.id} product={product} onSelect={setSelectedProduct} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Category Navigation Menu Drawer Trigger / Modal */}
      {showMenuDrawer && (
        <div
          className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 touch-none overscroll-none"
          onClick={() => setShowMenuDrawer(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[75vh] flex flex-col border border-gray-100 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-orange-500" />
                <h3 className="text-base font-black text-gray-900 m-0">Quick Menu Jump</h3>
              </div>
              <button
                onClick={() => setShowMenuDrawer(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center border-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
              <button
                onClick={() => scrollToCategory('All')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-left transition-all border-none cursor-pointer ${
                  category === 'All' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span>All Categories</span>
                <span className="font-extrabold text-gray-400">{filtered.length}</span>
              </button>

              {CATEGORIES.map((cat) => {
                const count = products.filter((p) => p.category === cat).length
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-left transition-all border-none cursor-pointer ${
                      isActive ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="font-extrabold text-gray-400">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Mobile Cart Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 md:hidden z-40 animate-in slide-in-from-bottom duration-300">
          <Link
            to="/cart"
            className="flex items-center justify-between p-3.5 px-5 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950 text-white shadow-2xl border border-orange-500/40 no-underline backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-orange-500/30">
                {itemCount}
              </div>
              <div>
                <p className="text-[10px] text-orange-300 font-extrabold uppercase tracking-wider m-0">Cart Subtotal</p>
                <p className="text-base font-black text-white m-0">₹{totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-400 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
              <span>View Cart</span>
              <ChevronRight size={16} />
            </div>
          </Link>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
