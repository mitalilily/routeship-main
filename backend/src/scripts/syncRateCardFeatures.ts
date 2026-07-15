import { randomUUID } from 'crypto'
import { Client } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const sync = async () => {
  const client = new Client({ connectionString: databaseUrl, ssl: databaseUrl.includes('localhost') ? undefined : { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query('BEGIN')
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE IF NOT EXISTS routeship_additional_charge_masters (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(150) NOT NULL, code varchar(80) NOT NULL UNIQUE,
        default_mode varchar(30) NOT NULL DEFAULT 'flat', default_basis varchar(40) NOT NULL DEFAULT 'shipment',
        description text, is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS routeship_diesel_rates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), diesel_rate numeric(10,2) NOT NULL, effective_date date NOT NULL,
        remarks text, is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS routeship_international_rate_cards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(180) NOT NULL, origin_zone varchar(20) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS routeship_international_rates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rate_card_id uuid NOT NULL REFERENCES routeship_international_rate_cards(id) ON DELETE CASCADE,
        delivery_partner varchar(150) NOT NULL, destination_country varchar(2) NOT NULL,
        min_weight numeric(10,3) NOT NULL DEFAULT 0, max_weight numeric(10,3) NOT NULL,
        base_rate numeric(12,2) NOT NULL DEFAULT 0, rate_per_kg numeric(12,2) NOT NULL,
        currency varchar(3) NOT NULL DEFAULT 'INR', estimated_days varchar(40), is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS shiplifi_holidays (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(200) NOT NULL, date date NOT NULL, description text,
        type varchar(50) NOT NULL, state varchar(200), courier_id integer, service_provider varchar(100),
        is_recurring boolean NOT NULL DEFAULT false, year integer, is_active boolean NOT NULL DEFAULT true,
        metadata text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        created_by varchar(100)
      );
      ALTER TABLE routeship_additional_charge_masters ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE routeship_diesel_rates ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE routeship_international_rate_cards ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE routeship_international_rates ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE shiplifi_holidays ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `)

    const existing = await client.query(`SELECT id FROM routeship_international_rate_cards WHERE name = $1 LIMIT 1`, ['INTERNATIONAL PURCHASE RATES'])
    const cardId = existing.rows[0]?.id || randomUUID()
    if (!existing.rowCount) {
      await client.query(`INSERT INTO routeship_international_rate_cards (id, name, origin_zone) VALUES ($1, $2, $3)`, [cardId, 'INTERNATIONAL PURCHASE RATES', 'AU'])
    }
    const rateCount = await client.query(`SELECT COUNT(*)::int AS count FROM routeship_international_rates WHERE rate_card_id = $1`, [cardId])
    if (!rateCount.rows[0].count) {
      const bands = [
        ['RouteShip Global Express', '0', '5', '450', '320', '4-7 business days'],
        ['RouteShip Global Express', '5', '20', '350', '285', '4-7 business days'],
        ['RouteShip Economy', '0', '5', '300', '245', '8-12 business days'],
        ['RouteShip Economy', '5', '20', '250', '210', '8-12 business days'],
      ]
      for (const [partner, minWeight, maxWeight, baseRate, ratePerKg, estimatedDays] of bands) {
        await client.query(`INSERT INTO routeship_international_rates (id, rate_card_id, delivery_partner, destination_country, min_weight, max_weight, base_rate, rate_per_kg, estimated_days) VALUES ($1,$2,$3,'*',$4,$5,$6,$7,$8)`, [randomUUID(), cardId, partner, minWeight, maxWeight, baseRate, ratePerKg, estimatedDays])
      }
    }
    await client.query('COMMIT')
    console.log('Rate Card feature tables synchronized')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

sync().catch((error) => { console.error('Rate Card feature sync failed:', error); process.exit(1) })
