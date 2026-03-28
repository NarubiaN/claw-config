import { Router, Request, Response } from 'express'
import { scanTools } from '../lib/tool-scanner.js'
import { scanSkills } from '../lib/skill-scanner.js'
import {
  readCustomTools,
  saveCustomGroup,
  saveCustomProfile,
  deleteCustomGroup,
  deleteCustomProfile,
} from '../lib/custom-tools-io.js'

const router = Router()

// GET /api/discovery/tools
router.get('/tools', (_req: Request, res: Response) => {
  try {
    const data = scanTools()
    res.json({ ok: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

// GET /api/discovery/skills
router.get('/skills', (_req: Request, res: Response) => {
  try {
    const data = scanSkills()
    res.json({ ok: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

// GET /api/discovery/custom-tools
router.get('/custom-tools', (_req: Request, res: Response) => {
  try {
    const data = readCustomTools()
    res.json({ ok: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

// POST /api/discovery/custom-tools/groups
router.post('/custom-tools/groups', (req: Request, res: Response) => {
  try {
    const { name, tools } = req.body as { name?: string; tools?: string[] }
    if (!name || !Array.isArray(tools)) {
      res.status(400).json({ ok: false, error: 'name and tools[] required' })
      return
    }
    saveCustomGroup(name, tools)
    res.json({ ok: true, data: { name, tools } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

// DELETE /api/discovery/custom-tools/groups/:name
router.delete('/custom-tools/groups/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params
    deleteCustomGroup(name)
    res.json({ ok: true, data: { deleted: name } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

// POST /api/discovery/custom-tools/profiles
router.post('/custom-tools/profiles', (req: Request, res: Response) => {
  try {
    const { name, allow } = req.body as { name?: string; allow?: string[] }
    if (!name || !Array.isArray(allow)) {
      res.status(400).json({ ok: false, error: 'name and allow[] required' })
      return
    }
    saveCustomProfile(name, allow)
    res.json({ ok: true, data: { name, allow } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

// DELETE /api/discovery/custom-tools/profiles/:name
router.delete('/custom-tools/profiles/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params
    deleteCustomProfile(name)
    res.json({ ok: true, data: { deleted: name } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

export default router
