import { getDb } from '../../config/firebase.js'
import { ORDER_STATUSES, ACTIVE_STATUSES, getTodayDate } from '../orders/model.js'

const dashboardCache = new Map()
const DASHBOARD_CACHE_TTL = 30 * 1000 // 30 seconds

function getCached(key) {
  const item = dashboardCache.get(key)
  if (!item) return null
  if (Date.now() - item.time > DASHBOARD_CACHE_TTL) {
    dashboardCache.delete(key)
    return null
  }
  return item.data
}

function setCache(key, data) {
  dashboardCache.set(key, { data, time: Date.now() })
}

export function invalidateDashboardCache() {
  dashboardCache.clear()
}

export async function fetchItemOrderCounts(opts) {
  const db = getDb()
  let fromDate = getTodayDate()
  let toDate = getTodayDate()

  if (typeof opts === 'string' && opts) {
    fromDate = opts
    toDate = opts
  } else if (opts && typeof opts === 'object') {
    if (opts.fromDate) fromDate = opts.fromDate
    if (opts.toDate) toDate = opts.toDate
    if (opts.date && !opts.fromDate && !opts.toDate) {
      fromDate = opts.date
      toDate = opts.date
    }
  }

  const cacheKey = `counts_${fromDate}_${toDate}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  if (!db) {
    return []
  }

  let query = db.collection('orders')
  if (fromDate === toDate) {
    query = query.where('orderDate', '==', fromDate)
  } else {
    query = query.where('orderDate', '>=', fromDate).where('orderDate', '<=', toDate)
  }

  const snapshot = await query.get()

  const counts = {}
  snapshot.docs.forEach((doc) => {
    const order = doc.data()
    if (order.status === ORDER_STATUSES.CANCELLED) return
    order.items?.forEach((item) => {
      counts[item.name] = (counts[item.name] || 0) + item.quantity
    })
  })

  const result = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  setCache(cacheKey, result)
  return result
}

export async function fetchOrderGrowth(month, year) {
  const db = getDb()
  const targetMonth = month || new Date().getMonth() + 1
  const targetYear = year || new Date().getFullYear()
  const monthStr = String(targetMonth).padStart(2, '0')
  const fromDate = `${targetYear}-${monthStr}-01`
  const lastDay = new Date(targetYear, targetMonth, 0).getDate()
  const toDate = `${targetYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  const cacheKey = `growth_${targetYear}_${targetMonth}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  if (!db) {
    const result = []
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${targetYear}-${monthStr}-${String(d).padStart(2, '0')}`
      result.push({ date: dateStr, count: 0 })
    }
    return result
  }

  const snapshot = await db
    .collection('orders')
    .where('orderDate', '>=', fromDate)
    .where('orderDate', '<=', toDate)
    .get()

  const dayCounts = {}
  snapshot.docs.forEach((doc) => {
    const order = doc.data()
    if (order.status === ORDER_STATUSES.CANCELLED) return
    const day = order.orderDate
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })

  const result = []
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${targetYear}-${monthStr}-${String(d).padStart(2, '0')}`
    result.push({ date: dateStr, count: dayCounts[dateStr] || 0 })
  }

  setCache(cacheKey, result)
  return result
}

export async function fetchDashboardStats(opts = {}) {
  const db = getDb()
  const today = getTodayDate()
  const fromDate = opts.fromDate || opts.date || today
  const toDate = opts.toDate || opts.date || today

  const cacheKey = `stats_${fromDate}_${toDate}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  if (!db) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      activeOrdersCount: 0,
      deliveredOrdersCount: 0,
      cancelledOrdersCount: 0,
    }
  }

  // 1. Fetch orders in the selected date range
  let rangeQuery = db.collection('orders')
  if (fromDate === toDate) {
    rangeQuery = rangeQuery.where('orderDate', '==', fromDate)
  } else {
    rangeQuery = rangeQuery.where('orderDate', '>=', fromDate).where('orderDate', '<=', toDate)
  }

  const [rangeSnapshot, activeSnapshot] = await Promise.all([
    rangeQuery.get(),
    db.collection('orders').where('status', 'in', ACTIVE_STATUSES).get(),
  ])

  let totalRevenue = 0
  let totalOrders = 0
  let deliveredOrdersCount = 0
  let cancelledOrdersCount = 0

  rangeSnapshot.docs.forEach((doc) => {
    const data = doc.data()
    if (data.status === ORDER_STATUSES.CANCELLED) {
      cancelledOrdersCount++
      return
    }
    totalOrders++
    totalRevenue += Number(data.totalAmount || 0)
    if (data.status === ORDER_STATUSES.DELIVERED) {
      deliveredOrdersCount++
    }
  })

  const activeOrdersCount = activeSnapshot.size
  const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0

  const result = {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    averageOrderValue,
    activeOrdersCount,
    deliveredOrdersCount,
    cancelledOrdersCount,
  }

  setCache(cacheKey, result)
  return result
}

