import * as dotenv from 'dotenv'
import * as path from 'path'
import { Pool, PoolClient } from 'pg'

const DTDC_PROVIDER = 'dtdc'
const DEFAULT_DTDC_BASE = 'https://blktracksvc.dtdc.com'

const DTDC_COURIERS = [
  { id: 4001, name: 'DTDC Surface', mode: 'surface' },
  { id: 4002, name: 'DTDC Air', mode: 'air' },
] as const

const normalize = (value: unknown) => String(value || '').trim()

const normalizeBaseUrl = (value: unknown) => normalize(value).replace(/\/+$/, '') || DEFAULT_DTDC_BASE

const loadEnv = () => {
  const env = process.env.NODE_ENV || 'development'
  dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })
}

const requiredEnv = (key: string) => {
  const value = normalize(process.env[key])
  if (!value) throw new Error(`${key} is required`)
  return value
}

const upsertDtdcCredentials = async (
  client: PoolClient,
  config: {
    apiBase: string
    cancelApiBase: string
    clientName: string
    username: string
    password: string
    customerCode: string
    accessToken: string
  },
) => {
  if (!config.accessToken && (!config.username || !config.password) && !config.customerCode) return false

  await client.query(
    `insert into courier_credentials
       (provider, api_base, client_name, username, password, api_key, metadata, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, now(), now())
     on conflict (provider) do update set
       api_base = excluded.api_base,
       client_name = excluded.client_name,
       username = case when excluded.username <> '' then excluded.username else courier_credentials.username end,
       password = case when excluded.password <> '' then excluded.password else courier_credentials.password end,
       api_key = case when excluded.api_key <> '' then excluded.api_key else courier_credentials.api_key end,
       metadata = courier_credentials.metadata || excluded.metadata,
       updated_at = now()`,
    [
      DTDC_PROVIDER,
      config.apiBase,
      config.clientName,
      config.username,
      config.password,
      config.accessToken,
      JSON.stringify({
        cancelApiBase: config.cancelApiBase,
        customerCode: config.customerCode,
      }),
    ],
  )

  return true
}

const upsertDtdcCouriers = async (client: PoolClient) => {
  for (const courier of DTDC_COURIERS) {
    await client.query(
      `insert into couriers (id, name, "serviceProvider", "isEnabled", business_type, created_at, updated_at)
       values ($1, $2, $3, true, '["b2c"]'::jsonb, now(), now())
       on conflict (id, "serviceProvider") do update set
         name = excluded.name,
         "isEnabled" = true,
         business_type = '["b2c"]'::jsonb,
         updated_at = now()`,
      [courier.id, courier.name, DTDC_PROVIDER],
    )
  }
}

async function main() {
  loadEnv()

  const databaseUrl = requiredEnv('DATABASE_URL')
  const config = {
    apiBase: normalizeBaseUrl(process.env.DTDC_API_BASE),
    cancelApiBase: normalizeBaseUrl(process.env.DTDC_CANCEL_API_BASE || 'http://dtdcapi.shipsy.io'),
    clientName: normalize(process.env.DTDC_CLIENT_NAME),
    username: normalize(process.env.DTDC_USERNAME),
    password: normalize(process.env.DTDC_PASSWORD),
    customerCode: normalize(process.env.DTDC_CUSTOMER_CODE),
    accessToken: normalize(process.env.DTDC_ACCESS_TOKEN || process.env.DTDC_API_KEY),
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  const client = await pool.connect()
  try {
    await client.query('begin')
    const credentialsSaved = await upsertDtdcCredentials(client, config)
    await upsertDtdcCouriers(client)
    await client.query('commit')

    console.log(
      JSON.stringify(
        {
          provider: DTDC_PROVIDER,
          apiBase: config.apiBase,
          cancelApiBase: config.cancelApiBase,
          clientName: config.clientName || null,
          credentialsSaved,
          usernameConfigured: Boolean(config.username),
          passwordConfigured: Boolean(config.password),
          customerCodeConfigured: Boolean(config.customerCode),
          accessTokenConfigured: Boolean(config.accessToken),
          couriers: DTDC_COURIERS.map(({ id, name, mode }) => ({ id, name, mode })),
          ratesSeeded: false,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    await client.query('rollback').catch(() => undefined)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
