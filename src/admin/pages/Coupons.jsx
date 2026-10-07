import { useState, useEffect, useMemo, useCallback } from 'react'
import moment from 'moment'
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  Check,
  Copy,
  Percent,
  Coins,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  LayoutGrid,
  List,
  Sparkles,
  Clock,
  ShoppingBag,
  ShieldCheck,
  X,
} from 'lucide-react'
import { couponsApi } from '../../shared/api'
import GradientModal from '../../shared/components/GradientModal'
import ConfirmModal from '../../shared/components/ConfirmModal'
import ModernSelect from '../../shared/components/ModernSelect'
import ModernDatePicker from '../../shared/components/ModernDatePicker'
import Toast from '../../shared/components/Toast'
import { useToast } from '../../shared/hooks/useToast'
import Loader from '../../shared/components/Loader'
import { copyToClipboard } from '../../shared/utils/clipboard'

const emptyForm = {
  code: '',
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  validTill: '',
  isActive: true,
}

const TYPE_FILTER_OPTIONS = [
  { value: 'All', label: 'All Discount Types' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'flat', label: 'Flat Amount (₹)' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'All', label: 'All Statuses' },
  { value: 'active', label: 'Active Only' },
  { value: 'inactive', label: 'Inactive Only' },
]

function CouponFormModal({ isOpen, onClose, coupon, onSave }) {
  const [form, setForm] = useState(() =>
    coupon
      ? {
          code: coupon.code || '',
          title: coupon.title || '',
          description: coupon.description || '',
          discountType: coupon.discountType || 'percentage',
          discountValue: coupon.discountValue ?? '',
          minOrderAmount: coupon.minOrderAmount ?? '',
          maxDiscount: coupon.maxDiscount ?? '',
          validTill: coupon.validTill || '',
          isActive: coupon.isActive !== false,
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const setPresetDate = (days) => {
    const futureDate = moment().add(days, 'days').format('YYYY-MM-DD')
    setForm((f) => ({ ...f, validTill: futureDate }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanCode = form.code.trim().toUpperCase()
    if (!cleanCode) {
      setError('Coupon code is required')
      return
    }

    const val = Number(form.discountValue)
    if (isNaN(val) || val <= 0) {
      setError('Discount value must be greater than 0')
      return
    }

    if (form.discountType === 'percentage' && val > 100) {
      setError('Percentage discount cannot exceed 100%')
      return
    }

    const payload = {
      code: cleanCode,
      title: form.title.trim() || `${cleanCode} Offer`,
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: val,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      maxDiscount: form.discountType === 'percentage' && form.maxDiscount ? Number(form.maxDiscount) : null,
      validTill: form.validTill || null,
      isActive: form.isActive,
    }

    setSaving(true)
    try {
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  return (
    <GradientModal
      isOpen={isOpen}
      onClose={onClose}
      title={coupon ? `Edit Coupon: ${coupon.code}` : 'Create New Promotional Coupon'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Live Coupon Preview Ticket */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-md">
              LIVE PREVIEW
            </span>
            <span className="text-xs font-black font-mono tracking-wider bg-slate-950/40 px-2.5 py-0.5 rounded-lg border border-white/20">
              {form.code.trim() ? form.code.trim().toUpperCase() : 'CODEHERE'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">
              {form.discountValue
                ? form.discountType === 'percentage'
                  ? `${form.discountValue}% OFF`
                  : `₹${form.discountValue} OFF`
                : '0% OFF'}
            </span>
            <span className="text-xs font-bold text-amber-100 truncate">
              {form.title.trim() || 'Special Promotional Offer'}
            </span>
          </div>
          <p className="text-[11px] text-white/80 m-0 mt-0.5 line-clamp-1">
            {form.description.trim() || 'Applicable at checkout on qualifying orders'}
          </p>
        </div>

        {/* Code & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Coupon Code <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. CRUNCH20"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono font-black uppercase tracking-wider outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Offer Title
            </label>
            <input
              type="text"
              placeholder="e.g. Weekend Mega Saver"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="e.g. Get 20% discount on all orders above ₹200"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
          />
        </div>

        {/* Discount Type & Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Discount Type <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, discountType: 'percentage' }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  form.discountType === 'percentage'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Percent size={14} /> Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, discountType: 'flat' }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  form.discountType === 'flat'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Coins size={14} /> Flat (₹)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Discount Value <span className="text-orange-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={form.discountType === 'percentage' ? 100 : 99999}
              placeholder={form.discountType === 'percentage' ? 'e.g. 20 (for 20%)' : 'e.g. 50 (for ₹50)'}
              value={form.discountValue}
              onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
              required
            />
          </div>
        </div>

        {/* Minimum Order & Max Cap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Minimum Order Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 199 (0 for no minimum)"
              value={form.minOrderAmount}
              onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {form.discountType === 'percentage' ? 'Max Discount Cap (₹)' : 'Max Discount (N/A)'}
            </label>
            <input
              type="number"
              min="1"
              disabled={form.discountType !== 'percentage'}
              placeholder={form.discountType === 'percentage' ? 'e.g. 100 (optional cap)' : 'Not applicable for flat discount'}
              value={form.maxDiscount}
              onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Validity Date */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 block">
              Valid Till (Expiry Date)
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
              <button
                type="button"
                onClick={() => setPresetDate(7)}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 cursor-pointer"
              >
                +7d
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(30)}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 cursor-pointer"
              >
                +30d
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, validTill: '' }))}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 cursor-pointer"
              >
                No Expiry
              </button>
            </div>
          </div>
          <ModernDatePicker
            value={form.validTill}
            onChange={(d) => setForm((f) => ({ ...f, validTill: d }))}
            placeholder="Select expiry date (or leave empty for no expiry)"
          />
        </div>

        {/* Activation Checkbox */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Coupon Status</span>
            <span className="text-[11px] text-slate-500">Allow customers to apply this code on website immediately</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </div>
      </form>
    </GradientModal>
  )
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [deleteModalCoupon, setDeleteModalCoupon] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const { toast, showToast, hideToast } = useToast()

  const fetchCoupons = useCallback(async () => {
    try {
      const list = await couponsApi.getAll()
      setCoupons(Array.isArray(list) ? list : [])
    } catch (err) {
      showToast(err.message || 'Failed to fetch coupons', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    let isMounted = true
    couponsApi.getAll()
      .then((list) => {
        if (isMounted) setCoupons(Array.isArray(list) ? list : [])
      })
      .catch((err) => {
        if (isMounted) showToast(err.message || 'Failed to fetch coupons', 'error')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [showToast])

  const handleCopyCode = async (code) => {
    if (!code) return
    const success = await copyToClipboard(code)
    if (success) {
      setCopiedCode(code)
      showToast(`Copied code "${code}" to clipboard!`, 'success')
      setTimeout(() => setCopiedCode(null), 2500)
    } else {
      // In-app webview / browser fallback: prompt to ensure mobile users can always copy
      try {
        window.prompt('Copy coupon code:', code)
        setCopiedCode(code)
        setTimeout(() => setCopiedCode(null), 2500)
      } catch {
        showToast(`Coupon code is: ${code}`, 'info')
      }
    }
  }

  const handleToggleStatus = async (coupon) => {
    try {
      const updated = await couponsApi.update(coupon.id, { isActive: !coupon.isActive })
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: updated.data?.isActive ?? !c.isActive } : c))
      )
      showToast(`Coupon ${coupon.code} is now ${!coupon.isActive ? 'Active' : 'Inactive'}!`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to toggle status', 'error')
    }
  }

  const handleSaveCoupon = async (payload) => {
    if (editingCoupon) {
      await couponsApi.update(editingCoupon.id, payload)
      showToast(`Coupon ${payload.code} updated successfully!`, 'success')
    } else {
      await couponsApi.create(payload)
      showToast(`Coupon ${payload.code} created successfully!`, 'success')
    }
    await fetchCoupons()
  }

  const handleConfirmDelete = async () => {
    if (!deleteModalCoupon) return
    setDeleting(true)
    try {
      await couponsApi.delete(deleteModalCoupon.id)
      setCoupons((prev) => prev.filter((c) => c.id !== deleteModalCoupon.id))
      showToast(`Coupon ${deleteModalCoupon.code} deleted successfully!`, 'success')
      setDeleteModalCoupon(null)
    } catch (err) {
      showToast(err.message || 'Failed to delete coupon', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        c.code?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)

      const matchesType = typeFilter === 'All' || c.discountType === typeFilter
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'active' && c.isActive) ||
        (statusFilter === 'inactive' && !c.isActive)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [coupons, search, typeFilter, statusFilter])

  const stats = useMemo(() => {
    const total = coupons.length
    const active = coupons.filter((c) => c.isActive).length
    const percentage = coupons.filter((c) => c.discountType === 'percentage').length
    const flat = coupons.filter((c) => c.discountType === 'flat').length
    return { total, active, percentage, flat }
  }, [coupons])

  if (loading) {
    return <Loader fullScreen size="lg" text="Loading Coupons..." />
  }

  return (
    <div className="space-y-6">
      {toast && <Toast toast={toast} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Ticket size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
                Coupon Master
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider">
                Marketing
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
              Create, configure, and monitor customer promo codes &amp; discount rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Ticket Card View"
              className={`p-1.5 rounded-lg border-none cursor-pointer transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Data Table View"
              className={`p-1.5 rounded-lg border-none cursor-pointer transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
            >
              <List size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingCoupon(null)
              setIsModalOpen(true)
            }}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all active:scale-95 border-none"
          >
            <Plus size={16} />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Coupons */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shrink-0 border border-orange-100">
            <Ticket size={22} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider m-0">Total Coupons</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 m-0 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        {/* Active Offers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider m-0">Active Coupons</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 m-0 mt-0.5">{stats.active}</h3>
          </div>
        </div>

        {/* Percentage Offers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100">
            <Percent size={22} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider m-0">Percentage (%)</p>
            <h3 className="text-xl sm:text-2xl font-black text-indigo-600 m-0 mt-0.5">{stats.percentage}</h3>
          </div>
        </div>

        {/* Flat Amount Offers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-100">
            <Coins size={22} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider m-0">Flat (₹) Off</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600 m-0 mt-0.5">{stats.flat}</h3>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupons by code, title, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all bg-slate-50/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex gap-2.5 shrink-0">
          <div className="w-44">
            <ModernSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPE_FILTER_OPTIONS}
            />
          </div>
          <div className="w-40">
            <ModernSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Main Coupons Content */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto border border-orange-100">
            <Ticket size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 m-0">No Promotional Coupons Found</h3>
            <p className="text-xs text-slate-500 font-medium m-0">
              {search || typeFilter !== 'All' || statusFilter !== 'All'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Get started by creating your first promotional discount coupon!'}
            </p>
          </div>
          {(search || typeFilter !== 'All' || statusFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setTypeFilter('All')
                setStatusFilter('All')
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Voucher Ticket Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredCoupons.map((coupon) => {
            const isExpired = coupon.validTill && moment(coupon.validTill).isBefore(moment(), 'day')
            const daysLeft = coupon.validTill ? moment(coupon.validTill).diff(moment(), 'days') : null

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-3xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between relative overflow-hidden group ${
                  coupon.isActive
                    ? 'border-slate-200/90 shadow-2xs hover:border-orange-300'
                    : 'border-slate-200/60 bg-slate-50/60 opacity-75'
                }`}
              >
                {/* Top Accent Strip */}
                <div
                  className={`h-1.5 w-full ${
                    !coupon.isActive
                      ? 'bg-slate-300'
                      : coupon.discountType === 'percentage'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                />

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header: Code Pill & Status Badge */}
                    <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(coupon.code)}
                          title="Click to copy coupon code"
                          className={`font-mono text-sm sm:text-base font-black px-3 py-1.5 rounded-xl border tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                            copiedCode === coupon.code
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/20'
                              : 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span>{coupon.code}</span>
                          {copiedCode === coupon.code ? (
                            <Check size={14} className="text-emerald-600 shrink-0" />
                          ) : (
                            <Copy size={14} className="text-slate-400 group-hover:text-slate-700 shrink-0" />
                          )}
                        </button>
                        {copiedCode === coupon.code && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                            Copied!
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isExpired ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                            Expired
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                              coupon.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-black'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                coupon.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Offer Highlight Banner */}
                    <div className="py-3.5 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                          {coupon.discountType === 'percentage' ? (
                            <span className="text-orange-600">{coupon.discountValue}% OFF</span>
                          ) : (
                            <span className="text-emerald-600">₹{coupon.discountValue} FLAT OFF</span>
                          )}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {coupon.discountType}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 m-0 line-clamp-1">{coupon.title}</h4>
                      {coupon.description && (
                        <p className="text-xs text-slate-500 font-medium m-0 leading-relaxed line-clamp-2 pt-0.5">
                          {coupon.description}
                        </p>
                      )}
                    </div>

                    {/* Rules & Constraints Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-2 text-[11px] font-semibold text-slate-600">
                      {coupon.minOrderAmount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center gap-1 font-bold text-slate-700">
                          <ShoppingBag size={12} className="text-orange-500" /> Min Order: ₹{coupon.minOrderAmount}
                        </span>
                      )}
                      {coupon.discountType === 'percentage' && coupon.maxDiscount && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center gap-1 font-bold text-slate-700">
                          <ShieldCheck size={12} className="text-indigo-500" /> Max Cap: ₹{coupon.maxDiscount}
                        </span>
                      )}
                      {coupon.validTill && (
                        <span
                          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold ${
                            isExpired
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : daysLeft !== null && daysLeft <= 3
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200/80'
                          }`}
                        >
                          <Calendar size={12} />
                          <span>Till {moment(coupon.validTill).format('DD MMM YYYY')}</span>
                          {daysLeft !== null && !isExpired && (
                            <span className="text-[10px] opacity-75">
                              ({daysLeft === 0 ? 'Today' : `${daysLeft}d left`})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Toggle Switch & Actions */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(coupon)}
                      className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors border-none bg-transparent cursor-pointer p-0"
                    >
                      {coupon.isActive ? (
                        <>
                          <ToggleRight size={26} className="text-emerald-500" />
                          <span className="text-emerald-700 font-extrabold text-xs">Enabled</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={26} className="text-slate-400" />
                          <span className="text-slate-500 font-semibold text-xs">Disabled</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCoupon(coupon)
                          setIsModalOpen(true)
                        }}
                        title="Edit Coupon"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-all border border-slate-200 hover:border-orange-200 cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModalCoupon(coupon)}
                        title="Delete Coupon"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-all border border-slate-200 hover:border-rose-200 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="admin-table bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Offer Title</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min Order</th>
                  <th className="py-3.5 px-4">Max Cap</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.validTill && moment(coupon.validTill).isBefore(moment(), 'day')

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(coupon.code)}
                          title="Click to copy coupon code"
                          className={`font-mono font-black px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-95 ${
                            copiedCode === coupon.code
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span>{coupon.code}</span>
                          {copiedCode === coupon.code ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} className="text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{coupon.title}</div>
                        {coupon.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 font-normal">
                            {coupon.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                          {coupon.discountType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {coupon.discountType === 'percentage' ? (
                          <span className="text-orange-600">{coupon.discountValue}%</span>
                        ) : (
                          <span className="text-emerald-600">₹{coupon.discountValue}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'None'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {coupon.discountType === 'percentage' && coupon.maxDiscount
                          ? `₹${coupon.maxDiscount}`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {coupon.validTill ? (
                          <span
                            className={`text-xs font-bold ${
                              isExpired ? 'text-rose-600' : 'text-slate-700'
                            }`}
                          >
                            {moment(coupon.validTill).format('DD MMM YYYY')}
                            {isExpired && <span className="block text-[10px] text-rose-500 font-extrabold">Expired</span>}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No Expiry</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          className="border-none bg-transparent cursor-pointer p-0"
                          title="Click to toggle status"
                        >
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                              coupon.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                coupon.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCoupon(coupon)
                              setIsModalOpen(true)
                            }}
                            title="Edit Coupon"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-slate-200 hover:border-orange-200 cursor-pointer transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalCoupon(coupon)}
                            title="Delete Coupon"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 cursor-pointer transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <CouponFormModal
        key={editingCoupon?.id || 'new-coupon'}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCoupon(null)
        }}
        coupon={editingCoupon}
        onSave={handleSaveCoupon}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteModalCoupon}
        onClose={() => setDeleteModalCoupon(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Coupon"
        message={`Are you sure you want to permanently delete coupon code "${deleteModalCoupon?.code}"? Customers will no longer be able to apply this offer.`}
        confirmText="Delete Coupon"
        confirmVariant="danger"
      />
    </div>
  )
}
