import { createHash } from 'crypto'

type TokenSecretConfig = {
  accessTokenSecret?: string
  refreshTokenSecret?: string
  jwtSecret?: string
  sessionSecret?: string
}

const normalizeSecret = (value?: string) => {
  const normalized = String(value || '').trim()
  return normalized || undefined
}

const deriveSecret = (purpose: string, seed: string) =>
  createHash('sha256').update(`routeship:${purpose}:${seed}`).digest('hex')

export const resolveTokenSecrets = (config: TokenSecretConfig) => {
  const legacySecret = normalizeSecret(config.jwtSecret) || normalizeSecret(config.sessionSecret)
  const accessSecret =
    normalizeSecret(config.accessTokenSecret) ||
    (legacySecret ? deriveSecret('access', legacySecret) : undefined)
  const refreshSecret =
    normalizeSecret(config.refreshTokenSecret) ||
    (legacySecret ? deriveSecret('refresh', legacySecret) : undefined)

  if (!accessSecret || !refreshSecret) {
    throw new Error(
      'ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are required (or configure JWT_SECRET as a legacy seed)',
    )
  }

  return { accessSecret, refreshSecret }
}
