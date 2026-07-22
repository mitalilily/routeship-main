import { Router } from 'express'
import {
  innofulfillEcommRateCalculationController,
  innofulfillEcommServiceabilityController,
  innofulfillListOrdersController,
  innofulfillLoginController,
  innofulfillRefreshTokenController,
} from '../controllers/innofulfill.controller'

const router = Router()

router.post('/auth/login', innofulfillLoginController)
router.post('/auth/refresh-token', innofulfillRefreshTokenController)
router.post('/gateway/serviceability/ecomm', innofulfillEcommServiceabilityController)
router.post(
  '/gateway/ure/api/external/rate-calculation/calculate/v2',
  innofulfillEcommRateCalculationController,
)
router.get('/gateway/booking-service/orders', innofulfillListOrdersController)

export default router
