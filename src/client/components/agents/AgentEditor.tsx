import React from 'react'
import type { AgentConfig } from '../../types/config'
import { useConfigStore } from '../../store/config-store'
import { useDiscoveryStore } from '../../store/discovery-store'
import { Card } from '../common/Card'
import { ToolPolicyEditor } from '../tools/ToolPolicyEditor'

interface AgentEditorProps {
  agent: AgentConfig
  onChange: (updated: AgentConfig) => void
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-white/25">{hint}</p>}
    </div>
  )
}

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-150'

// Select elements need an opaque background so options are readable (bg-white/5 is transparent)
const selectCls =
  'w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-150'

export function AgentEditor({ agent, onChange }: AgentEditorProps) {
  const config = useConfigStore((s) => s.config)
  const { tools } = useDiscoveryStore()

  // Collect available models from config
  const allModels: string[] = []
  if (config?.models?.providers) {
    for (const provider of Object.values(config.models.providers)) {
      for (const model of provider.models) {
        allModels.push(`${model.name} (${model.id})`)
      }
    }
  }
  // Also include model alias keys from agents.defaults
  const modelAliases = config?.agents?.defaults?.models ?? {}

  const update = (partial: Partial<AgentConfig>) =>
    onChange({ ...agent, ...partial })

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Identity */}
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-semibold text-white/80 border-b border-white/5 pb-3">
          Identity
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <Field label="ID" hint="Unique agent identifier">
            <input
              className={inputCls}
              value={agent.id}
              onChange={(e) => update({ id: e.target.value })}
            />
          </Field>
          <Field label="Name" hint="Display name">
            <input
              className={inputCls}
              value={agent.name ?? ''}
              placeholder="Agent name"
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Workspace" hint="Path to workspace directory">
          <input
            className={inputCls}
            value={agent.workspace ?? ''}
            placeholder="~/.openclaw/workspace"
            onChange={(e) => update({ workspace: e.target.value || undefined })}
          />
        </Field>

        <Field label="Agent Dir" hint="Override agent directory (optional)">
          <input
            className={inputCls}
            value={agent.agentDir ?? ''}
            placeholder="Inherits from workspace"
            onChange={(e) => update({ agentDir: e.target.value || undefined })}
          />
        </Field>

        <Field label="Model" hint="Model alias or full model ID">
          <input
            className={inputCls}
            value={agent.model ?? ''}
            placeholder={`e.g. ${Object.keys(modelAliases)[0] ?? 'haiku'}`}
            list="model-list"
            onChange={(e) => update({ model: e.target.value || undefined })}
          />
          <datalist id="model-list">
            {Object.entries(modelAliases).map(([modelKey, entry]) => {
              const label = entry?.alias ? `${modelKey} (${entry.alias})` : modelKey
              return (
                <option key={modelKey} value={modelKey}>
                  {label}
                </option>
              )
            })}
          </datalist>
        </Field>
      </Card>

      {/* Tool Policy */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white/80 border-b border-white/5 pb-3">
          Tool Policy
        </h3>
        <ToolPolicyEditor
          policy={agent.tools ?? {}}
          onChange={(p) => update({ tools: p })}
          tools={tools}
        />
      </Card>

      {/* Compaction */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white/80 border-b border-white/5 pb-3">
          Compaction
        </h3>

        <Field label="Mode">
          <select
            className={selectCls}
            value={agent.compaction?.mode ?? ''}
            onChange={(e) =>
              update({
                compaction: {
                  ...agent.compaction,
                  mode: (e.target.value as 'safeguard' | 'cache-ttl' | 'off') || undefined,
                },
              })
            }
          >
            <option value="">Inherit from defaults</option>
            <option value="safeguard">Safeguard</option>
            <option value="cache-ttl">Cache TTL</option>
            <option value="off">Off</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Reserve Tokens Floor" hint="Minimum reserved tokens">
            <input
              className={inputCls}
              type="number"
              value={agent.compaction?.reserveTokensFloor ?? ''}
              placeholder="Inherit"
              onChange={(e) =>
                update({
                  compaction: {
                    ...agent.compaction,
                    reserveTokensFloor: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </Field>

          <Field label="Max History Share" hint="0–1 fraction of context for history">
            <input
              className={inputCls}
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={agent.compaction?.maxHistoryShare ?? ''}
              placeholder="Inherit"
              onChange={(e) =>
                update({
                  compaction: {
                    ...agent.compaction,
                    maxHistoryShare: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </Field>
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-6 space-y-4 opacity-60">
        <h3 className="text-sm font-semibold text-white/80 border-b border-white/5 pb-3">
          Skills
          <span className="ml-2 text-xs text-amber-400/70 font-normal">
            ⚠ OpenClaw has no per-agent skill control — this field is not saved
          </span>
        </h3>
        <p className="text-xs text-white/40 leading-relaxed">
          Skills load globally from <code className="text-white/60 bg-white/5 px-1 rounded">~/.openclaw/workspace/skills/</code> and <code className="text-white/60 bg-white/5 px-1 rounded">~/.claude/skills/</code>.
          Per-agent filtering is not yet supported by OpenClaw.
          TODO: Investigate how OpenClaw determines which skills load per agent — may require reading agent workspace boot files or OpenClaw source.
        </p>
      </Card>
    </div>
  )
}
