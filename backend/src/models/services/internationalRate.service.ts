import { and, asc, eq, gte, lte, or } from 'drizzle-orm'
import { db } from '../client'
import { internationalRateCards, internationalRates } from '../schema/rateCardMasters'

export const listInternationalRateCards = async () => {
  const cards = await db.select().from(internationalRateCards).where(eq(internationalRateCards.isActive, true)).orderBy(asc(internationalRateCards.name))
  const rates = await db.select({ rateCardId: internationalRates.rateCardId, deliveryPartner: internationalRates.deliveryPartner }).from(internationalRates).where(eq(internationalRates.isActive, true))
  return cards.map((card) => ({
    ...card,
    deliveryPartners: [...new Set(rates.filter((rate) => rate.rateCardId === card.id).map((rate) => rate.deliveryPartner))],
  }))
}

export const calculateInternationalRate = async (input: any) => {
  const weight = Number(input.weight)
  const country = String(input.destinationCountry || '').trim().toUpperCase()
  if (!input.rateCardId) throw new Error('Rate card is required')
  if (!Number.isFinite(weight) || weight <= 0) throw new Error('Weight must be greater than zero')
  if (!/^[A-Z]{2}$/.test(country)) throw new Error('Destination country is required')

  const [card] = await db.select().from(internationalRateCards).where(and(eq(internationalRateCards.id, input.rateCardId), eq(internationalRateCards.isActive, true))).limit(1)
  if (!card) throw new Error('International rate card not found')
  if (input.originZone && String(input.originZone).toUpperCase() !== card.originZone.toUpperCase()) throw new Error('Origin zone does not match the selected rate card')

  const conditions: any[] = [
    eq(internationalRates.rateCardId, card.id),
    eq(internationalRates.isActive, true),
    lte(internationalRates.minWeight, weight.toString()),
    gte(internationalRates.maxWeight, weight.toString()),
    or(eq(internationalRates.destinationCountry, country), eq(internationalRates.destinationCountry, '*')),
  ]
  if (input.deliveryPartner) conditions.push(eq(internationalRates.deliveryPartner, input.deliveryPartner))
  const matches = await db.select().from(internationalRates).where(and(...conditions)).orderBy(asc(internationalRates.ratePerKg))
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
      destinationCity: input.destinationCity || null,
      destinationState: input.destinationState || null,
      weight,
      baseRate,
      ratePerKg: Number(rate.ratePerKg),
      weightCharge,
      total: Number((baseRate + weightCharge).toFixed(2)),
      currency: rate.currency,
      estimatedDays: rate.estimatedDays,
    }
  })
}
