import { Outlet, Link, NavLink } from 'react-router-dom'
import { ShoppingCart, User, ShieldCheck } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import CustomerAuthModal from '../components/CustomerAuthModal'
import CustomerAccountModal from '../components/CustomerAccountModal'
import { useCart } from '../../shared/context/CartContext'
import { useCustomer } from '../../shared/context/CustomerContext'
import DeveloperSignature from '../../shared/components/DeveloperSignature'
import logoImg from '../../assets/logo.png'
import '../../styles/website.css'

export default function WebsiteLayout() {
  const { itemCount, totalAmount } = useCart()
  const { customer, isLoggedIn, openAuthModal, openAccountModal } = useCustomer()

  return (
    <div className="website-layout">
      {/* Top Header */}
      <header className="website-header">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <img
              src={logoImg}
              alt="Chick Blast Logo"
              className="h-10 sm:h-11 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 m-0 leading-tight">
                Chick Blast
              </h1>
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider m-0 hidden sm:block">
                Crispy & Delicious
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-semibold no-underline transition-colors ${
                  isActive ? 'text-orange-500 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Menu
            </NavLink>
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `text-sm font-semibold no-underline transition-colors ${
                  isActive ? 'text-orange-500 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Cart ({itemCount})
            </NavLink>
            <NavLink
              to="/order-status"
              className={({ isActive }) =>
                `text-sm font-semibold no-underline transition-colors ${
                  isActive ? 'text-orange-500 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Track Order
            </NavLink>
          </nav>

          {/* Right Header Actions: Account Icon & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Account Icon Button for Customer */}
            {isLoggedIn && customer ? (
              <button
                onClick={openAccountModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-900 font-bold text-xs sm:text-sm border border-slate-200 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="View Customer Profile & Order History"
              >
                <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs">
                  {customer.Name ? customer.Name.charAt(0).toUpperCase() : <User size={14} />}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">
                  {customer.Name || 'Account'}
                </span>
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs sm:text-sm border border-orange-200/80 transition-all active:scale-95 cursor-pointer"
                title="Customer Login / Signup"
              >
                <User size={16} />
                <span>Login</span>
              </button>
            )}

            {/* Cart Button */}
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm no-underline shadow-md shadow-orange-500/20 transition-transform active:scale-95"
            >
              <div className="relative">
                <ShoppingCart size={18} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-slate-950 text-orange-400 text-[10px] font-black flex items-center justify-center border border-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">₹{totalAmount.toFixed(2)}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="website-main">
        <Outlet />
      </main>

      {/* Developer Signature & Portfolio Footer */}
      <DeveloperSignature />

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Customer Modals */}
      <CustomerAuthModal />
      <CustomerAccountModal />
    </div>
  )
}
