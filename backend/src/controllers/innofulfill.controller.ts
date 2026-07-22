import { Request, Response } from 'express'
import {
  calculateInnofulfillEcommRates,
  cancelInnofulfillOrdersBulk,
  checkInnofulfillEcommServiceability,
  createInnofulfillOrder,
  getInnofulfillOrder,
  listInnofulfillOrders,
  loginToInnofulfill,
  manifestInnofulfillOrdersBulk,
  refreshInnofulfillToken,
} from '../models/services/innofulfill.service'

const SUPPORTED_SIGNIN_TYPES = new Set(['EMAIL'])
const SUPPORTED_PAYMENT_MODES = new Set(['PREPAID', 'COD'])
const SUPPORTED_DELIVERY_MODES = new Set(['SURFACE', 'AIR'])
const SUPPORTED_RATE_TYPES = new Set(['ECOMM', 'HYPERLOCAL'])
const SUPPORTED_ORDER_TYPES = new Set(['FORWARD', 'REVERSE'])
const SUPPORTED_ORDER_CATEGORIES = new Set(['ECOMM', 'HYPERLOCAL'])
const ORDER_LIST_QUERY_PARAMS = new Set([
  'page',
  'limit',
  'sortOrder',
  'orderId',
  'referenceId',
  'orderStatus',
  'orderType',
  'parcelCategory',
  'deliveryMode',
  'deliveryPromise',
  'carrierName',
  'awbNumber',
  'phone',
  'paymentType',
  'startDate',
  'endDate',
  'manifested',
  'autoManifest',
  'returnable',
  'filterByCurrentUser',
  'bulkId',
  'destinationCity',
  'destinationZip',
  'addresses.type',
  'addresses.state',
  'addresses.city',
  'addresses.zip',
  'addresses.country',
])
const TENANT_HEADER_NAMES = [
  'x-tenant-id',
  'x-root-tenant-id',
  'x-current-tenant-id',
  'tenant-id',
]

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const normalizeNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value.trim()))) {
    return Number(value.trim())
  }
  return null
}
const normalizePincode = (value: unknown) => {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim())
  return null
}

const isValidPincode = (value: number | null): value is number =>
  value !== null && Number.isInteger(value) && value >= 100000 && value <= 999999
const isPositiveNumber = (value: number | null): value is number => value !== null && value > 0
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

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

const getForwardableQueryParams = (
  query: Request['query'],
  allowedParams: Set<string>,
) =>
  Object.entries(query).reduce<Record<string, string | string[]>>((params, [key, value]) => {
    if (!allowedParams.has(key)) return params

    if (typeof value === 'string' && value.trim()) {
      params[key] = value.trim()
    } else if (Array.isArray(value)) {
      const values = value
        .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
        .map((item) => item.trim())
      if (values.length) params[key] = values
    }

    return params
  }, {})

const hasAddressType = (addresses: unknown[], type: string) =>
  addresses.some((address) => isPlainObject(address) && normalizeString(address.type).toUpperCase() === type)

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

