import { and, asc, eq, gte, ilike, lte, or } from 'drizzle-orm'
import { db } from '../client'
import {
  internationalCountryZones,
  internationalRateCards,
  internationalRates,
} from '../schema/rateCardMasters'

const normalizeCountryKey = (value: unknown) =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const listInternationalCountryZones = async () =>
  db
    .select()
    .from(internationalCountryZones)
    .where(eq(internationalCountryZones.isActive, true))
    .orderBy(asc(internationalCountryZones.countryName))

export const listInternationalRateCards = async () => {
  const cards = await db.select().from(internationalRateCards).where(eq(internationalRateCards.isActive, true)).orderBy(asc(internationalRateCards.name))
  const rates = await db
    .select({
      rateCardId: internationalRates.rateCardId,
      deliveryPartner: internationalRates.deliveryPartner,
      destinationZone: internationalRates.destinationZone,
    })
    .from(internationalRates)
    .where(eq(internationalRates.isActive, true))
  const countries = await listInternationalCountryZones()
  return cards.map((card) => ({
    ...card,
    deliveryPartners: [...new Set(rates.filter((rate) => rate.rateCardId === card.id).map((rate) => rate.deliveryPartner))],
    destinationZones: [
      ...new Set(
        rates
          .filter((rate) => rate.rateCardId === card.id && rate.destinationZone)
          .map((rate) => rate.destinationZone as string),
      ),
    ].sort(),
    destinationCountries: countries,
  }))
}

const resolveDestination = async (destinationCountry: unknown) => {
  const raw = String(destinationCountry || '').trim()
  if (!raw) throw new Error('Destination country is required')

  const key = normalizeCountryKey(raw)
  const [match] = await db
    .select()
    .from(internationalCountryZones)
    .where(
      and(
        eq(internationalCountryZones.isActive, true),
        or(
          eq(internationalCountryZones.countryKey, key),
          ilike(internationalCountryZones.countryName, raw),
        ),
      ),
    )
    .limit(1)

  if (match) return match

  if (/^[A-Z]$/i.test(raw)) {
    return {
      countryName: `Zone ${raw.toUpperCase()}`,
      countryKey: raw.toUpperCase(),
      zoneCode: raw.toUpperCase(),
    }
  }

  throw new Error('Destination country is not configured in the international zone sheet')
}

const buildDestinationCondition = (destinationZone: string, country: string) => {
  if (destinationZone) {
    return eq(internationalRates.destinationZone, destinationZone)
  }

  return or(
    eq(internationalRates.destinationCountry, country),
    eq(internationalRates.destinationCountry, '*'),
  )
}

export const calculateInternationalRate = async (input: any) => {
  const weight = Number(input.weight)
  const destination = await resolveDestination(input.destinationCountry)
  const country = destination.countryName
  const destinationZone = destination.zoneCode.toUpperCase()
  if (!input.rateCardId) throw new Error('Rate card is required')
  if (!Number.isFinite(weight) || weight <= 0) throw new Error('Weight must be greater than zero')

  const [card] = await db.select().from(internationalRateCards).where(and(eq(internationalRateCards.id, input.rateCardId), eq(internationalRateCards.isActive, true))).limit(1)
  if (!card) throw new Error('International rate card not found')
  if (input.originZone && String(input.originZone).toUpperCase() !== card.originZone.toUpperCase()) throw new Error('Origin zone does not match the selected rate card')

  const conditions: any[] = [
    eq(internationalRates.rateCardId, card.id),
    eq(internationalRates.isActive, true),
    lte(internationalRates.minWeight, weight.toString()),
    gte(internationalRates.maxWeight, weight.toString()),
    buildDestinationCondition(destinationZone, country),
  ]
  if (input.deliveryPartner) conditions.push(eq(internationalRates.deliveryPartner, input.deliveryPartner))
  const matches = await db.select().from(internationalRates).where(and(...conditions)).orderBy(asc(internationalRates.maxWeight), asc(internationalRates.ratePerKg))
  if (!matches.length) throw new Error('No international rate is configured for this shipment')

  return matches.map((rate) => {
    const baseRate = Number(rate.baseRate)
    const weightCharge = Number(rate.ratePerKg) * weight
    return {
      id: rate.id,
      rateCard: card.name,
      deliveryPartner: rate.deliveryPartner,
      originZone: card.originZone,
      destinationCountry: country,
      destinationZone,
      destinationCity: input.destinationCity || null,
      destinationState: input.destinationState || null,
      weight,
      slabWeight: Number(rate.maxWeight),
      baseRate,
      ratePerKg: Number(rate.ratePerKg),
      weightCharge,
      total: Number((baseRate + weightCharge).toFixed(2)),
      currency: rate.currency,
      estimatedDays: rate.estimatedDays,
    }
  })
}
