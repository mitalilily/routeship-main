const B2B_ONLY_PROVIDERS = new Set(['movin', 'apptmyz'])
const DELHIVERY_B2B_NAME_HINTS = ['b2b', 'ltl', 'freight', 'cargo', 'basic package']

export const isB2BRateCardCourier = (courier = {}) => {
  const provider = String(courier.serviceProvider || courier.service_provider || '')
    .trim()
    .toLowerCase()
  const name = String(courier.name || courier.courier_name || '')
    .trim()
    .toLowerCase()

  if (B2B_ONLY_PROVIDERS.has(provider)) return true
  if (provider === 'delhivery') {
    return DELHIVERY_B2B_NAME_HINTS.some((hint) => name.includes(hint))
  }

  return false
}

export const filterB2BRateCardCouriers = (couriers = []) =>
  (Array.isArray(couriers) ? couriers : []).filter(isB2BRateCardCourier)