export const innofulfillEcommRateCalculationController = async (req: Request, res: Response) => {
  const fromPincode = normalizePincode(req.body?.fromPincode)
  const toPincode = normalizePincode(req.body?.toPincode)
  const serviceType = normalizeString(req.body?.serviceType).toUpperCase()
  const productType = normalizeString(req.body?.productType).toUpperCase()
  const weight = normalizeNumber(req.body?.weight)
  const length = normalizeNumber(req.body?.length)
  const height = normalizeNumber(req.body?.height)
  const width = normalizeNumber(req.body?.width)
  const distance = normalizeNumber(req.body?.distance)
  const deliveryMode = normalizeString(req.body?.filters?.delivery_mode).toUpperCase()
  const authHeaders = getForwardableAuthHeaders(req)
  const isEcommRate = serviceType === 'ECOMM' && productType === 'ECOMM'
  const isHyperlocalRate = serviceType === 'HYPERLOCAL' && productType === 'HYPERLOCAL'

  if (!hasInnofulfillAuth(authHeaders)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide Api-Key or Authorization Bearer token with TenantId.',
    })
  }

  if (
    !isValidPincode(fromPincode) ||
    !isValidPincode(toPincode) ||
    !SUPPORTED_RATE_TYPES.has(serviceType) ||
    !SUPPORTED_RATE_TYPES.has(productType) ||
    serviceType !== productType ||
    !isPositiveNumber(weight) ||
    !isPositiveNumber(length) ||
    !isPositiveNumber(height) ||
    !isPositiveNumber(width)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid required fields',
      required: [
        'fromPincode',
        'toPincode',
        'serviceType=ECOMM|HYPERLOCAL',
        'productType=ECOMM|HYPERLOCAL',
        'weight',
        'length',
        'height',
        'width',
      ],
    })
  }

  if (isEcommRate && !SUPPORTED_DELIVERY_MODES.has(deliveryMode)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid filters.delivery_mode. Currently supported: SURFACE, AIR',
    })
  }

  if (isHyperlocalRate && !isPositiveNumber(distance)) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid distance. HYPERLOCAL rate calculation requires distance in kilometres.',
    })
  }

  if (isHyperlocalRate && req.body?.filters?.delivery_mode !== undefined) {
    return res.status(400).json({
      success: false,
      message: 'Invalid filters for HYPERLOCAL. Leave filters as an empty object.',
    })
  }

  if (
    req.body?.includeDefaultCharges !== undefined &&
    typeof req.body.includeDefaultCharges !== 'boolean'
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid includeDefaultCharges. Provide a boolean value.',
    })
  }

  try {
    const result = await calculateInnofulfillEcommRates(
      {
        fromPincode,
        toPincode,
        serviceType: serviceType as 'ECOMM' | 'HYPERLOCAL',
        productType: productType as 'ECOMM' | 'HYPERLOCAL',
        weight,
        length,
        height,
        width,
        ...(isHyperlocalRate ? { distance: distance! } : {}),
        ...(typeof req.body?.includeDefaultCharges === 'boolean'
          ? { includeDefaultCharges: req.body.includeDefaultCharges }
          : {}),
        ...(req.body?.userOptions && typeof req.body.userOptions === 'object'
          ? { userOptions: req.body.userOptions }
          : {}),
        filters: isEcommRate
          ? {
              delivery_mode: deliveryMode as 'SURFACE' | 'AIR',
            }
          : {},
      },
      authHeaders,
    )

    return res.status(result.status).json(result.data)
  } catch (error: any) {
    console.error('Innofulfill ECOMM rate calculation request failed', {
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status,
    })

    return res.status(502).json({
      success: false,
      message: 'Unable to reach Innofulfill rate calculation service',
    })
  }
}

export const innofulfillListOrdersController = async (req: Request, res: Response) => {
  const authHeaders = getForwardableAuthHeaders(req)

  if (!hasInnofulfillAuth(authHeaders)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide Api-Key or Authorization Bearer token with TenantId.',
    })
  }

  try {
    const result = await listInnofulfillOrders(
      getForwardableQueryParams(req.query, ORDER_LIST_QUERY_PARAMS),
      authHeaders,
    )

    return res.status(result.status).json(result.data)
  } catch (error: any) {
    console.error('Innofulfill list orders request failed', {
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status,
    })

    return res.status(502).json({
      success: false,
      message: 'Unable to reach Innofulfill orders service',
    })
  }
}

