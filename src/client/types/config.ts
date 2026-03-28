// OpenClaw config schema types

export interface ModelCost {
  input: number
  output: number
  cacheRead?: number
  cacheWrite?: number
}

export interface ModelConfig {
  id: string
  name: string
  reasoning?: boolean
  input?: string[]
  cost?: ModelCost
  contextWindow?: number
  maxTokens?: number
  compat?: Record<string, unknown>
}

export interface ProviderConfig {
  baseUrl: string
  apiKey: string
  api: string
  models: ModelConfig[]
}

export interface ToolPolicy {
  profile?: string
  allow?: string[]
  deny?: string[]
}

export interface CompactionConfig {
  mode?: 'safeguard' | 'cache-ttl' | 'off'
  reserveTokensFloor?: number
  maxHistoryShare?: number
}

export interface AgentConfig {
  id: string
  name?: string
  workspace?: string
  agentDir?: string
  model?: string
  tools?: ToolPolicy       // OpenClaw's field name — used directly, no remapping
  compaction?: CompactionConfig
  // Note: 'skills' is NOT a valid OpenClaw agent field — do not persist it
}

export interface AgentModelEntry {
  alias?: string
}

export interface AgentsDefaults {
  model?: { primary?: string }
  models?: Record<string, AgentModelEntry>
  tools?: ToolPolicy
  compaction?: CompactionConfig
}

export interface AgentsConfig {
  defaults?: AgentsDefaults
  list?: AgentConfig[]
}

export interface OpenClawMeta {
  lastTouchedVersion?: string
  lastTouchedAt?: string
}

export interface OpenClawConfig {
  meta?: OpenClawMeta
  wizard?: Record<string, unknown>
  auth?: Record<string, unknown>
  models?: {
    providers: Record<string, ProviderConfig>
  }
  agents?: AgentsConfig
  [key: string]: unknown
}

// Discovery types

export interface ToolDisplayInfo {
  emoji?: string
  title?: string
}

export interface DiscoveredTools {
  groups: Record<string, string[]>
  profiles: Record<string, { allow: string[] }>
  allTools: string[]
  displayNames: Record<string, ToolDisplayInfo>
  installed?: boolean
  basePath?: string
  customGroups?: Record<string, string[]>
  customProfiles?: Record<string, { allow: string[] }>
}

export interface DiscoveredSkill {
  name: string
  description: string
  type: 'claude' | 'openclaw'
  path: string
  dirName: string
}

export interface DiscoveredSkills {
  claude: DiscoveredSkill[]
  openclaw: DiscoveredSkill[]
}

// Boot files types

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

// Custom tools file type
export interface CustomToolsFile {
  customGroups: Record<string, string[]>
  customProfiles: Record<string, { allow: string[] }>
}

// API response wrapper
export interface ApiOk<T> {
  ok: true
  data: T
}

export interface ApiError {
  ok: false
  error: string
}

export type ApiResponse<T> = ApiOk<T> | ApiError
