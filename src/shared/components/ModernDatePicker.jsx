import { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import moment from 'moment'

export default function ModernDatePicker({ value, onChange, label, placeholder = 'Select date' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  
  // Internal date tracking
  const currentDate = value ? moment(value) : moment()
  const [viewMonth, setViewMonth] = useState(currentDate.clone())

  useEffect(() => {
    if (value) {
      setViewMonth(moment(value))
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const startOfMonth = viewMonth.clone().startOf('month')
  const endOfMonth = viewMonth.clone().endOf('month')
  const startDate = startOfMonth.clone().startOf('week')
  const endDate = endOfMonth.clone().endOf('week')

  const days = []
  let day = startDate.clone()
  while (day.isBefore(endDate)) {
    days.push(day.clone())
    day.add(1, 'day')
  }

  const handleSelectDay = (d) => {
    onChange(d.format('YYYY-MM-DD'))
    setIsOpen(false)
  }

  const handleShortcut = (type) => {
    let target = moment()
    if (type === 'today') target = moment()
    else if (type === 'yesterday') target = moment().subtract(1, 'day')
    else if (type === 'first_of_month') target = moment().startOf('month')
    onChange(target.format('YYYY-MM-DD'))
    setViewMonth(target.clone())
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      {label && <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white/90 hover:bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow transition-all text-sm font-medium text-gray-800 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={16} className="text-orange-500" />
          <span>{value ? moment(value).format('DD MMM YYYY') : placeholder}</span>
        </div>
        {value && (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 rounded-full hover:bg-gray-100"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth(viewMonth.clone().subtract(1, 'month'))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 border-none cursor-pointer bg-transparent"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-sm text-gray-800">
              {viewMonth.format('MMMM YYYY')}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(viewMonth.clone().add(1, 'month'))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 border-none cursor-pointer bg-transparent"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => handleShortcut('today')}
              className="px-2.5 py-1 rounded-lg text-xs bg-orange-50 text-orange-600 font-semibold border border-orange-200/50 hover:bg-orange-100 cursor-pointer whitespace-nowrap"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('yesterday')}
              className="px-2.5 py-1 rounded-lg text-xs bg-gray-50 text-gray-600 font-medium hover:bg-gray-100 cursor-pointer whitespace-nowrap"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('first_of_month')}
              className="px-2.5 py-1 rounded-lg text-xs bg-gray-50 text-gray-600 font-medium hover:bg-gray-100 cursor-pointer whitespace-nowrap"
            >
              1st of Month
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[11px] font-bold text-gray-400">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const isSelected = value && d.isSame(value, 'day')
              const isCurrentMonth = d.isSame(viewMonth, 'month')
              const isToday = d.isSame(moment(), 'day')

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`h-8 w-8 text-xs rounded-xl flex items-center justify-center font-medium transition-all border-none cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/30'
                      : isToday
                      ? 'border border-orange-400 text-orange-600 font-bold bg-orange-50/50'
                      : isCurrentMonth
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {d.date()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
