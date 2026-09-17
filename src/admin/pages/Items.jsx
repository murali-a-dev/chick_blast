import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Package, X } from 'lucide-react'
import { itemsApi, uploadImage } from '../../shared/api'
import { CATEGORIES, LABELS } from '../../shared/constants'
import GradientModal from '../../shared/components/GradientModal'
import ConfirmModal from '../../shared/components/ConfirmModal'
import ModernSelect from '../../shared/components/ModernSelect'
import FssaiBadge from '../../shared/components/FssaiBadge'
import Loader from '../../shared/components/Loader'

const emptyForm = {
  name: '',
  unit: 'pc',
  category: CATEGORIES[0],
  label: LABELS[1],
  price: '',
  description: '',
  imageUrl: '',
}

const CATEGORY_FILTER_OPTIONS = [
  { value: 'All', label: 'All Categories' },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
]

const DIET_FILTER_OPTIONS = [
  { value: 'All', label: 'All Diets' },
  ...LABELS.map((l) => ({ value: l, label: l })),
]

function ItemFormModal({ isOpen, onClose, item, onSave }) {
  const [form, setForm] = useState(() => {
    if (item) {
      return {
        name: item.name || '',
        unit: item.unit || 'pc',
        category: item.category || CATEGORIES[0],
        label: item.label || LABELS[1],
        price: item.price ?? '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
      }
    }
    return emptyForm
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

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
    setSaving(true)
    try {
      const data = { ...form, price: Number(form.price), type: 'item' }
      if (item?.id) {
        await itemsApi.update(item.id, data)
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
      title={item ? 'Edit Item' : 'Add New Item'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 shadow-sm relative">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-slate-400">
                <Package size={28} />
              </div>
            )}
            <div className="absolute bottom-1 right-1">
              <FssaiBadge isVeg={form.label === 'Veg'} size={14} />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <label className="btn-outline cursor-pointer inline-flex items-center gap-2 !py-2 !px-4 text-xs font-semibold">
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <p className="text-xs text-slate-400 mt-1 m-0">Recommended square ratio (e.g. 500x500)</p>
          </div>
        </div>

        <input
          className="input-field"
          placeholder="Item Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            className="input-field"
            placeholder="Unit (pc, plate, etc.)"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <input
            className="input-field font-semibold"
            type="number"
            placeholder="Price (₹)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModernSelect
            options={CATEGORIES}
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
            label="Category"
          />
          <ModernSelect
            options={LABELS}
            value={form.label}
            onChange={(v) => setForm({ ...form, label: v })}
            label="Diet (Food Type)"
          />
        </div>

        <textarea
          className="input-field resize-none text-xs sm:text-sm"
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-outline !py-2.5 !px-5 text-xs font-semibold">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary !py-2.5 !px-6 text-xs font-semibold">
            {saving ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </form>
    </GradientModal>
  )
}

export default function Items() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLabel, setSelectedLabel] = useState('All')

  const loadItems = () => {
    itemsApi
      .getAllAdmin()
      .then((data) => setItems(data.filter((i) => i.type !== 'combo')))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [])

  const toggleHide = async (item) => {
    try {
      await itemsApi.update(item.id, { isActive: !item.isActive })
      loadItems()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      await itemsApi.delete(deleteItem.id)
      setDeleteItem(null)
      loadItems()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const openAdd = () => {
    setEditItem(null)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setModalOpen(true)
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
      const matchesLabel = selectedLabel === 'All' || item.label === selectedLabel
      return matchesSearch && matchesCategory && matchesLabel
    })
  }, [items, searchQuery, selectedCategory, selectedLabel])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 m-0">Items</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5 m-0 font-medium">
            Manage food items & menu pricing
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary self-start sm:self-auto !py-2.5 !px-5 flex items-center justify-center gap-2 font-bold shadow-xs cursor-pointer"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items by name..."
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

          <div className="flex gap-2 w-full sm:w-auto min-w-[280px]">
            <div className="flex-1 sm:w-44">
              <ModernSelect
                options={CATEGORY_FILTER_OPTIONS}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                placeholder="All Categories"
              />
            </div>
            <div className="flex-1 sm:w-36">
              <ModernSelect
                options={DIET_FILTER_OPTIONS}
                value={selectedLabel}
                onChange={(val) => setSelectedLabel(val)}
                placeholder="All Diets"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <Loader fullScreen={false} size="sm" text="Loading items..." subtext="" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-600 font-semibold m-0">No items found</p>
            <p className="text-xs text-slate-400 m-0 mt-1">Try adjusting your search query or filters</p>
          </div>
        ) : (
          <>
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 ${
                    item.isActive === false ? 'bg-slate-50/70 opacity-70' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package size={20} />
                        </div>
                      )}
                      <div className="absolute top-1 left-1">
                        <FssaiBadge isVeg={item.label === 'Veg'} size={14} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 m-0 truncate">{item.name}</h4>
                      <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">{item.category}</p>
                      <p className="font-black text-sm text-slate-900 m-0 mt-1">₹{item.price}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {item.isActive === false ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Hidden
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                        Visible
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleHide(item)}
                        title={item.isActive === false ? 'Unhide item' : 'Hide item'}
                        className={`p-2 rounded-xl cursor-pointer border transition-colors ${
                          item.isActive === false
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {item.isActive === false ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        title="Edit item"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteItem(item)}
                        title="Delete item"
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block admin-table border-none shadow-none rounded-none">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Label</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={item.isActive === false ? 'opacity-60 bg-gray-50' : ''}>
                      <td>
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package size={16} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="font-medium text-gray-900">{item.name}</td>
                      <td className="text-gray-600">{item.category}</td>
                      <td>
                        <FssaiBadge isVeg={item.label === 'Veg'} size={18} />
                      </td>
                      <td className="font-bold text-gray-900">₹{item.price}</td>
                      <td>
                        {item.isActive === false ? (
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleHide(item)}
                            title={item.isActive === false ? 'Unhide item on website' : 'Hide item from website'}
                            className={`p-2 rounded-lg cursor-pointer border-none transition-colors ${
                              item.isActive === false
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'hover:bg-gray-100 text-gray-500'
                            }`}
                          >
                            {item.isActive === false ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit item"
                            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer border-none bg-transparent"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteItem(item)}
                            title="Delete item"
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ItemFormModal
        key={editItem?.id || (modalOpen ? 'open-new' : 'closed')}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editItem}
        onSave={loadItems}
      />

      <ConfirmModal
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Menu Item"
        message={`Are you sure you want to permanently delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete Item"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
