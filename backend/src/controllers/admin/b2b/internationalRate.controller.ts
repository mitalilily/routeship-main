import { Request, Response } from 'express'
import { calculateInternationalRate, listInternationalRateCards } from '../../../models/services/internationalRate.service'

export const listInternationalRateCardsController = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await listInternationalRateCards() }) }
  catch (error: any) { res.status(500).json({ success: false, error: error?.message || 'Failed to load international rate cards' }) }
}

export const calculateInternationalRateController = async (req: Request, res: Response) => {
  try { res.json({ success: true, data: await calculateInternationalRate(req.body) }) }
  catch (error: any) { res.status(400).json({ success: false, error: error?.message || 'Failed to calculate international rate' }) }
}
