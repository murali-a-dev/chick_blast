import { Outlet, Link } from 'react-router-dom'
import { ShoppingCart, User, ShieldCheck, LogOut } from 'lucide-react'
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
  const { customer, isLoggedIn, openAuthModal, openAccountModal, logoutCustomer } = useCustomer()

  return (
    <div className="website-layout">
      {/* Top Header */}
      <header className="website-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 no-underline group shrink-0">
            <img
              src={logoImg}
              alt="Chick Blast Logo"
              className="h-10 sm:h-11 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
            />
            <div className="flex flex-col justify-center">
              <span className="text-lg sm:text-xl font-black tracking-tight text-gray-900 leading-none">
                Chick Blast
              </span>
              <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mt-1 hidden sm:block">
                Crispy &amp; Delicious
              </span>
            </div>
          </Link>

          {/* Right Header Actions: Account Icon & Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Account Button for Customer */}
            {isLoggedIn && customer ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={openAccountModal}
                  className="h-10 flex items-center gap-2 px-3 sm:px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-900 font-bold text-xs sm:text-sm border border-slate-200/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
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

                <button
                  type="button"
                  onClick={logoutCustomer}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
                  title="Sign Out / Logout"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="h-10 flex items-center gap-1.5 px-3 sm:px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs sm:text-sm border border-orange-200/80 transition-all active:scale-95 cursor-pointer"
                title="Customer Login / Signup"
              >
                <User size={16} />
                <span>Login</span>
              </button>
            )}

            {/* Cart Button */}
            <Link
              to="/cart"
              className="h-10 flex items-center gap-2 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm no-underline shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
              <div className="relative flex items-center">
                <ShoppingCart size={18} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-slate-950 text-orange-400 text-[10px] font-black flex items-center justify-center border border-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-extrabold">₹{totalAmount.toFixed(2)}</span>
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
