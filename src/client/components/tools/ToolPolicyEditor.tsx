import React, { useState } from 'react'
import type { ToolPolicy, DiscoveredTools } from '../../types/config'

interface ToolPolicyEditorProps {
  policy: ToolPolicy
  onChange: (policy: ToolPolicy) => void
  tools: DiscoveredTools | null
}

const PROFILE_LABELS: Record<string, string> = {
  full: 'Full (all tools)',
  coding: 'Coding (fs, runtime, sessions, memory)',
  messaging: 'Messaging (message, sessions)',
  minimal: 'Minimal (session_status only)',
}

export function ToolPolicyEditor({ policy, onChange, tools }: ToolPolicyEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const allow = policy.allow ?? []
  const deny = policy.deny ?? []

  const toggleInList = (
    list: 'allow' | 'deny',
    tool: string,
    checked: boolean
  ) => {
    const current = policy[list] ?? []
    const other = list === 'allow' ? 'deny' : 'allow'
    const otherList = (policy[other] ?? []).filter((t) => t !== tool)
    const newList = checked ? [...current, tool] : current.filter((t) => t !== tool)
    onChange({ ...policy, [list]: newList.length ? newList : undefined, [other]: otherList.length ? otherList : undefined })
  }

  return (
    <div className="space-y-4">
      {/* Profile selector */}
      <div>
        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
          Profile
        </label>
        <select
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          value={policy.profile ?? ''}
          onChange={(e) =>
            onChange({ ...policy, profile: e.target.value || undefined })
          }
        >
          <option value="">No profile (inherit)</option>
          {tools
            ? Object.keys(tools.profiles).map((p) => (
                <option key={p} value={p}>
                  {PROFILE_LABELS[p] ?? p}
                </option>
              ))
            : Object.entries(PROFILE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          {tools && tools.customProfiles && Object.keys(tools.customProfiles).length > 0 && (
            <optgroup label="Custom">
              {Object.keys(tools.customProfiles).map((p) => (
                <option key={`custom-${p}`} value={p}>
                  {p} (custom)
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Allow list (raw) */}
      <div>
        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
          Allow (overrides)
        </label>
        <input
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          placeholder="exec, read, write, group:fs ..."
          value={allow.join(', ')}
          onChange={(e) => {
            const items = e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
            onChange({ ...policy, allow: items.length ? items : undefined })
          }}
        />
        <p className="text-xs text-white/25 mt-1">Comma-separated tool names or group:name</p>
      </div>

      {/* Deny list */}
      <div>
        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
          Deny (overrides)
        </label>
        <input
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          placeholder="exec, write ..."
          value={deny.join(', ')}
          onChange={(e) => {
            const items = e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
            onChange({ ...policy, deny: items.length ? items : undefined })
          }}
        />
        <p className="text-xs text-white/25 mt-1">Comma-separated tools to explicitly deny</p>
      </div>

      {/* Tool group toggles (when tools are discovered) */}
      {tools && (
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors"
          >
            {showAdvanced ? '▾ Hide' : '▸ Show'} group toggles
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3">
              {Object.entries(tools.groups).map(([groupName, groupTools]) => (
                <div key={groupName} className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-white/60">{groupName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupTools.map((tool) => {
                      const inAllow = allow.includes(tool)
                      const inDeny = deny.includes(tool)
                      return (
                        <div key={tool} className="flex items-center gap-1">
                          <button
                            onClick={() => toggleInList('allow', tool, !inAllow)}
                            className={[
                              'px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border',
                              inAllow
                                ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400'
                                : inDeny
                                ? 'bg-red-400/15 border-red-400/30 text-red-400'
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10',
                            ].join(' ')}
                            title={inAllow ? 'Click to remove from allow' : 'Click to allow'}
                          >
                            {tool}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
