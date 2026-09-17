import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Eye, EyeOff, Search, Layers, Check, X } from 'lucide-react'
import { itemsApi, uploadImage } from '../../shared/api'
import { LABELS } from '../../shared/constants'
import GradientModal from '../../shared/components/GradientModal'
import ModernSelect from '../../shared/components/ModernSelect'
import FssaiBadge from '../../shared/components/FssaiBadge'
import Loader from '../../shared/components/Loader'
import ConfirmModal from '../components/ConfirmModal'

const emptyForm = {
  name: '',
  unit: 'combo',
  category: 'Fried Chicken',
  label: 'Non-Veg',
  price: '',
  description: '',
  imageUrl: '',
  comboItemIds: [],
}

function ComboFormModal({ isOpen, onClose, combo, allItems, onSave }) {
  const [form, setForm] = useState(() => {
    if (combo) {
      return {
        name: combo.name || '',
        unit: combo.unit || 'combo',
        category: combo.category || 'Fried Chicken',
        label: combo.label || 'Non-Veg',
        price: combo.price ?? '',
        description: combo.description || '',
        imageUrl: combo.imageUrl || '',
        comboItemIds: combo.comboItemIds || [],
      }
    }
    return emptyForm
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedOriginalTotal = form.comboItemIds.reduce((sum, id) => {
    const it = allItems.find((i) => i.id === id)
    return sum + (it?.price || 0)
  }, 0)

  const toggleItem = (id) => {
    const updatedIds = form.comboItemIds.includes(id)
      ? form.comboItemIds.filter((i) => i !== id)
      : [...form.comboItemIds, id]

    // Auto-detect label: if all selected items are Veg, set to Veg, otherwise Non-Veg
    const selectedItems = allItems.filter((i) => updatedIds.includes(i.id))
    const autoLabel = selectedItems.length > 0 && selectedItems.every((i) => i.label === 'Veg') ? 'Veg' : 'Non-Veg'

    setForm((f) => ({
      ...f,
      comboItemIds: updatedIds,
      label: autoLabel,
    }))
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setForm((f) => ({ ...f, imageUrl: url }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.comboItemIds.length < 2) {
      alert('Select at least 2 items for a combo')
      return
    }
    setSaving(true)
    try {
      const data = { ...form, price: Number(form.price), type: 'combo' }
      if (combo?.id) {
        await itemsApi.update(combo.id, data)
      } else {
        await itemsApi.create(data)
      }
      onSave()
      onClose()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <GradientModal
      isOpen={isOpen}
      onClose={onClose}
      title={combo ? 'Edit Combo' : 'Create Combo'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 shadow-sm relative">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🍱</div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <label className="btn-outline cursor-pointer inline-flex items-center gap-2">
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <p className="text-xs text-gray-400 mt-1 m-0">Recommended square ratio (e.g. 500x500)</p>
          </div>
        </div>

        <input
          className="input-field"
          placeholder="Combo Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        {/* Price */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block m-0">
              Combo Price (₹)
            </label>
            {selectedOriginalTotal > 0 && (
              <span className="text-xs text-slate-500">
                Items total: <span className="font-semibold text-slate-800">₹{selectedOriginalTotal}</span>
                {form.price && Number(form.price) < selectedOriginalTotal && (
                  <span className="text-emerald-600 font-bold ml-1.5">
                    (Save ₹{selectedOriginalTotal - Number(form.price)})
                  </span>
                )}
              </span>
            )}
          </div>
          <input
            className="input-field font-bold text-slate-900"
            type="number"
            placeholder="₹ 0.00"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* Food Type / Diet Classification */}
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
            Diet Classification
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, label: 'Veg' })}
              className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                form.label === 'Veg'
                  ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FssaiBadge isVeg={true} size={18} />
                <div className="text-left">
                  <p className="font-bold text-xs m-0 text-emerald-900">Vegetarian</p>
                  <p className="text-[10px] text-emerald-700/80 font-medium m-0">Pure Veg Combo</p>
                </div>
              </div>
              {form.label === 'Veg' && <Check size={16} className="text-emerald-600 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, label: 'Non-Veg' })}
              className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                form.label === 'Non-Veg'
                  ? 'bg-rose-50/80 border-rose-500 text-rose-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FssaiBadge isVeg={false} size={18} />
                <div className="text-left">
                  <p className="font-bold text-xs m-0 text-rose-900">Non-Vegetarian</p>
                  <p className="text-[10px] text-rose-700/80 font-medium m-0">Includes Chicken/Meat</p>
                </div>
              </div>
              {form.label === 'Non-Veg' && <Check size={16} className="text-rose-600 shrink-0" />}
            </button>
          </div>
        </div>

        <textarea
          className="input-field resize-none text-xs sm:text-sm"
          placeholder="Description (e.g. 2pc Crispy Chicken + Fries + Soft Drink...)"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div>
          <p className="text-sm font-semibold mb-2">
            Select Combo Items <span className="text-xs text-orange-600 font-bold">({form.comboItemIds.length} selected)</span>
          </p>
          <div className="max-h-52 overflow-y-auto space-y-2 border border-gray-200 rounded-2xl p-3 bg-gray-50/50">
            {allItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white hover:bg-orange-50/60 border border-gray-100 cursor-pointer transition-colors shadow-2xs"
              >
                <input
                  type="checkbox"
                  checked={form.comboItemIds.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400"
                />
                <span className="flex-1 text-sm font-medium text-gray-900">{item.name}</span>
                <FssaiBadge isVeg={item.label === 'Veg'} size={16} />
                <span className="text-xs font-bold text-gray-600">₹{item.price}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : combo ? 'Update Combo' : 'Create Combo'}
          </button>
        </div>
      </form>
    </GradientModal>
  )
}

const DIET_FILTER_OPTIONS = [
  { value: 'All', label: 'All Diets' },
  ...LABELS.map((l) => ({ value: l, label: l })),
]

export default function ComboItems() {
  const [combos, setCombos] = useState([])
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCombo, setEditCombo] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLabel, setSelectedLabel] = useState('All')

  const loadData = () => {
    itemsApi
      .getAllAdmin()
      .then((all) => {
        setCombos(all.filter((i) => i.type === 'combo'))
        setAllItems(all.filter((i) => i.type !== 'combo'))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const [deleteComboModal, setDeleteComboModal] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const toggleHide = async (combo) => {
    try {
      await itemsApi.update(combo.id, { isActive: !combo.isActive })
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleOpenDeleteModal = (combo) => {
    setDeleteComboModal(combo)
  }

  const handleConfirmDelete = async () => {
    if (!deleteComboModal) return
    setDeleting(true)
    try {
      await itemsApi.delete(deleteComboModal.id)
      setDeleteComboModal(null)
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const getItemNames = (ids) => {
    return ids
      ?.map((id) => allItems.find((i) => i.id === id)?.name)
      .filter(Boolean)
  }

  const filteredCombos = combos.filter((combo) => {
    const matchesSearch =
      combo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (combo.description && combo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesLabel = selectedLabel === 'All' || combo.label === selectedLabel
    return matchesSearch && matchesLabel
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 m-0">Combo Items</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5 m-0 font-medium">
            Manage promotional combo offers & value meals
          </p>
        </div>
        <button
          onClick={() => { setEditCombo(null); setModalOpen(true) }}
          className="btn-primary self-start sm:self-auto !py-2.5 !px-5 flex items-center justify-center gap-2 font-bold shadow-xs cursor-pointer"
        >
          <Plus size={18} /> Create Combo
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search combo packages by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-800 focus:bg-white transition-all font-medium text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 border-none bg-transparent"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Diet Dropdown Filter using ModernSelect */}
          <div className="w-full sm:w-44">
            <ModernSelect
              options={DIET_FILTER_OPTIONS}
              value={selectedLabel}
              onChange={(val) => setSelectedLabel(val)}
              placeholder="All Diets"
            />
          </div>
        </div>
      </div>

      {/* Combos Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <Loader fullScreen={false} size="sm" text="Loading combos..." subtext="" />
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Layers size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-600 font-semibold m-0">No combos created yet</p>
            <p className="text-xs text-slate-400 m-0 mt-1">Combine individual food items into special combo packages</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards List (block md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredCombos.map((combo) => {
                const itemNames = getItemNames(combo.comboItemIds) || []
                const originalTotal = (combo.comboItemIds || []).reduce((sum, id) => {
                  const it = allItems.find((i) => i.id === id)
                  return sum + (it?.price || 0)
                }, 0)
                const savings = originalTotal > combo.price ? originalTotal - combo.price : 0
                const savingsPercent = originalTotal > combo.price ? Math.round((savings / originalTotal) * 100) : 0
                return (
                  <div
                    key={combo.id}
                    className={`p-3.5 sm:p-4 space-y-3 ${
                      combo.isActive === false ? 'bg-slate-50/70 opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80">
                          {combo.imageUrl ? (
                            <img src={combo.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🍱</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 m-0 truncate">{combo.name}</h4>
                            <FssaiBadge isVeg={combo.label === 'Veg'} size={14} />
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="font-black text-sm text-slate-900">₹{combo.price}</span>
                            {savings > 0 && (
                              <>
                                <span className="line-through text-slate-400 text-xs font-normal">₹{originalTotal}</span>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                                  Save {savingsPercent}%
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {combo.isActive === false ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          Hidden
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                          Visible
                        </span>
                      )}
                    </div>

                    {/* Included Items Pills */}
                    {itemNames.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {itemNames.map((name, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 rounded-md text-xs text-slate-700 font-semibold border border-slate-200/60"
                          >
                            • {name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleHide(combo)}
                        title={combo.isActive === false ? 'Unhide combo' : 'Hide combo'}
                        className={`p-2 rounded-xl cursor-pointer border transition-colors ${
                          combo.isActive === false
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {combo.isActive === false ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => { setEditCombo(combo); setModalOpen(true) }}
                        title="Edit combo"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(combo)}
                        title="Delete combo"
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/80 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop View: Table (hidden md:block) */}
            <div className="hidden md:block admin-table border-none shadow-none rounded-none">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Included Items</th>
                    <th>Label</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCombos.map((combo) => {
                    const itemNames = getItemNames(combo.comboItemIds) || []
                    const originalTotal = (combo.comboItemIds || []).reduce((sum, id) => {
                      const it = allItems.find((i) => i.id === id)
                      return sum + (it?.price || 0)
                    }, 0)
                    const savings = originalTotal > combo.price ? originalTotal - combo.price : 0
                    const savingsPercent = originalTotal > combo.price ? Math.round((savings / originalTotal) * 100) : 0
                    return (
                      <tr key={combo.id} className={combo.isActive === false ? 'opacity-60 bg-gray-50' : ''}>
                        <td className="font-medium text-gray-900">{combo.name}</td>
                        <td className="text-sm text-gray-600 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {itemNames.map((name, idx) => (
                              <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                {name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <FssaiBadge isVeg={combo.label === 'Veg'} size={18} />
                        </td>
                        <td>
                          <div className="font-bold text-gray-900">₹{combo.price}</div>
                          {savings > 0 && (
                            <div className="text-[11px] text-slate-400">
                              <span className="line-through">₹{originalTotal}</span>
                              <span className="text-emerald-600 font-bold ml-1">Save {savingsPercent}%</span>
                            </div>
                          )}
                        </td>
                        <td>
                          {combo.isActive === false ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                              Hidden
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              Visible
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-1 items-center">
                            <button
                              onClick={() => toggleHide(combo)}
                              title={combo.isActive === false ? 'Unhide combo on website' : 'Hide combo from website'}
                              className={`p-2 rounded-lg cursor-pointer border-none transition-colors ${
                                combo.isActive === false
                                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                  : 'hover:bg-gray-100 text-gray-500'
                              }`}
                            >
                              {combo.isActive === false ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => { setEditCombo(combo); setModalOpen(true) }}
                              title="Edit combo"
                              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer border-none bg-transparent"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(combo)}
                              title="Delete combo"
                              className="p-2 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer border-none bg-transparent"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ComboFormModal
        key={editCombo?.id || (modalOpen ? 'open-new' : 'closed')}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        combo={editCombo}
        allItems={allItems}
        onSave={loadData}
      />

      <ConfirmModal
        isOpen={!!deleteComboModal}
        onClose={() => setDeleteComboModal(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={`Delete Combo "${deleteComboModal?.name || ''}"?`}
        message="Are you sure you want to delete this combo item? It will be permanently removed from the system."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
