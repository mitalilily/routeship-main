import axios from 'axios'

export type InnofulfillSigninType = 'EMAIL'

export interface InnofulfillLoginInput {
  username: string
  password: string
  signinType: InnofulfillSigninType
}

export interface InnofulfillRefreshTokenInput {
  userId: string
  refreshToken: string
}

export interface InnofulfillEcommServiceabilityInput {
  fromPincode: number
  toPincode: number
  paymentMode?: 'PREPAID' | 'COD'
  operationType: string
  carriers?: string[]
}

export interface InnofulfillEcommRateCalculationInput {
  fromPincode: number
  toPincode: number
  serviceType: 'ECOMM' | 'HYPERLOCAL'
  productType: 'ECOMM' | 'HYPERLOCAL'
  weight: number
  length: number
  height: number
  width: number
  distance?: number
  includeDefaultCharges?: boolean
  userOptions?: Record<string, unknown>
  filters:
    | {
    delivery_mode: 'SURFACE' | 'AIR'
  }
    | Record<string, never>
}

export type InnofulfillTenantHeaders = Record<string, string>
export type InnofulfillAuthHeaders = Record<string, string>
export type InnofulfillQueryParams = Record<string, string | string[]>

const DEFAULT_INNOFULFILL_API_BASE = 'https://apis.innofulfill.com'

const normalizeBaseUrl = (value?: string) =>
  String(value || DEFAULT_INNOFULFILL_API_BASE).trim().replace(/\/+$/, '')

export const loginToInnofulfill = async (
  input: InnofulfillLoginInput,
  tenantHeaders: InnofulfillTenantHeaders = {},
) => {
  const apiBase = normalizeBaseUrl(process.env.INNOFULFILL_API_BASE)

  const response = await axios.post(`${apiBase}/auth/login`, input, {
    headers: {
      'Content-Type': 'application/json',
      ...tenantHeaders,
    },
    timeout: Number(process.env.INNOFULFILL_REQUEST_TIMEOUT_MS || 15000),
    validateStatus: () => true,
  })

  return {
    status: response.status,
    data: response.data,
  }
}

export const refreshInnofulfillToken = async (
  input: InnofulfillRefreshTokenInput,
  tenantHeaders: InnofulfillTenantHeaders = {},
) => {
  const apiBase = normalizeBaseUrl(process.env.INNOFULFILL_API_BASE)

  const response = await axios.post(`${apiBase}/auth/refresh-token`, input, {
    headers: {
      'Content-Type': 'application/json',
      ...tenantHeaders,
    },
    timeout: Number(process.env.INNOFULFILL_REQUEST_TIMEOUT_MS || 15000),
    validateStatus: () => true,
  })

  return {
    status: response.status,
    data: response.data,
  }
}

export const checkInnofulfillEcommServiceability = async (
  input: InnofulfillEcommServiceabilityInput,
  authHeaders: InnofulfillAuthHeaders,
) => {
  const apiBase = normalizeBaseUrl(process.env.INNOFULFILL_API_BASE)

  const response = await axios.post(`${apiBase}/gateway/serviceability/ecomm`, input, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    timeout: Number(process.env.INNOFULFILL_REQUEST_TIMEOUT_MS || 15000),
    validateStatus: () => true,
  })

  return {
    status: response.status,
    data: response.data,
  }
}

export const calculateInnofulfillEcommRates = async (
  input: InnofulfillEcommRateCalculationInput,
  authHeaders: InnofulfillAuthHeaders,
) => {
  const apiBase = normalizeBaseUrl(process.env.INNOFULFILL_API_BASE)

  const response = await axios.post(
    `${apiBase}/gateway/ure/api/external/rate-calculation/calculate/v2`,
    input,
    {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      timeout: Number(process.env.INNOFULFILL_REQUEST_TIMEOUT_MS || 15000),
      validateStatus: () => true,
    },
  )

  return {
    status: response.status,
    data: response.data,
  }
}

export const listInnofulfillOrders = async (
  query: InnofulfillQueryParams,
  authHeaders: InnofulfillAuthHeaders,
) => {
  const apiBase = normalizeBaseUrl(process.env.INNOFULFILL_API_BASE)

  const response = await axios.get(`${apiBase}/gateway/booking-service/orders`, {
    headers: {
      ...authHeaders,
    },
    params: query,
    timeout: Number(process.env.INNOFULFILL_REQUEST_TIMEOUT_MS || 15000),
    validateStatus: () => true,
  })

  return {
    status: response.status,
    data: response.data,
  }
}
