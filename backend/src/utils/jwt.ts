import { createHash, randomUUID } from 'crypto'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

import path from 'path'

// Load correct .env based on NODE_ENV
const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const legacySecret = process.env.JWT_SECRET || process.env.SESSION_SECRET
const secretSeed = legacySecret || process.env.DATABASE_URL

if (!secretSeed) {
  throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are required')
}

const deriveSecret = (purpose: string) =>
  createHash('sha256').update(`routeship:${purpose}:${secretSeed}`).digest('hex')

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || deriveSecret('access')
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || deriveSecret('refresh')

export interface RefreshPayload {
  sub: string // userId
  role: string
  jti: string
  iat: number
  exp: number
}
export const signAccessToken = (id: string, role: string) =>
  jwt.sign({ sub: id, role }, ACCESS_SECRET, { expiresIn: '24h' })

export const signRefreshToken = (id: string, role: string) => {
  const jti = randomUUID()
  return {
    token: jwt.sign({ sub: id, role, jti }, REFRESH_SECRET, {
      expiresIn: '7d',
    }),
    jti,
  }
}

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, ACCESS_SECRET) as { sub: string; role: string }

export const verifyRefreshToken = (token: string): RefreshPayload =>
  jwt.verify(token, REFRESH_SECRET) as RefreshPayload
