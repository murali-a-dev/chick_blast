import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import moment from 'moment'
import { dashboardApi } from '../../shared/api'
import ModernDatePicker from '../../shared/components/ModernDatePicker'
import ModernSelect from '../../shared/components/ModernSelect'
import { TrendingUp, ShoppingBag, PieChart as PieIcon, Award, Calendar, Filter, IndianRupee, ArrowRight } from 'lucide-react'
import logoImg from '../../assets/logo.png'
import { DATE_RANGES } from '../../shared/constants/index'

const COLORS = ['#ff6b35', '#ffc857', '#3b82f6', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4']

export default function Dashboard() {
  const todayStr = moment().format('YYYY-MM-DD')
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, activeOrders: 0 })
  const [activePreset, setActivePreset] = useState('today')
  const [fromDate, setFromDate] = useState(todayStr)
  const [toDate, setToDate] = useState(todayStr)

  const [itemData, setItemData] = useState([])
  const [growthMonth, setGrowthMonth] = useState(currentMonth)
  const [growthYear, setGrowthYear] = useState(currentYear)
  const [growthData, setGrowthData] = useState([])

  // Effect to fetch stats based on date filter range
  useEffect(() => {
    dashboardApi
      .stats({ fromDate, toDate })
      .then((data) => {
        if (data) {
          setStats({
            ...data,
            activeOrders: data.activeOrders ?? data.activeOrdersCount ?? 0,
          })
        }
      })
      .catch(console.error)
  }, [fromDate, toDate])

  // Calculate dates based on selected preset
  const handlePresetSelect = (presetKey) => {
    setActivePreset(presetKey)
    let start = todayStr
    let end = todayStr

    if (presetKey === 'today') {
      start = todayStr
      end = todayStr
    } else if (presetKey === '7days') {
      start = moment().subtract(6, 'days').format('YYYY-MM-DD')
      end = todayStr
    } else if (presetKey === '30days') {
      start = moment().subtract(29, 'days').format('YYYY-MM-DD')
      end = todayStr
    } else if (presetKey === 'thisMonth') {
      start = moment().startOf('month').format('YYYY-MM-DD')
      end = todayStr
    }

    if (presetKey !== 'custom') {
      setFromDate(start)
      setToDate(end)
    }
  }

  // Effect to fetch item distribution based on date filter range
  useEffect(() => {
    dashboardApi
      .itemCounts({ fromDate, toDate })
      .then(setItemData)
      .catch(console.error)
  }, [fromDate, toDate])

  // Effect to fetch monthly growth data
  useEffect(() => {
    dashboardApi
      .orderGrowth(growthMonth, growthYear)
      .then(setGrowthData)
      .catch(console.error)
  }, [growthMonth, growthYear])

  const totalOrdersThisRange = itemData.reduce((s, i) => s + i.count, 0)
  const totalOrders = growthData.reduce((s, d) => s + d.count, 0)
  const activeDays = growthData.filter((d) => d.count > 0).length

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleString('default', { month: 'short' }),
  }))

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map((y) => ({
    value: y,
    label: String(y),
  }))

  // Formatted date label for display
  const getDateRangeLabel = () => {
    if (fromDate === toDate) {
      return fromDate === todayStr ? 'Today' : moment(fromDate).format('DD MMM YYYY')
    }
    return `${moment(fromDate).format('DD MMM')} – ${moment(toDate).format('DD MMM YYYY')}`
  }

  const getPeriodSalesTitle = () => {
    if (activePreset === 'today' || (fromDate === todayStr && toDate === todayStr)) {
      return 'Today Sales'
    }
    if (activePreset === '7days') {
      return 'Last 7 Days Sales'
    }
    if (activePreset === '30days') {
      return 'Last 30 Days Sales'
    }
    if (activePreset === 'thisMonth') {
      return 'This Month Sales'
    }
    if (fromDate === toDate) {
      return `${moment(fromDate).format('D MMM')} Sales`
    }
    return `${moment(fromDate).format('D MMM')} to ${moment(toDate).format('D MMM')} Sales`
  }

  return (
    <div className="space-y-5">
      {/* Header & Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Chick Blast Logo" className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 m-0">Dashboard Overview</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 m-0">Real-time metrics & store analytics</p>
          </div>
        </div>
      </div>

      {/* 4 Core Business KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <IndianRupee size={16} className="text-emerald-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mt-1 m-0">
              ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 m-0">Delivered store revenue</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <ShoppingBag size={16} className="text-slate-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 m-0">
              {stats.totalOrders}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 m-0">All recorded orders</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Avg Order Value</span>
              <TrendingUp size={16} className="text-indigo-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 m-0">
              ₹{stats.averageOrderValue.toFixed(2)}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 m-0">Per delivered order</p>
        </div>

        <Link
          to="/admin/live-orders"
          className="bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all duration-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between group no-underline text-inherit cursor-pointer"
          title="Click to view Live Kitchen Orders"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-600 transition-colors">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Active In Kitchen</span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0 animate-pulse" title="Active Kitchen Queue" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 m-0">
              {stats.activeOrders ?? stats.activeOrdersCount ?? 0}
            </h3>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-emerald-600 font-bold m-0">Live kitchen queue</p>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 flex items-center gap-0.5 transition-colors">
              View <ArrowRight size={12} />
            </span>
          </div>
        </Link>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
              <Filter size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Date Filter Range</h3>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {DATE_RANGES.map(({ key, label }) => {
              const isActive = activePreset === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetSelect(key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Range Picker Inputs */}
        {activePreset === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in duration-150">
            <div className="w-full sm:w-48">
              <ModernDatePicker
                label="From Date"
                value={fromDate}
                onChange={(d) => setFromDate(d || todayStr)}
              />
            </div>
            <div className="hidden sm:block text-slate-400 font-medium text-xs mt-4">—</div>
            <div className="w-full sm:w-48">
              <ModernDatePicker
                label="To Date"
                value={toDate}
                onChange={(d) => setToDate(d || todayStr)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider m-0">Total Monthly Orders</p>
            <h3 className="text-2xl sm:text-3xl font-black mt-1 m-0">{totalOrders}</h3>
            <p className="text-xs text-slate-300 mt-2 flex items-center gap-1 m-0">
              <TrendingUp size={14} className="text-emerald-400" /> {activeDays} active sales days
            </p>
          </div>
          <ShoppingBag className="absolute right-2 bottom-1 w-20 h-20 text-white/5 pointer-events-none" />
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">{getPeriodSalesTitle()}</p>
              <Calendar size={16} className="text-slate-500" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 m-0">{totalOrdersThisRange}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-2 m-0 truncate">Items ordered ({getDateRangeLabel()})</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between sm:col-span-2 md:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">Top Performing Item</p>
              <Award size={16} className="text-amber-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 m-0 truncate">
              {itemData[0]?.name || 'N/A'}
            </h3>
          </div>
          <p className="text-xs text-emerald-600 font-bold mt-2 m-0">
            {itemData[0] ? `${itemData[0].count} orders sold` : 'No sales recorded'}
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      < div className="grid grid-cols-1 lg:grid-cols-2 gap-5" >
        {/* Item-wise Donut Card */}
        < div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm min-w-0" >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-500 shrink-0">
                <PieIcon size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 m-0">Item Distribution</h3>
                <span className="text-xs text-gray-400">Sales share ({getDateRangeLabel()})</span>
              </div>
            </div>
          </div>

          {
            itemData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <p className="text-3xl mb-2 m-0">📊</p>
                <p className="text-sm font-medium m-0">No orders recorded for selected period</p>
              </div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={itemData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      cornerRadius={6}
                    >
                      {itemData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={COLORS[idx % COLORS.length]}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-slate-900/90 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xl border border-white/20">
                              <p className="m-0 text-amber-400">{data.name}</p>
                              <p className="m-0 text-white font-bold">{data.count} items sold</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Inner Radial Stat */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl sm:text-2xl font-black text-gray-900">{totalOrdersThisRange}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total</span>
                </div>
              </div>
            )
          }

          {/* Custom Pill Legends */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 justify-center">
            {itemData.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-700"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: COLORS[idx % COLORS.length] }}
                />
                <span className="truncate max-w-[100px] sm:max-w-[120px]">{item.name}</span>
                <span className="font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded-md shadow-2xs text-[11px]">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div >

        {/* Order Growth Card */}
        < div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm min-w-0" >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-500 shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 m-0">Monthly Sales</h3>
                <span className="text-xs text-gray-400">Daily order volume</span>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="w-1/2 sm:w-32">
                <ModernSelect
                  options={monthOptions}
                  value={growthMonth}
                  onChange={(v) => setGrowthMonth(Number(v))}
                />
              </div>
              <div className="w-1/2 sm:w-28">
                <ModernSelect
                  options={yearOptions}
                  value={growthYear}
                  onChange={(v) => setGrowthYear(Number(v))}
                />
              </div>
            </div>
          </div>

          <div className="w-full min-w-0">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6b35" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.split('-')[2]}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis allowDecimals={false} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xl border border-white/20 backdrop-blur-md">
                          <p className="m-0 text-orange-400">{moment(data.date).format('DD MMM YYYY')}</p>
                          <p className="m-0 text-white font-bold text-sm mt-0.5">{data.count} Orders Placed</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#ff6b35"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#growthAreaGradient)"
                  dot={{ r: 3, fill: '#ff6b35', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#ff6b35', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div >
      </div >
    </div >
  )
}
