import { and, eq, sql } from 'drizzle-orm'

import { db, pool } from '../models/client'
import { couriers } from '../models/schema/couriers'
import { courier_credentials } from '../models/schema/courierCredentials'
import { XpressbeesService } from '../models/services/couriers/xpressbees.service'

const SERVICE_PROVIDER = 'xpressbees'
const DEFAULT_API_BASE = 'https://shipment.xpressbees.com'
const FALLBACK_COURIER = {
  id: 5101,
  name: 'Xpressbees Route Serviceability',
} as const

type XpressbeesCourierRow = {
  id: string
  name: string
}

const argValue = (name: string) => {
  const prefix = `--${name}=`
  const found = process.argv.find((arg) => arg.startsWith(prefix))
  return found ? found.slice(prefix.length).trim() : ''
}

const normalize = (value: unknown) => String(value || '').trim()

const resolveCredentialInput = () => ({
  apiBase: argValue('api-base') || normalize(process.env.XPRESSBEES_API_BASE) || DEFAULT_API_BASE,
  username:
    argValue('username') ||
    normalize(process.env.XPRESSBEES_USERNAME) ||
    normalize(process.env.XPRESSBEES_USER),
  password: argValue('password') || normalize(process.env.XPRESSBEES_PASSWORD),
  secretKey: argValue('secret-key') || normalize(process.env.XPRESSBEES_SECRET_KEY),
  xbKey: argValue('xb-key') || normalize(process.env.XPRESSBEES_XB_KEY),
  xbAccessKey:
    argValue('xb-access-key') ||
    normalize(process.env.XPRESSBEES_XB_ACCESS_KEY) ||
    normalize(process.env.XPRESSBEES_XB_KEY),
  businessAccountName:
    argValue('business-account-name') ||
    normalize(process.env.XPRESSBEES_BUSINESS_ACCOUNT_NAME) ||
    'RAM ENTERPRISES',
})

const upsertCredentials = async (input: ReturnType<typeof resolveCredentialInput>, token: string) => {
  const [existing] = await db
    .select({ metadata: courier_credentials.metadata })
    .from(courier_credentials)
    .where(eq(courier_credentials.provider, SERVICE_PROVIDER))
    .limit(1)

  const existingMetadata =
    existing?.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}
  const metadata = {
    ...existingMetadata,
    authTokenSource: 'userauthapis',
    secretKey: input.secretKey,
    xbKey: input.xbKey,
    xbAccessKey: input.xbAccessKey || input.xbKey,
    businessAccountName: input.businessAccountName,
    pincodeBusinessUnit: 'eComm',
    pincodeBusinessFlow: 'Forward',
    pickupBusinessService: 'PickUp',
    deliveryBusinessService: 'Delivery',
    serviceabilityVersion: 'v1',
    trackingVersion: 'v1',
    tokenUpdatedAt: new Date().toISOString(),
  }

  await db
    .insert(courier_credentials)
    .values({
      provider: SERVICE_PROVIDER,
      apiBase: input.apiBase,
      clientName: input.businessAccountName,
      apiKey: token,
      username: input.username,
      password: input.password,
      metadata,
      updatedAt: new Date(),
    } as any)
    .onConflictDoUpdate({
      target: courier_credentials.provider,
      set: {
        apiBase: sql`coalesce(nullif(excluded.api_base, ''), ${courier_credentials.apiBase})`,
        clientName: sql`coalesce(nullif(excluded.client_name, ''), ${courier_credentials.clientName})`,
        apiKey: token,
        username: input.username,
        password: input.password,
        metadata,
        updatedAt: new Date(),
      } as any,
    })
}

const buildFallbackRows = (): XpressbeesCourierRow[] => [
  {
    id: String(FALLBACK_COURIER.id),
    name: FALLBACK_COURIER.name,
  },
]

async function main() {
  const credentials = resolveCredentialInput()
  if (!credentials.username || !credentials.password || !credentials.secretKey || !credentials.xbKey) {
    throw new Error(
      'XPRESSBEES_USERNAME, XPRESSBEES_PASSWORD, XPRESSBEES_SECRET_KEY and XPRESSBEES_XB_KEY are required before syncing couriers.',
    )
  }

  const xpressbees = new XpressbeesService()
  const token = await xpressbees.getApiToken(true)
  if (!token) throw new Error('Xpressbees token generation did not return a token.')

  const serviceability = await xpressbees.checkServiceability({
    origin: '122001',
    destination: '400001',
    payment_type: 'prepaid',
    order_amount: '499',
    weight: '500',
    length: '10',
    breadth: '10',
    height: '10',
  })
  if (!serviceability.serviceable) {
    throw new Error('Xpressbees route serviceability validation failed for the sync probe.')
  }

  await upsertCredentials(credentials, token)

  let rows: XpressbeesCourierRow[] = []
  let source: 'provider-courier-list' | 'route-serviceability-fallback' = 'provider-courier-list'
  try {
    const response = await xpressbees.listCouriers()
    if (response?.status === true && Array.isArray(response?.data)) {
      rows = response.data as XpressbeesCourierRow[]
    } else {
      throw new Error('Invalid Xpressbees courier list response')
    }
  } catch (error: any) {
    source = 'route-serviceability-fallback'
    rows = buildFallbackRows()
    console.warn(
      `Xpressbees courier-list endpoint unavailable (${error?.message || error}). Synced verified route-serviceability courier instead.`,
    )
  }

  if (!rows.length) {
    console.log('No Xpressbees couriers returned by API.')
    return
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const courierId = Number(String(row?.id || '').trim())
    const courierName = String(row?.name || '').trim()

    if (!Number.isFinite(courierId) || !courierName) {
      skipped += 1
      console.warn('Skipping invalid Xpressbees courier row:', row)
      continue
    }

    const [existing] = await db
      .select()
      .from(couriers)
      .where(and(eq(couriers.id, courierId), eq(couriers.serviceProvider, SERVICE_PROVIDER)))
      .limit(1)

    if (existing) {
      const nextBusinessType = Array.isArray(existing.businessType)
        ? Array.from(new Set([...existing.businessType, 'b2c']))
        : ['b2c']
      const shouldUpdate =
        existing.name !== courierName ||
        existing.isEnabled !== true ||
        JSON.stringify(existing.businessType) !== JSON.stringify(nextBusinessType)

      if (shouldUpdate) {
        await db
          .update(couriers)
          .set({
            name: courierName,
            businessType: nextBusinessType,
            isEnabled: true,
            updatedAt: new Date(),
          } as any)
          .where(and(eq(couriers.id, courierId), eq(couriers.serviceProvider, SERVICE_PROVIDER)))
        updated += 1
      } else {
        skipped += 1
      }
      continue
    }

    await db.insert(couriers).values({
      id: courierId,
      name: courierName,
      serviceProvider: SERVICE_PROVIDER,
      businessType: ['b2c'],
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    created += 1
  }

  console.log(
    JSON.stringify({
      provider: SERVICE_PROVIDER,
      source,
      created,
      updated,
      skipped,
      couriers: rows,
    }),
  )
}

main()
  .catch((error) => {
    console.error('Xpressbees courier sync failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
