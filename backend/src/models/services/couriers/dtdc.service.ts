import axios, { AxiosInstance } from 'axios'
import { HttpError } from '../../../utils/classes'
import { DtdcConfig, getEffectiveCourierConfig } from '../courierCredentials.service'

const DTDC_TRACKING_BASE_URL = 'https://blktracksvc.dtdc.com'
const DTDC_TRACKING_ENDPOINT = '/dtdc-api/rest/JSONCnTrk/getTrackDetails'
const DTDC_CANCEL_BASE_URL = 'http://dtdcapi.shipsy.io'
const DTDC_CANCEL_ENDPOINT = '/api/customer/integration/consignment/cancel'

export class DtdcService {
  private apiBase = process.env.DTDC_API_BASE || DTDC_TRACKING_BASE_URL
  private cancelApiBase = process.env.DTDC_CANCEL_API_BASE || DTDC_CANCEL_BASE_URL
  private accessToken = process.env.DTDC_ACCESS_TOKEN || process.env.DTDC_API_KEY || ''
  private username = process.env.DTDC_USERNAME || ''
  private password = process.env.DTDC_PASSWORD || ''
  private customerCode = process.env.DTDC_CUSTOMER_CODE || ''
  private static cachedConfig: DtdcConfig | null | undefined
  private static cachedAccessToken: string | null = null

  static clearCachedConfig() {
    DtdcService.cachedConfig = undefined
    DtdcService.cachedAccessToken = null
  }

  private normalizeBaseUrl(value: unknown) {
    return String(value || DTDC_TRACKING_BASE_URL).trim().replace(/\/+$/, '') || DTDC_TRACKING_BASE_URL
  }

  private async ensureConfigLoaded() {
    if (DtdcService.cachedConfig === undefined) {
      DtdcService.cachedConfig = await getEffectiveCourierConfig<DtdcConfig>('dtdc', 'b2c')
    }

    const cfg = DtdcService.cachedConfig
    if (cfg) {
      this.apiBase = cfg.apiBase || this.apiBase
      this.cancelApiBase = cfg.cancelApiBase || this.cancelApiBase
      this.accessToken = cfg.accessToken || cfg.apiKey || this.accessToken
      this.username = cfg.username || this.username
      this.password = cfg.password || this.password
      this.customerCode = cfg.customerCode || this.customerCode
    }

    this.apiBase = this.normalizeBaseUrl(this.apiBase)
    this.cancelApiBase = this.normalizeBaseUrl(this.cancelApiBase || DTDC_CANCEL_BASE_URL)
  }

  private extractAccessToken(data: any) {
    if (typeof data === 'string') return data.trim()
    return String(
      data?.token ||
        data?.accessToken ||
        data?.access_token ||
        data?.apiKey ||
        data?.apikey ||
        data?.Token ||
        data?.['Token Access key'] ||
        '',
    ).trim()
  }

  async authenticate() {
    await this.ensureConfigLoaded()

    if (DtdcService.cachedAccessToken) return DtdcService.cachedAccessToken

    const username = String(this.username || '').trim()
    const password = String(this.password || '').trim()
    if (!username || !password) {
      throw new HttpError(400, 'DTDC username/password or X-Access-Token is not configured')
    }

    try {
      const response = await axios.get(`${this.apiBase}/dtdc-api/api/dtdc/authenticate`, {
        params: { username, password },
        timeout: 20000,
        validateStatus: () => true,
      })

      if (response.status !== 200) {
        throw new HttpError(
          response.status,
          typeof response.data === 'string'
            ? response.data
            : response.data?.message || response.data?.error || 'DTDC authentication failed',
        )
      }

      const token = this.extractAccessToken(response.data)
      if (!token) throw new HttpError(502, 'DTDC authentication did not return an access token')

      DtdcService.cachedAccessToken = token
      this.accessToken = token
      return token
    } catch (err: any) {
      if (err instanceof HttpError) throw err
      throw new HttpError(
        Number(err?.response?.status || 502),
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'DTDC authentication request failed',
      )
    }
  }

  private async getHttp(): Promise<AxiosInstance> {
    await this.ensureConfigLoaded()
    const token = String(this.accessToken || '').trim() || (await this.authenticate())

    return axios.create({
      baseURL: this.apiBase,
      timeout: 20000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Access-Token': token,
      },
    })
  }

  async trackShipment(awb: string, options: { trkType?: 'cnno' | 'reference'; addtnlDtl?: 'Y' | 'N' } = {}) {
    const normalizedAwb = String(awb || '').trim()
    if (!normalizedAwb) throw new HttpError(400, 'DTDC consignment number is required for tracking')

    const http = await this.getHttp()
    const payload = {
      trkType: options.trkType || 'cnno',
      strcnno: normalizedAwb,
      addtnlDtl: options.addtnlDtl || 'Y',
    }

    try {
      const response = await http.post(DTDC_TRACKING_ENDPOINT, payload)
      return response.data
    } catch (err: any) {
      throw new HttpError(
        Number(err?.response?.status || 502),
        err?.response?.data?.message ||
          err?.response?.data?.status ||
          err?.message ||
          'DTDC tracking request failed',
      )
    }
  }

  async cancelShipment(awb: string, customerCode?: string) {
    await this.ensureConfigLoaded()

    const normalizedAwb = String(awb || '').trim()
    if (!normalizedAwb) throw new HttpError(400, 'DTDC AWB number is required for cancellation')

    const resolvedCustomerCode = String(customerCode || this.customerCode || '').trim()
    if (!resolvedCustomerCode) {
      throw new HttpError(400, 'DTDC customer code is not configured')
    }

    const apiKey = String(this.accessToken || '').trim() || (await this.authenticate())
    if (!apiKey) throw new HttpError(400, 'DTDC API key is not configured')

    try {
      const response = await axios.post(
        `${this.cancelApiBase}${DTDC_CANCEL_ENDPOINT}`,
        {
          AWBNo: [normalizedAwb],
          customerCode: resolvedCustomerCode,
        },
        {
          timeout: 20000,
          validateStatus: () => true,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
        },
      )

      if (response.status < 200 || response.status >= 300) {
        throw new HttpError(
          response.status,
          response.data?.message || response.data?.error || 'DTDC cancellation request failed',
        )
      }

      return response.data
    } catch (err: any) {
      if (err instanceof HttpError) throw err
      throw new HttpError(
        Number(err?.response?.status || 502),
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'DTDC cancellation request failed',
      )
    }
  }
}
