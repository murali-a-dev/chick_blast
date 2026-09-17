import { Router } from 'express'
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from './controller.js'

const router = Router()

router.get('/', getAllCoupons)
router.post('/', createCoupon)
router.post('/validate', validateCoupon)
router.put('/:id', updateCoupon)
router.delete('/:id', deleteCoupon)

export default router
