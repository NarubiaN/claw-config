import React, { useEffect, useState, useMemo } from 'react'
import { useConfigStore } from '../../store/config-store'
import { useDiscoveryStore } from '../../store/discovery-store'
import { PageHeader } from '../common/PageHeader'
import { Card } from '../common/Card'
import { LoadingSpinner } from '../common/LoadingSpinner'

// Token estimation heuristics — calibrated from Context-Reduction-Playbook real measurements
const CHARS_PER_TOKEN = 4
const SYSTEM_PROMPT_BASE_CHARS = 11324  // non-project framework context (measured)
const PROJECT_CONTEXT_CHARS = 878       // CLAUDE.md / project files (measured avg)
const TOOL_LIST_CHARS = 88              // ~88 chars per tool in the tool name list
const PER_TOOL_SCHEMA_CHARS = 610       // avg chars per tool JSON schema (14,039 / 23 tools)
const PER_SKILL_CHARS = 390             // avg chars per skill prompt (3,121 / 8 skills)
const PER_BOOT_FILE_CHARS = 1286        // avg chars per boot file (~9,000 / 7 files)

function charsToTokens(chars: number): number {
  return Math.ceil(chars / CHARS_PER_TOKEN)
}

interface ContextBreakdown {
  systemPrompt: number
  toolSchemas: number
  skills: number
  bootFiles: number
  total: number
  remaining: number
  contextWindow: number
}

