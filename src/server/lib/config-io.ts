import fs from 'fs'
import path from 'path'
import os from 'os'

const CONFIG_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json')

export function getConfigPath(): string {
  return CONFIG_PATH
}

export function readConfig(): unknown {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found: ${CONFIG_PATH}`)
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
  return JSON.parse(raw)
}

/**
 * Sanitize agent list before writing.
 * - Remove fields that OpenClaw doesn't recognise (skills)
 * - Strip empty-string values that should be absent
 */
function sanitizeConfig(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data
  const cfg = data as Record<string, unknown>
  const agents = cfg.agents as Record<string, unknown> | undefined
  if (!agents) return cfg

  const list = agents.list as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(list)) return cfg

  const sanitizedList = list.map((agent) => {
    const clean: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(agent)) {
      if (key === 'skills') continue        // Not a valid OpenClaw agent field
      if (val === '' || val === undefined) continue
      clean[key] = val
    }
    return clean
  })

  return {
    ...cfg,
    agents: { ...agents, list: sanitizedList },
  }
}

export function writeConfig(data: unknown): void {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Backup first
  backupConfig()

  // Sanitize before write
  const safe = sanitizeConfig(data)

  // Atomic write: write to temp file, then rename
  const tmpPath = CONFIG_PATH + '.tmp.' + Date.now()
  fs.writeFileSync(tmpPath, JSON.stringify(safe, null, 2), 'utf-8')
  fs.renameSync(tmpPath, CONFIG_PATH)
}

export function backupConfig(): string | null {
  if (!fs.existsSync(CONFIG_PATH)) {
    return null
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = CONFIG_PATH + '.bak.' + timestamp
  fs.copyFileSync(CONFIG_PATH, backupPath)
  return backupPath
}
