import { Request, Response } from 'express'
import {
  checkInnofulfillEcommServiceability,
  loginToInnofulfill,
  refreshInnofulfillToken,
} from '../models/services/innofulfill.service'

const SUPPORTED_SIGNIN_TYPES = new Set(['EMAIL'])
const SUPPORTED_PAYMENT_MODES = new Set(['PREPAID', 'COD'])
const TENANT_HEADER_NAMES = [
  'x-tenant-id',
  'x-root-tenant-id',
  'x-current-tenant-id',
  'tenant-id',
]

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const normalizePincode = (value: unknown) => {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim())
  return null
}

const isValidPincode = (value: number | null): value is number =>
  value !== null && Number.isInteger(value) && value >= 100000 && value <= 999999

const getForwardableTenantHeaders = (req: Request) =>
  TENANT_HEADER_NAMES.reduce<Record<string, string>>((headers, headerName) => {
    const value = req.headers[headerName]
    if (typeof value === 'string' && value.trim()) {
      headers[headerName] = value.trim()
    }
    return headers
  }, {})

const getForwardableAuthHeaders = (req: Request) => {
  const headers: Record<string, string> = {}
  const authorization = req.headers.authorization
  const tenantId = req.headers.tenantid
  const apiKey = req.headers['api-key']

  if (typeof authorization === 'string' && authorization.trim()) {
    headers.Authorization = authorization.trim()
  }
  if (typeof tenantId === 'string' && tenantId.trim()) {
    headers.TenantId = tenantId.trim()
  }
  if (typeof apiKey === 'string' && apiKey.trim()) {
    headers['Api-Key'] = apiKey.trim()
  }

  return headers
}

const hasInnofulfillAuth = (headers: Record<string, string>) =>
  Boolean(headers['Api-Key'] || (headers.Authorization && headers.TenantId))

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

export const innofulfillEcommServiceabilityController = async (req: Request, res: Response) => {
  const fromPincode = normalizePincode(req.body?.fromPincode)
  const toPincode = normalizePincode(req.body?.toPincode)
  const paymentMode = normalizeString(req.body?.paymentMode).toUpperCase() || undefined
  const operationType = normalizeString(req.body?.operationType).toUpperCase()
  const carriers = Array.isArray(req.body?.carriers)
    ? req.body.carriers.map((carrier: unknown) => normalizeString(carrier).toUpperCase()).filter(Boolean)
    : undefined
  const authHeaders = getForwardableAuthHeaders(req)

  if (!hasInnofulfillAuth(authHeaders)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide Api-Key or Authorization Bearer token with TenantId.',
    })
  }

  if (!isValidPincode(fromPincode) || !isValidPincode(toPincode) || !operationType) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid required fields',
      required: ['fromPincode', 'toPincode', 'operationType'],
    })
  }

  if (paymentMode && !SUPPORTED_PAYMENT_MODES.has(paymentMode)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid paymentMode. Currently supported: PREPAID, COD',
    })
  }

  if (req.body?.carriers !== undefined && (!carriers || carriers.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid carriers. Provide a non-empty array of carrier codes.',
    })
  }

  try {
    const result = await checkInnofulfillEcommServiceability(
      {
        fromPincode: fromPincode!,
        toPincode: toPincode!,
        ...(paymentMode ? { paymentMode: paymentMode as 'PREPAID' | 'COD' } : {}),
        operationType,
        ...(carriers ? { carriers } : {}),
      },
      authHeaders,
    )

    return res.status(result.status).json(result.data)
  } catch (error: any) {
    console.error('Innofulfill ECOMM serviceability request failed', {
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status,
    })

    return res.status(502).json({
      success: false,
      message: 'Unable to reach Innofulfill serviceability service',
    })
  }
}