export function ContextPage() {
  const { config, loading, load } = useConfigStore()
  const { tools, skills } = useDiscoveryStore()
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [customContextWindow, setCustomContextWindow] = useState<number>(0)
  const [bootFileCount, setBootFileCount] = useState<number>(2)
  const [skillCount, setSkillCount] = useState<number>(0)

  useEffect(() => {
    if (!config) load()
  }, [])

  const agents = config?.agents?.list ?? []
  const selectedAgent = agents.find((a) => a.id === selectedAgentId)

  // Get context window from selected agent's model
  const contextWindow = useMemo(() => {
    if (customContextWindow > 0) return customContextWindow

    // Resolve model string: agent.model or defaults.model.primary
    const modelStr = selectedAgent?.model ?? config?.agents?.defaults?.model?.primary
    if (modelStr && config?.models?.providers) {
      // Model strings are "provider/modelId" format (e.g. "lmstudio/R1-local")
      const slashIdx = modelStr.indexOf('/')
      if (slashIdx > 0) {
        const providerKey = modelStr.substring(0, slashIdx)
        const modelId = modelStr.substring(slashIdx + 1)
        const provider = config.models.providers[providerKey]
        if (provider) {
          // Match by model name (display name) or model id
          const model = provider.models.find(
            (m) => m.name === modelId || m.id === modelId
          )
          if (model?.contextWindow) return model.contextWindow
        }
      }
      // Fallback: brute-force search all providers
      for (const provider of Object.values(config.models.providers)) {
        const model = provider.models.find(
          (m) => m.id === modelStr || m.name === modelStr
        )
        if (model?.contextWindow) return model.contextWindow
      }
    }

    return 100000 // default fallback
  }, [selectedAgent, config, customContextWindow])

  // Count active tools for selected agent
  const activeToolCount = useMemo(() => {
    if (!tools) return 0
    const policy = selectedAgent?.tools
    if (!policy) return tools.allTools.length

    const { profile, allow, deny } = policy
    let toolSet = new Set<string>()

    if (!profile || profile === 'full') {
      tools.allTools.forEach((t) => toolSet.add(t))
    } else if (tools.profiles[profile]) {
      const profileAllow = tools.profiles[profile].allow
      for (const item of profileAllow) {
        if (item.startsWith('group:') && tools.groups[item]) {
          tools.groups[item].forEach((t) => toolSet.add(t))
        } else {
          toolSet.add(item)
        }
      }
    }

    // Apply explicit allow
    if (allow) {
      for (const item of allow) {
        if (item.startsWith('group:') && tools.groups[item]) {
          tools.groups[item].forEach((t) => toolSet.add(t))
        } else {
          toolSet.add(item)
        }
      }
    }

    // Apply explicit deny
    if (deny) {
      for (const item of deny) {
        if (item.startsWith('group:') && tools.groups[item]) {
          tools.groups[item].forEach((t) => toolSet.delete(t))
        } else {
          toolSet.delete(item)
        }
      }
    }

    return toolSet.size
  }, [selectedAgent, tools])

  const breakdown: ContextBreakdown = useMemo(() => {
    const systemPrompt = charsToTokens(SYSTEM_PROMPT_BASE_CHARS + PROJECT_CONTEXT_CHARS)
    const toolSchemas = charsToTokens(
      activeToolCount * PER_TOOL_SCHEMA_CHARS + activeToolCount * TOOL_LIST_CHARS
    )
    const skillTokens = charsToTokens(skillCount * PER_SKILL_CHARS)
    const bootFiles = charsToTokens(bootFileCount * PER_BOOT_FILE_CHARS)
    const total = systemPrompt + toolSchemas + skillTokens + bootFiles
    const remaining = Math.max(0, contextWindow - total)

    return {
      systemPrompt,
      toolSchemas,
      skills: skillTokens,
      bootFiles,
      total,
      remaining,
      contextWindow,
    }
  }, [activeToolCount, skillCount, bootFileCount, contextWindow])

  const fillPercent = Math.min(100, (breakdown.total / breakdown.contextWindow) * 100)

  if (loading) return <LoadingSpinner message="Loading..." />

  const barItems = [
    { label: 'System Prompt', tokens: breakdown.systemPrompt, color: 'bg-blue-500' },
    { label: 'Tool Schemas', tokens: breakdown.toolSchemas, color: 'bg-violet-500' },
    { label: 'Skills', tokens: breakdown.skills, color: 'bg-emerald-500' },
    { label: 'Boot Files', tokens: breakdown.bootFiles, color: 'bg-amber-500' },
  ]

  return (
    <div>
      <PageHeader
        title="Context Budget"
        subtitle="computed"
      />

      <div className="px-8 py-6 space-y-6 max-w-3xl">
        {/* Config inputs */}
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white/80 border-b border-white/5 pb-3">
            Configuration
          </h3>

          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
              Agent
            </label>
            <select
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="">-- None (use custom) --</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name ?? a.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
                Context Window
              </label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                value={customContextWindow || contextWindow}
                onChange={(e) => setCustomContextWindow(Number(e.target.value))}
              />
              <p className="text-xs text-white/25 mt-1">tokens</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
                Boot Files
              </label>
              <input
                type="number"
                min="0"
                max="20"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                value={bootFileCount}
                onChange={(e) => setBootFileCount(Number(e.target.value))}
              />
              <p className="text-xs text-white/25 mt-1">~{PER_BOOT_FILE_CHARS} chars each</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
                Active Skills
              </label>
              <input
                type="number"
                min="0"
                max="20"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                value={skillCount}
                onChange={(e) => setSkillCount(Number(e.target.value))}
              />
              <p className="text-xs text-white/25 mt-1">~{PER_SKILL_CHARS} chars each</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-white/40">
              Active tools: <span className="text-white/70 font-medium">{activeToolCount}</span>
              {selectedAgent && <span className="text-white/30"> (from agent tool policy)</span>}
            </p>
          </div>
        </Card>

        {/* Context bar visualization */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Context Usage</h3>
            <div className="text-right">
              <p className="text-lg font-bold text-white/90">
                {breakdown.total.toLocaleString()}
                <span className="text-sm font-normal text-white/40 ml-1">tokens</span>
              </p>
              <p className="text-xs text-white/30">
                of {breakdown.contextWindow.toLocaleString()} context window
              </p>
            </div>
          </div>

          {/* Stacked bar */}
          <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
            {barItems.map((item) => {
              const pct = (item.tokens / breakdown.contextWindow) * 100
              return (
                <div
                  key={item.label}
                  className={`${item.color} h-full transition-all duration-300`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              )
            })}
          </div>

          <div className="flex items-center gap-1 text-xs text-white/50">
            <span
              className={fillPercent > 80 ? 'text-red-400' : fillPercent > 60 ? 'text-yellow-400' : 'text-emerald-400'}
            >
              {fillPercent.toFixed(1)}% full
            </span>
            <span className="text-white/20 mx-1">·</span>
            <span className="text-white/50">
              ~{breakdown.remaining.toLocaleString()} tokens remaining for conversation
            </span>
          </div>

          {/* Breakdown legend */}
          <div className="space-y-2.5 border-t border-white/5 pt-4">
            {barItems.map((item) => {
              const pct = ((item.tokens / breakdown.contextWindow) * 100).toFixed(1)
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                    <span className="text-sm text-white/60">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-white/30">{pct}%</span>
                    <span className="text-sm text-white/80 font-medium w-24">
                      {item.tokens.toLocaleString()} tok
                    </span>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
              <span className="text-sm text-white/60">Remaining (conversation)</span>
              <span className="text-sm text-emerald-400 font-medium w-24 text-right">
                {breakdown.remaining.toLocaleString()} tok
              </span>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-5 bg-blue-400/5 border-blue-400/10">
          <h4 className="text-xs font-semibold text-blue-400/80 uppercase tracking-wider mb-2">
            Reduction Tips
          </h4>
          <ul className="text-xs text-white/50 space-y-1.5">
            <li>Use <span className="text-blue-300">minimal</span> or <span className="text-blue-300">coding</span> profiles instead of full — saves ~{charsToTokens((tools?.allTools.length ?? 23) * PER_TOOL_SCHEMA_CHARS).toLocaleString()} tokens</li>
            <li>Reduce boot files — each file costs ~{charsToTokens(PER_BOOT_FILE_CHARS).toLocaleString()} tokens</li>
            <li>Limit active skills — each skill costs ~{charsToTokens(PER_SKILL_CHARS).toLocaleString()} tokens</li>
            <li>Use a model with a larger context window for skill-heavy agents</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
