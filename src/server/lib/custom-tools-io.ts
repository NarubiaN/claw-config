import fs from 'fs'
import path from 'path'
import os from 'os'

const CUSTOM_TOOLS_PATH = path.join(os.homedir(), '.openclaw', 'claw-config-toolpolicy.json')

export interface CustomToolsFile {
  customGroups: Record<string, string[]>
  customProfiles: Record<string, { allow: string[] }>
}

export function readCustomTools(): CustomToolsFile {
  if (!fs.existsSync(CUSTOM_TOOLS_PATH)) {
    return { customGroups: {}, customProfiles: {} }
  }
  try {
    const raw = fs.readFileSync(CUSTOM_TOOLS_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<CustomToolsFile>
    return {
      customGroups: parsed.customGroups ?? {},
      customProfiles: parsed.customProfiles ?? {},
    }
  } catch {
    return { customGroups: {}, customProfiles: {} }
  }
}

function atomicWrite(data: CustomToolsFile): void {
  const dir = path.dirname(CUSTOM_TOOLS_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const tmpPath = CUSTOM_TOOLS_PATH + '.tmp.' + Date.now()
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmpPath, CUSTOM_TOOLS_PATH)
}

export function saveCustomGroup(name: string, tools: string[]): void {
  const current = readCustomTools()
  current.customGroups[name] = tools
  atomicWrite(current)
}

export function saveCustomProfile(name: string, allow: string[]): void {
  const current = readCustomTools()
  current.customProfiles[name] = { allow }
  atomicWrite(current)
}

export function deleteCustomGroup(name: string): void {
  const current = readCustomTools()
  delete current.customGroups[name]
  atomicWrite(current)
}

export function deleteCustomProfile(name: string): void {
  const current = readCustomTools()
  delete current.customProfiles[name]
  atomicWrite(current)
}
