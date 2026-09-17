import { fetchItemOrderCounts, fetchOrderGrowth, fetchDashboardStats } from './model.js'
import { validateDashboardParams } from './validation.js'

export async function getDashboardStatsController(req, res) {
  try {
    const { date, fromDate, toDate } = req.query
    const stats = await fetchDashboardStats({ date, fromDate, toDate })
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getItemCountsController(req, res) {
  try {
    const { date, fromDate, toDate } = req.query
    const data = await fetchItemOrderCounts({ date, fromDate, toDate })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getOrderGrowthController(req, res) {
  try {
    const errors = validateDashboardParams(req.query)
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') })
    }

    const { month, year } = req.query
    const data = await fetchOrderGrowth(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined
    )
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