export const innofulfillCreateOrderController = async (req: Request, res: Response) => {
  const authHeaders = getForwardableAuthHeaders(req)
  const payload = isPlainObject(req.body) ? req.body : null

  if (!hasInnofulfillAuth(authHeaders)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide Api-Key or Authorization Bearer token with TenantId.',
    })
  }

  if (!payload) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid request body',
    })
  }

  const orderType = normalizeString(payload.orderType).toUpperCase()
  const orderStatus = normalizeString(payload.orderStatus).toUpperCase()
  const parcelCategory = normalizeString(payload.parcelCategory).toUpperCase()
  const deliveryPromise = normalizeString(payload.deliveryPromise).toUpperCase()
  const deliveryMode = normalizeString(payload.deliveryMode).toUpperCase()
  const carrierId = normalizeString(payload.carrierId)
  const carrierName = normalizeString(payload.carrierName)
  const addresses = Array.isArray(payload.addresses) ? payload.addresses : []
  const shipments = Array.isArray(payload.shipments) ? payload.shipments : []
  const isEcommOrder = parcelCategory === 'ECOMM' && deliveryPromise === 'ECOMM'
  const isHyperlocalOrder = parcelCategory === 'HYPERLOCAL' && deliveryPromise === 'HYPERLOCAL'

  if (
    !SUPPORTED_ORDER_TYPES.has(orderType) ||
    orderStatus !== 'CONFIRMED' ||
    !SUPPORTED_ORDER_CATEGORIES.has(parcelCategory) ||
    parcelCategory !== deliveryPromise ||
    (isEcommOrder && !SUPPORTED_DELIVERY_MODES.has(deliveryMode)) ||
    (isHyperlocalOrder && deliveryMode !== '') ||
    (isEcommOrder && !carrierId) ||
    !carrierName ||
    !Array.isArray(payload.addresses) ||
    !hasAddressType(addresses, 'PICKUP') ||
    !hasAddressType(addresses, 'DELIVERY') ||
    !Array.isArray(payload.shipments) ||
    shipments.length === 0 ||
    !isPlainObject(payload.payment)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid required fields',
      required: [
        'orderType=FORWARD|REVERSE',
        'orderStatus=CONFIRMED',
        'parcelCategory=ECOMM|HYPERLOCAL',
        'deliveryPromise matching parcelCategory',
        'deliveryMode=SURFACE|AIR for ECOMM or empty for HYPERLOCAL',
        'carrierId for ECOMM',
        'carrierName',
        'addresses with PICKUP and DELIVERY',
        'shipments',
        'payment',
      ],
    })
  }

  try {
    const result = await createInnofulfillOrder(payload, authHeaders)

    return res.status(result.status).json(result.data)
  } catch (error: any) {
    console.error('Innofulfill create order request failed', {
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status,
    })

    return res.status(502).json({
      success: false,
      message: 'Unable to reach Innofulfill orders service',
    })
  }
}

export const innofulfillGetOrderController = async (req: Request, res: Response) => {
  const authHeaders = getForwardableAuthHeaders(req)
  const orderId = normalizeString(req.params.orderId)

  if (!hasInnofulfillAuth(authHeaders)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide Api-Key or Authorization Bearer token with TenantId.',
    })
  }

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required path parameter: orderId',
    })
  }

  try {
    const result = await getInnofulfillOrder(orderId, authHeaders)

    return res.status(result.status).json(result.data)
  } catch (error: any) {
    console.error('Innofulfill get order request failed', {
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status,
    })

    return res.status(502).json({
      success: false,
      message: 'Unable to reach Innofulfill orders service',
    })
  }
}

export const innofulfillBulkManifestOrdersController = async (req: Request, res: Response) => {
  const authHeaders = getForwardableAuthHeaders(req)
  const orderIds = Array.isArray(req.body?.orderIds)
    ? req.body.orderIds.map((orderId: unknown) => normalizeString(orderId)).filter(Boolean)
    : []

  if (!hasInnofulfillAuth(authHeaders)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide Api-Key or Authorization Bearer token with TenantId.',
    })
  }

  if (orderIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid orderIds. Provide a non-empty array of order IDs.',
      required: ['orderIds'],
    })
  }

  try {
    const result = await manifestInnofulfillOrdersBulk({ orderIds }, authHeaders)

    return res.status(result.status).json(result.data)
  } catch (error: any) {
    console.error('Innofulfill bulk manifest request failed', {
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status,
    })

    return res.status(502).json({
      success: false,
      message: 'Unable to reach Innofulfill manifest service',
    })
  }
}

export const innofulfillBulkCancelOrdersController = async (req: Request, res: Response) => {
  const authHeaders = getForwardableAuthHeaders(req)
  const orders = Array.isArray(req.body?.orders)
    ? req.body.orders
        .map((order: unknown) => {
          if (!isPlainObject(order)) return null

          return {
            orderId: normalizeString(order.orderId),
            reason: normalizeString(order.reason),
          }
        })
        .filter((order: { orderId: string; reason: string } | null): order is { orderId: string; reason: string } =>
          Boolean(order?.orderId && order.reason),
        )
    : []

  if (!hasInnofulfillAuth(authHeaders)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide Api-Key or Authorization Bearer token with TenantId.',
    })
  }

  if (!Array.isArray(req.body?.orders) || orders.length !== req.body.orders.length || orders.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid orders. Each entry requires orderId and reason.',
      required: ['orders[].orderId', 'orders[].reason'],
    })
  }

  try {
    const result = await cancelInnofulfillOrdersBulk({ orders }, authHeaders)

    return res.status(result.status).json(result.data)
  } catch (error: any) {
    console.error('Innofulfill bulk cancel request failed', {
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status,
    })

    return res.status(502).json({
      success: false,
      message: 'Unable to reach Innofulfill cancel service',
    })
  }
}
