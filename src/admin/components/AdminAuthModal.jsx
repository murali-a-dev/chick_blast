import { useState } from 'react'
import { Lock, ShieldAlert, ArrowRight, Home } from 'lucide-react'
import { adminApi } from '../../shared/api'
import logoImg from '../../assets/logo.png'

export default function AdminAuthModal({ isOpen, onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pin.trim()) return

    setLoading(true)
    setError('')
    try {
      const res = await adminApi.login(pin.trim())
      if (res.success) {
        sessionStorage.setItem('cb_admin_token', 'admin_authenticated')
        onSuccess()
      } else {
        setError('Incorrect PIN. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto shadow-sm">
          <img src={logoImg} alt="Chick Blast" className="h-10 w-auto object-contain" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Lock size={13} className="text-orange-600" />
            <span>Management Portal</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 m-0">Admin Authentication</h3>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Please enter your secure 4-digit PIN to access the POS & Kitchen Display System.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={12}
              autoFocus
              placeholder="Enter Admin PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                if (error) setError('')
              }}
              className="w-full text-center text-xl font-bold tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900"
            />
            {error && (
              <div className="flex items-center gap-1 text-xs text-rose-600 font-bold mt-1.5">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="btn-primary w-full !py-3 flex items-center justify-center gap-2 font-bold shadow-sm cursor-pointer"
          >
            <span>{loading ? 'Verifying...' : 'Unlock Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors no-underline"
          >
            <Home size={14} /> Return to Storefront
          </a>
        </div>
      </div>
    </div>
  )
}
