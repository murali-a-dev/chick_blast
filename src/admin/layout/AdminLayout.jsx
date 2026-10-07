import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Radio,
  ClipboardList,
  Package,
  Layers,
  Ticket,
  Tv,
  Menu,
  X,
  Globe,
  LogOut,
} from 'lucide-react'
import DeveloperSignature from '../../shared/components/DeveloperSignature'
import AdminAuthModal from '../components/AdminAuthModal'
import logoImg from '../../assets/logo.png'
import '../../styles/admin.css'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/live-orders', icon: Radio, label: 'Live Orders' },
  { to: '/admin/order-summary', icon: ClipboardList, label: 'Order Summary' },
  { to: '/admin/items', icon: Package, label: 'Items' },
  { to: '/admin/combo-items', icon: Layers, label: 'Combo Items' },
  { to: '/admin/coupons', icon: Ticket, label: 'Coupons' },
  { to: '/ready_for_pickup', icon: Tv, label: 'Pickup Screen' },
  { to: '/', icon: Globe, label: 'Website', end: true },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('cb_admin_token') === 'admin_authenticated'
  )

  const handleLogout = () => {
    sessionStorage.removeItem('cb_admin_token')
    setIsAuthenticated(false)
    setSidebarOpen(false)
  }

  return (
    <div className="admin-layout">
      <AdminAuthModal
        isOpen={!isAuthenticated}
        onSuccess={() => setIsAuthenticated(true)}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header flex items-center gap-3">
          <img
            src={logoImg}
            alt="Chick Blast Logo"
            className="h-10 w-auto object-contain bg-white/10 p-1 rounded-lg border border-white/10 shadow-sm"
          />
          <div>
            <h1 className="text-lg font-bold text-white leading-tight m-0">Chick Blast</h1>
            <p className="text-[11px] text-orange-400 font-semibold uppercase tracking-wider m-0 mt-0.5">Admin Panel</p>
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="admin-nav-link text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 w-full text-left bg-transparent border-none cursor-pointer mt-2"
          >
            <LogOut size={20} />
            Logout
          </button>
        </nav>
        <DeveloperSignature variant="sidebar" />
      </aside>

      <div className="admin-main">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-xs border border-slate-200/80 mb-5">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="Chick Blast Logo" className="h-8 w-auto object-contain" />
            <div>
              <span className="text-sm font-black text-slate-900 block leading-tight">Chick Blast</span>
              <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer border border-rose-200 transition-colors"
                title="Logout Admin"
              >
                <LogOut size={18} />
              </button>
            )}
            <button
              type="button"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer border border-slate-200 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {isAuthenticated && <Outlet />}
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
