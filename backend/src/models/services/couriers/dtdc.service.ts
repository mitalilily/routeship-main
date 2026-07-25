import axios, { AxiosInstance } from 'axios'
import { HttpError } from '../../../utils/classes'
import { DtdcConfig, getEffectiveCourierConfig } from '../courierCredentials.service'

const DTDC_TRACKING_BASE_URL = 'https://blktracksvc.dtdc.com'
const DTDC_TRACKING_ENDPOINT = '/dtdc-api/rest/JSONCnTrk/getTrackDetails'

export class DtdcService {
  private apiBase = process.env.DTDC_API_BASE || DTDC_TRACKING_BASE_URL
  private accessToken = process.env.DTDC_ACCESS_TOKEN || process.env.DTDC_API_KEY || ''
  private static cachedConfig: DtdcConfig | null | undefined

  static clearCachedConfig() {
    DtdcService.cachedConfig = undefined
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
      this.accessToken = cfg.accessToken || cfg.apiKey || this.accessToken
    }

    this.apiBase = this.normalizeBaseUrl(this.apiBase)
  }

  private async getHttp(): Promise<AxiosInstance> {
    await this.ensureConfigLoaded()
    const token = String(this.accessToken || '').trim()
    if (!token) throw new HttpError(400, 'DTDC X-Access-Token is not configured')

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
}
