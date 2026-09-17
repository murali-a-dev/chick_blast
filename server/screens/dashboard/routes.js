import { Router } from 'express'
import { getItemCountsController, getOrderGrowthController, getDashboardStatsController } from './controller.js'

const router = Router()

router.get('/stats', getDashboardStatsController)
router.get('/item-counts', getItemCountsController)
router.get('/order-growth', getOrderGrowthController)

export default router
