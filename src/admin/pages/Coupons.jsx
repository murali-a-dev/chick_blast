import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  Copy,
  Percent,
  Coins,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { couponsApi } from '../../shared/api'
import GradientModal from '../../shared/components/GradientModal'
import ConfirmModal from '../../shared/components/ConfirmModal'
import ModernSelect from '../../shared/components/ModernSelect'
import Toast from '../../shared/components/Toast'
import { useToast } from '../../shared/hooks/useToast'
import Loader from '../../shared/components/Loader'

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
      title={coupon ? `Edit Coupon: ${coupon.code}` : 'Create New Coupon'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Coupon Code <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. CRUNCH20"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="input-field font-mono font-bold uppercase tracking-wider"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Offer Title
            </label>
            <input
              type="text"
              placeholder="e.g. Weekend Mega Saver"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="e.g. Get 20% off on all items above ₹200"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Discount Type <span className="text-orange-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, discountType: 'percentage' }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  form.discountType === 'percentage'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <Percent size={14} /> Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, discountType: 'flat' }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  form.discountType === 'flat'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <Coins size={14} /> Flat (₹)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Discount Value <span className="text-orange-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={form.discountType === 'percentage' ? 100 : 9999}
              placeholder={form.discountType === 'percentage' ? 'e.g. 15 (for 15%)' : 'e.g. 50 (for ₹50)'}
              value={form.discountValue}
              onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
              className="input-field font-semibold"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Minimum Order Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 199 (0 for no minimum)"
              value={form.minOrderAmount}
              onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
              className="input-field"
            />
          </div>

          {form.discountType === 'percentage' ? (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Max Discount Cap (₹)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 100 (optional cap)"
                value={form.maxDiscount}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                className="input-field"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Valid Till (Expiry Date)
              </label>
              <input
                type="date"
                value={form.validTill}
                onChange={(e) => setForm((f) => ({ ...f, validTill: e.target.value }))}
                className="input-field"
              />
            </div>
          )}
        </div>

        {form.discountType === 'percentage' && (
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Valid Till (Expiry Date)
            </label>
            <input
              type="date"
              value={form.validTill}
              onChange={(e) => setForm((f) => ({ ...f, validTill: e.target.value }))}
              className="input-field"
            />
          </div>
        )}

        <div className="pt-2 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 bg-white/10 border-white/20"
            />
            <span className="text-xs font-bold text-slate-200">Activate coupon immediately</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary !px-4 !py-2 text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary !px-5 !py-2 text-xs font-extrabold cursor-pointer disabled:opacity-50"
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

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleToggleStatus = async (coupon) => {
    try {
      const updated = await couponsApi.update(coupon.id, { isActive: !coupon.isActive })
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, isActive: updated.data?.isActive ?? !c.isActive } : c)))
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight m-0 flex items-center gap-2.5">
            <Ticket className="text-orange-500" size={28} /> Coupon Master
          </h1>
          <p className="text-xs text-slate-400 font-medium m-0 mt-1">
            Manage promotional discount codes, validity rules, and customer savings
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingCoupon(null)
            setIsModalOpen(true)
          }}
          className="btn-primary !px-4 !py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-lg shadow-orange-500/20"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-glass p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <Ticket size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider m-0">Total Coupons</p>
            <h3 className="text-xl font-black text-white m-0 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        <div className="card-glass p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider m-0">Active Offers</p>
            <h3 className="text-xl font-black text-emerald-400 m-0 mt-0.5">{stats.active}</h3>
          </div>
        </div>

        <div className="card-glass p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Percent size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider m-0">% Percentage</p>
            <h3 className="text-xl font-black text-white m-0 mt-0.5">{stats.percentage}</h3>
          </div>
        </div>

        <div className="card-glass p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Coins size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider m-0">Flat (₹) Off</p>
            <h3 className="text-xl font-black text-white m-0 mt-0.5">{stats.flat}</h3>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupons by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !pl-10 text-xs font-semibold"
          />
        </div>
        <div className="flex gap-2 shrink-0">
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

      {/* Coupons Grid */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-16 card-glass rounded-3xl border border-white/10">
          <Ticket size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white m-0">No Coupons Found</h3>
          <p className="text-xs text-slate-400 m-0 mt-1">Try adjusting your search query or filter options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`card-glass rounded-3xl border p-5 transition-all flex flex-col justify-between relative overflow-hidden ${
                coupon.isActive
                  ? 'border-white/10 hover:border-orange-500/40'
                  : 'border-white/5 opacity-60 bg-white/[0.02]'
              }`}
            >
              <div>
                {/* Card Top: Code & Status */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-white bg-white/10 px-3 py-1 rounded-xl border border-white/15 tracking-wider flex items-center gap-1.5">
                      {coupon.code}
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        title="Copy Code"
                        className="text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer p-0"
                      >
                        <Copy size={13} />
                      </button>
                    </span>
                    {copiedCode === coupon.code && (
                      <span className="text-[10px] font-bold text-emerald-400 animate-fade-in">
                        Copied!
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      coupon.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Offer Highlight */}
                <div className="py-3 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-orange-400">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}% OFF`
                        : `₹${coupon.discountValue} FLAT OFF`}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 m-0">{coupon.title}</h4>
                  {coupon.description && (
                    <p className="text-xs text-slate-400 font-medium m-0 leading-relaxed">
                      {coupon.description}
                    </p>
                  )}
                </div>

                {/* Rules Badges */}
                <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-slate-300">
                  {coupon.minOrderAmount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                      Min Order: ₹{coupon.minOrderAmount}
                    </span>
                  )}
                  {coupon.discountType === 'percentage' && coupon.maxDiscount && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                      Max Discount: ₹{coupon.maxDiscount}
                    </span>
                  )}
                  {coupon.validTill && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1 text-slate-400">
                      <Calendar size={12} /> Till {coupon.validTill}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Toggle & Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(coupon)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer p-0"
                >
                  {coupon.isActive ? (
                    <>
                      <ToggleRight size={22} className="text-emerald-400" />
                      <span className="text-emerald-400">Active</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={22} className="text-slate-500" />
                      <span>Inactive</span>
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
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10 cursor-pointer"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModalCoupon(coupon)}
                    title="Delete Coupon"
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
        message={`Are you sure you want to delete coupon code "${deleteModalCoupon?.code}"? Customers will no longer be able to use it.`}
        confirmText="Delete Coupon"
        confirmVariant="danger"
      />
    </div>
  )
}
