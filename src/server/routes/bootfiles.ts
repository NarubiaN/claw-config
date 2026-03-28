import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { readConfig } from '../lib/config-io.js'

const BOOT_FILE_NAMES = [
  'AGENTS.md',
  'SOUL.md',
  'TOOLS.md',
  'IDENTITY.md',
  'USER.md',
  'HEARTBEAT.md',
  'BOOTSTRAP.md',
  'MEMORY.md',
]

export interface BootFileInfo {
  name: string
  exists: boolean
  sizeChars: number
  estimatedTokens: number
}

export interface LeanBootStatus {
  exists: boolean
  strippedFiles: string[]
}

export interface BootFilesResult {
  files: BootFileInfo[]
  leanBoot: LeanBootStatus
  workspacePath: string | null
}

function getAgentWorkspace(agentId: string): string | null {
  try {
    const config = readConfig() as {
      agents?: { list?: Array<{ id: string; workspace?: string }> }
    }
    const agents = config?.agents?.list ?? []
    const agent = agents.find((a) => a.id === agentId)
    return agent?.workspace ?? null
  } catch {
    return null
  }
}

function scanBootFiles(workspacePath: string): BootFileInfo[] {
  return BOOT_FILE_NAMES.map((name) => {
    const filePath = path.join(workspacePath, name)
    if (!fs.existsSync(filePath)) {
      return { name, exists: false, sizeChars: 0, estimatedTokens: 0 }
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const sizeChars = content.length
      const estimatedTokens = Math.ceil(sizeChars / 4)
      return { name, exists: true, sizeChars, estimatedTokens }
    } catch {
      return { name, exists: false, sizeChars: 0, estimatedTokens: 0 }
    }
  })
}

function getLeanBootStatus(workspacePath: string): LeanBootStatus {
  const hookDir = path.join(workspacePath, 'hooks', 'lean-boot')
  const handlerPath = path.join(hookDir, 'handler.js')

  if (!fs.existsSync(handlerPath)) {
    return { exists: false, strippedFiles: [] }
  }

  try {
    const content = fs.readFileSync(handlerPath, 'utf-8')
    // Parse STRIP_FILES set from handler.js
    const setMatch = content.match(/new Set\(\[([\s\S]*?)\]\)/)
    if (!setMatch) return { exists: true, strippedFiles: [] }

    const setBody = setMatch[1]
    const fileMatches = [...setBody.matchAll(/['"]([^'"]+)['"]/g)]
    const strippedFiles = fileMatches.map((m) => m[1])
    return { exists: true, strippedFiles }
  } catch {
    return { exists: true, strippedFiles: [] }
  }
}

// ─── Discovery sub-router: mounted at /api/discovery ───────────────────────
// Handles: GET /api/discovery/bootfiles/:agentId
export const bootfilesDiscoveryRouter = Router()

bootfilesDiscoveryRouter.get('/bootfiles/:agentId', (req: Request, res: Response) => {
  const agentId = Array.isArray(req.params.agentId) ? req.params.agentId[0] : req.params.agentId

  const workspacePath = getAgentWorkspace(agentId)

  const emptyFiles: BootFileInfo[] = BOOT_FILE_NAMES.map((name) => ({
    name,
    exists: false,
    sizeChars: 0,
    estimatedTokens: 0,
  }))

  if (!workspacePath) {
    res.json({
      ok: true,
      data: {
        files: emptyFiles,
        leanBoot: { exists: false, strippedFiles: [] },
        workspacePath: null,
      } as BootFilesResult,
    })
    return
  }

  if (!fs.existsSync(workspacePath)) {
    res.json({
      ok: true,
      data: {
        files: emptyFiles,
        leanBoot: { exists: false, strippedFiles: [] },
        workspacePath,
      } as BootFilesResult,
    })
    return
  }

  try {
    const files = scanBootFiles(workspacePath)
    const leanBoot = getLeanBootStatus(workspacePath)
    res.json({ ok: true, data: { files, leanBoot, workspacePath } as BootFilesResult })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})

// ─── Bootfiles mutation router: mounted at /api/bootfiles ──────────────────
// Handles: POST /api/bootfiles/:agentId/lean-boot
export const bootfilesMutationRouter = Router()

bootfilesMutationRouter.post('/:agentId/lean-boot', (req: Request, res: Response) => {
  const agentId = Array.isArray(req.params.agentId) ? req.params.agentId[0] : req.params.agentId
  const { stripFiles } = req.body as { stripFiles: string[] }

  if (!Array.isArray(stripFiles)) {
    res.status(400).json({ ok: false, error: 'stripFiles must be an array' })
    return
  }

  const workspacePath = getAgentWorkspace(agentId)
  if (!workspacePath) {
    res.status(404).json({ ok: false, error: `Agent "${agentId}" not found or has no workspace` })
    return
  }

  try {
    const hookDir = path.join(workspacePath, 'hooks', 'lean-boot')
    fs.mkdirSync(hookDir, { recursive: true })

    // Write HOOK.md
    const hookMd = [
      '---',
      'name: lean-boot',
      'description: "Strips non-coding boot files to minimize context usage for small-context models"',
      'metadata:',
      '  {',
      '    "openclaw":',
      '      {',
      '        "events": ["agent:bootstrap"],',
      '      },',
      '  }',
      '---',
      '',
    ].join('\n')
    fs.writeFileSync(path.join(hookDir, 'HOOK.md'), hookMd, 'utf-8')

    // Write handler.js
    const stripLiteral = stripFiles.map((f) => `    '${f}'`).join(',\n')
    const handlerJs = [
      'const STRIP_FILES = new Set([',
      stripLiteral,
      ']);',
      'export default async (event) => {',
      '    event.context.bootstrapFiles = event.context.bootstrapFiles.filter(',
      "        f => !STRIP_FILES.has(f.name)",
      '    );',
      '};',
      '',
    ].join('\n')
    fs.writeFileSync(path.join(hookDir, 'handler.js'), handlerJs, 'utf-8')

    // Write package.json
    fs.writeFileSync(
      path.join(hookDir, 'package.json'),
      JSON.stringify({ type: 'module' }, null, 2) + '\n',
      'utf-8'
    )

    res.json({ ok: true, data: { hookDir, strippedFiles: stripFiles } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
})
