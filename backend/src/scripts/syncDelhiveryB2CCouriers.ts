import { and, eq, notInArray, sql } from 'drizzle-orm'
import { db, pool } from '../models/client'
import { getDelhiveryCredentials } from '../models/services/delhiveryCredentials.service'
import { getConfiguredCourierProviderSet } from '../models/services/courierCredentials.service'
import { couriers } from '../models/schema/couriers'
import { DELHIVERY_COURIER_IDS } from '../utils/delhiveryCourier'

const DELHIVERY_B2C_COURIERS = [
  {
    id: DELHIVERY_COURIER_IDS.EXPRESS,
    name: 'Delhivery Air',
  },
  {
    id: DELHIVERY_COURIER_IDS.SURFACE,
    name: 'Delhivery Surface',
  },
] as const

const main = async () => {
  const configuredProviders = await getConfiguredCourierProviderSet()
  const credentials = await getDelhiveryCredentials()
  if (!configuredProviders.has('delhivery') || !credentials.apiKey || !credentials.clientName) {
    throw new Error(
      'Valid Delhivery B2C credentials (API key and exact client/HQ name) are required before syncing couriers',
    )
  }

  await db.transaction(async (tx) => {
    for (const courier of DELHIVERY_B2C_COURIERS) {
      await tx
        .insert(couriers)
        .values({
          id: courier.id,
          name: courier.name,
          serviceProvider: 'delhivery',
          businessType: ['b2c'],
          isEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [couriers.id, couriers.serviceProvider],
          set: {
            name: courier.name,
            businessType: ['b2c'],
            isEnabled: true,
            updatedAt: new Date(),
          },
        })
    }

    await tx
      .update(couriers)
      .set({
        businessType: sql`coalesce(${couriers.businessType}, '[]'::jsonb) - 'b2c'`,
        isEnabled: sql`case when coalesce(${couriers.businessType}, '[]'::jsonb) @> '["b2b"]'::jsonb then ${couriers.isEnabled} else false end`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sql`lower(${couriers.serviceProvider})`, 'delhivery'),
          notInArray(
            couriers.id,
            DELHIVERY_B2C_COURIERS.map((courier) => courier.id),
          ),
          sql`coalesce(${couriers.businessType}, '[]'::jsonb) @> '["b2c"]'::jsonb`,
        ),
      )
  })

  console.log(
    JSON.stringify({
      provider: 'delhivery',
      clientName: credentials.clientName,
      couriers: DELHIVERY_B2C_COURIERS,
    }),
  )
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
