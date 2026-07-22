import { Request, Response } from 'express'
import {
  loginToInnofulfill,
  refreshInnofulfillToken,
} from '../models/services/innofulfill.service'

const SUPPORTED_SIGNIN_TYPES = new Set(['EMAIL'])
const TENANT_HEADER_NAMES = [
  'x-tenant-id',
  'x-root-tenant-id',
  'x-current-tenant-id',
  'tenant-id',
]

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const getForwardableTenantHeaders = (req: Request) =>
  TENANT_HEADER_NAMES.reduce<Record<string, string>>((headers, headerName) => {
    const value = req.headers[headerName]
    if (typeof value === 'string' && value.trim()) {
      headers[headerName] = value.trim()
    }
    return headers
  }, {})

export const innofulfillLoginController = async (req: Request, res: Response) => {
  const username = normalizeString(req.body?.username)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const signinType = normalizeString(req.body?.signinType).toUpperCase()

  if (!username || !password || !signinType) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['username', 'password', 'signinType'],
    })
  }

  if (!SUPPORTED_SIGNIN_TYPES.has(signinType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid signinType. Currently supported: EMAIL',
    })
  }

  try {
    const result = await loginToInnofulfill(
      {
        username,
        password,
        signinType: signinType as 'EMAIL',
      },
      getForwardableTenantHeaders(req),
    )

    return res.status(result.status).json(result.data)
  } catch (error: any) {
    console.error('Innofulfill login request failed', {
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status,
    })

    return res.status(502).json({
      success: false,
      message: 'Unable to reach Innofulfill authentication service',
    })
  }
}

export const innofulfillRefreshTokenController = async (req: Request, res: Response) => {
  const userId = normalizeString(req.body?.userId)
  const refreshToken = normalizeString(req.body?.refreshToken)

  if (!userId || !refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['userId', 'refreshToken'],
    })
  }

  try {
    const result = await refreshInnofulfillToken(
      {
        userId,
        refreshToken,
      },
      getForwardableTenantHeaders(req),
    )

    return res.status(result.status).json(result.data)
  } catch (error: any) {
    console.error('Innofulfill refresh token request failed', {
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status,
    })

    return res.status(502).json({
      success: false,
      message: 'Unable to reach Innofulfill authentication service',
    })
  }
}
