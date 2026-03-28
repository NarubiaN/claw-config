import fs from 'fs'
import path from 'path'
import os from 'os'

// Windows: %APPDATA%/npm/node_modules/openclaw
// Unix: prefix from npm
function getOpenClawBase(): string {
  if (process.platform === 'win32') {
    const appdata = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming')
    return path.join(appdata, 'npm', 'node_modules', 'openclaw')
  }
  // Try common unix global paths
  const candidates = [
    '/usr/local/lib/node_modules/openclaw',
    '/usr/lib/node_modules/openclaw',
    path.join(os.homedir(), '.npm-global', 'lib', 'node_modules', 'openclaw'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return '/usr/local/lib/node_modules/openclaw'
}

export interface ToolScanResult {
  groups: Record<string, string[]>
  profiles: Record<string, { allow: string[] }>
  allTools: string[]
  displayNames: Record<string, { emoji?: string; title?: string }>
  installed: boolean
  basePath: string
}

export function scanTools(): ToolScanResult {
  const base = getOpenClawBase()
  const agentsDir = path.join(base, 'dist', 'agents')
  const toolPolicyPath = path.join(agentsDir, 'tool-policy.js')
  const toolDisplayPath = path.join(agentsDir, 'tool-display.json')
  const toolsDir = path.join(agentsDir, 'tools')

  if (!fs.existsSync(toolPolicyPath)) {
    return {
      groups: {},
      profiles: {},
      allTools: [],
      displayNames: {},
      installed: false,
      basePath: base,
    }
  }

  // Parse tool-policy.js with regex (it's a JS module, not JSON)
  const policySource = fs.readFileSync(toolPolicyPath, 'utf-8')
  const groups = extractToolGroups(policySource)
  const profiles = extractToolProfiles(policySource)

  // Read display names
  let displayNames: Record<string, { emoji?: string; title?: string }> = {}
  if (fs.existsSync(toolDisplayPath)) {
    try {
      const displayData = JSON.parse(fs.readFileSync(toolDisplayPath, 'utf-8'))
      displayNames = displayData.tools ?? {}
    } catch {
      // ignore parse errors
    }
  }

  // List all tool files
  const allTools: string[] = []
  if (fs.existsSync(toolsDir)) {
    const files = fs.readdirSync(toolsDir)
    for (const f of files) {
      if (f.endsWith('.js') && !f.includes('.schema') && !f.includes('.helpers')) {
        // Derive tool name from filename
        const name = f.replace(/-tool\.js$/, '').replace(/\.js$/, '')
        if (!allTools.includes(name)) allTools.push(name)
      }
    }
  }

  // Also collect all tool names from groups
  for (const tools of Object.values(groups)) {
    for (const t of tools) {
      if (!allTools.includes(t)) allTools.push(t)
    }
  }

  return {
    groups,
    profiles,
    allTools: [...new Set(allTools)].sort(),
    displayNames,
    installed: true,
    basePath: base,
  }
}

function extractToolGroups(source: string): Record<string, string[]> {
  const groups: Record<string, string[]> = {}

  // Match: "group:name": ["tool1", "tool2", ...]
  const blockRegex = /"(group:[^"]+)":\s*\[([^\]]*)\]/g
  let match: RegExpExecArray | null

  while ((match = blockRegex.exec(source)) !== null) {
    const groupName = match[1]
    const toolsStr = match[2]
    const tools = toolsStr.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) ?? []
    groups[groupName] = tools
  }

  return groups
}

function extractToolProfiles(source: string): Record<string, { allow: string[] }> {
  const profiles: Record<string, { allow: string[] }> = {}

  // Match profile blocks: minimal: { allow: [...] }, etc.
  const profileNames = ['minimal', 'coding', 'messaging', 'full']

  for (const name of profileNames) {
    // Look for: name: { allow: [...] } or name: {}
    const allowRegex = new RegExp(`${name}:\\s*\\{[^}]*allow:\\s*\\[([^\\]]*)\\]`, 's')
    const emptyRegex = new RegExp(`${name}:\\s*\\{\\s*\\}`)

    const allowMatch = allowRegex.exec(source)
    if (allowMatch) {
      const items = allowMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) ?? []
      profiles[name] = { allow: items }
    } else if (emptyRegex.test(source)) {
      profiles[name] = { allow: [] } // full = empty means allow all
    }
  }

  return profiles
}
