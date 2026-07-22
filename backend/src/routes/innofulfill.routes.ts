import { Router } from 'express'
import { innofulfillLoginController } from '../controllers/innofulfill.controller'

const router = Router()

router.post('/auth/login', innofulfillLoginController)

export default router
