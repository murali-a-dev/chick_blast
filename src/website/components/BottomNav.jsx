import { NavLink } from 'react-router-dom'
import { UtensilsCrossed, ShoppingCart, ClipboardList, User } from 'lucide-react'
import { useCart } from '../../shared/context/CartContext'
import { useCustomer } from '../../shared/context/CustomerContext'

const navItems = [
  { to: '/', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/order-status', icon: ClipboardList, label: 'Status' },
]

export default function BottomNav() {
  const { itemCount } = useCart()
  const { customer, isLoggedIn, openAuthModal, openAccountModal } = useCustomer()

  return (
    <nav className="glass-nav md:hidden">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 no-underline select-none ${
              isActive
                ? 'text-orange-600 bg-orange-50 font-black shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 font-semibold hover:bg-slate-50'
            }`
          }
        >
          <div className="relative flex items-center justify-center mb-0.5">
            <Icon size={19} className="stroke-[2.2]" />
            {to === '/cart' && itemCount > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center text-white bg-slate-950 border border-white">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight tracking-tight truncate max-w-full">{label}</span>
        </NavLink>
      ))}

      {/* Account Profile Action Button */}
      <button
        type="button"
        onClick={() => (isLoggedIn ? openAccountModal() : openAuthModal())}
        className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 border-none bg-transparent cursor-pointer text-slate-500 hover:text-slate-900 font-semibold hover:bg-slate-50 select-none"
      >
        <div className="relative flex items-center justify-center mb-0.5">
          <div className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black">
            {isLoggedIn && customer?.Name ? customer.Name.charAt(0).toUpperCase() : <User size={13} className="stroke-[2.2]" />}
          </div>
        </div>
        <span className="text-[11px] leading-tight tracking-tight truncate max-w-full">
          {isLoggedIn ? (customer?.Name ? customer.Name.split(' ')[0] : 'Profile') : 'Login'}
        </span>
      </button>
    </nav>
  )
}
