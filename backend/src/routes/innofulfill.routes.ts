import { Router } from 'express'
import {
  innofulfillLoginController,
  innofulfillRefreshTokenController,
} from '../controllers/innofulfill.controller'

const router = Router()

router.post('/auth/login', innofulfillLoginController)
router.post('/auth/refresh-token', innofulfillRefreshTokenController)

export default router
