import { Router } from 'express'
import {
  innofulfillBulkManifestOrdersController,
  innofulfillCreateOrderController,
  innofulfillEcommRateCalculationController,
  innofulfillEcommServiceabilityController,
  innofulfillGetOrderController,
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
router.post('/gateway/booking-service/orders', innofulfillCreateOrderController)
router.post('/gateway/booking-service/orders/manifest/bulk', innofulfillBulkManifestOrdersController)
router.get('/gateway/booking-service/orders/:orderId', innofulfillGetOrderController)

export default router
