import axios from 'axios'

export type InnofulfillSigninType = 'EMAIL'

export interface InnofulfillLoginInput {
  username: string
  password: string
  signinType: InnofulfillSigninType
}

export type InnofulfillTenantHeaders = Record<string, string>

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
