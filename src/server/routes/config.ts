import { Router, Request, Response } from 'express'
import { readConfig, writeConfig, backupConfig } from '../lib/config-io.js'

const router = Router()

// GET /api/config — return full openclaw.json
router.get('/', (_req: Request, res: Response) => {
  try {
    const data = readConfig()
    res.json({ ok: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

// PUT /api/config — write full config (auto-backups first)
router.put('/', (req: Request, res: Response) => {
  try {
    const body = req.body
    if (!body || typeof body !== 'object') {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' })
      return
    }
    writeConfig(body)
    res.json({ ok: true, data: { saved: true } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

// POST /api/config/backup — manual backup trigger
router.post('/backup', (_req: Request, res: Response) => {
  try {
    const backupPath = backupConfig()
    res.json({ ok: true, data: { backupPath } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

export default router
