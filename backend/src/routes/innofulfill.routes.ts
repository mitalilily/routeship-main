import { Router } from 'express'
import {
  innofulfillEcommServiceabilityController,
  innofulfillLoginController,
  innofulfillRefreshTokenController,
} from '../controllers/innofulfill.controller'

const router = Router()

router.post('/auth/login', innofulfillLoginController)
router.post('/auth/refresh-token', innofulfillRefreshTokenController)
router.post('/gateway/serviceability/ecomm', innofulfillEcommServiceabilityController)

export default router
