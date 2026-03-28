import React, { useEffect, useState, useCallback } from 'react'
import { useConfigStore } from '../../store/config-store'
import { useInfoStore } from '../../store/info-store'
import { api } from '../../lib/api'
import { PageHeader } from '../common/PageHeader'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ErrorState } from '../common/ErrorState'
import { formatPath } from '../../lib/format-path'
import type { BootFilesResult, BootFileInfo, AgentConfig } from '../../types/config'

// ─── Boot file card ──────────────────────────────────────────────────────────

interface BootFileCardProps {
  file: BootFileInfo
  stripped: boolean
  onToggle: (name: string) => void
}

function BootFileCard({ file, stripped, onToggle }: BootFileCardProps) {
  const isLoaded = file.exists && !stripped
  const isStripped = file.exists && stripped
  const isMissing = !file.exists

  const statusColor = isMissing
    ? 'border-white/5 bg-white/[0.02]'
    : isStripped
      ? 'border-red-500/20 bg-red-500/5'
      : 'border-emerald-500/20 bg-emerald-500/5'

  const statusIndicator = isMissing ? (
    <span className="text-white/20 text-lg leading-none">–</span>
  ) : isStripped ? (
    <span className="text-red-400 text-base leading-none">✕</span>
  ) : (
    <span className="text-emerald-400 text-base leading-none">✓</span>
  )

  return (
    <div
      className={[
        'rounded-xl border backdrop-blur-xl transition-all duration-200 p-4 flex flex-col gap-3',
        statusColor,
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={[
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
              isMissing
                ? 'bg-white/5'
                : isStripped
                  ? 'bg-red-500/10'
                  : 'bg-emerald-500/10',
            ].join(' ')}
          >
            {statusIndicator}
          </div>
          <span
            className={[
              'text-sm font-mono font-medium truncate',
              isMissing ? 'text-white/25' : 'text-white/80',
            ].join(' ')}
          >
            {file.name}
          </span>
        </div>

        {/* Toggle — only shown if file exists */}
        {file.exists && (
          <button
            onClick={() => onToggle(file.name)}
            className={[
              'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none',
              isLoaded ? 'bg-emerald-500/50' : 'bg-red-500/40',
            ].join(' ')}
            title={isLoaded ? 'Click to strip from boot' : 'Click to include in boot'}
            aria-label={isLoaded ? `Strip ${file.name}` : `Include ${file.name}`}
          >
            <span
              className={[
                'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200',
                isLoaded ? 'translate-x-4' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        )}
      </div>

      {/* Stats */}
      {file.exists ? (
        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/40">
            {file.sizeChars.toLocaleString()}{' '}
            <span className="text-white/25">chars</span>
          </span>
          <span className="text-white/20">·</span>
          <span className="text-white/40">
            ~{file.estimatedTokens.toLocaleString()}{' '}
            <span className="text-white/25">tokens</span>
          </span>
        </div>
      ) : (
        <p className="text-xs text-white/20">Not found in workspace</p>
      )}

      {/* Status label */}
      <div
        className={[
          'text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full w-fit',
          isMissing
            ? 'bg-white/5 text-white/20'
            : isStripped
              ? 'bg-red-500/15 text-red-400/80'
              : 'bg-emerald-500/15 text-emerald-400/80',
        ].join(' ')}
      >
        {isMissing ? 'not found' : isStripped ? 'stripped' : 'loaded'}
      </div>
    </div>
  )
}

// ─── Summary bar ─────────────────────────────────────────────────────────────

interface SummaryBarProps {
  files: BootFileInfo[]
  strippedNames: Set<string>
}

function SummaryBar({ files, strippedNames }: SummaryBarProps) {
  const existingFiles = files.filter((f) => f.exists)
  const totalChars = existingFiles.reduce((sum, f) => sum + f.sizeChars, 0)
  const totalTokens = existingFiles.reduce((sum, f) => sum + f.estimatedTokens, 0)

  const strippedFiles = existingFiles.filter((f) => strippedNames.has(f.name))
  const strippedChars = strippedFiles.reduce((sum, f) => sum + f.sizeChars, 0)
  const strippedTokens = strippedFiles.reduce((sum, f) => sum + f.estimatedTokens, 0)

  const loadedChars = totalChars - strippedChars
  const loadedTokens = totalTokens - strippedTokens

  const loadedPct = totalChars > 0 ? (loadedChars / totalChars) * 100 : 0
  const strippedPct = totalChars > 0 ? (strippedChars / totalChars) * 100 : 0

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 flex flex-col gap-3">
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
        <div
          className="bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
          style={{ width: `${loadedPct}%` }}
        />
        <div
          className="bg-gradient-to-r from-red-500/60 to-red-400/60 transition-all duration-300"
          style={{ width: `${strippedPct}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-4">
          <span className="text-white/60">
            Boot context:{' '}
            <span className="text-white/80 font-medium">
              {loadedChars.toLocaleString()} chars
            </span>
            <span className="text-white/30 text-xs ml-1">
              (~{loadedTokens.toLocaleString()} tokens)
            </span>
          </span>
          {strippedChars > 0 && (
            <span className="text-red-400/80 text-xs">
              Stripped: {strippedChars.toLocaleString()} chars (~{strippedTokens.toLocaleString()} tokens saved)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-white/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block" />
            Loaded
          </span>
          <span className="flex items-center gap-1.5 text-xs text-white/30">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 inline-block" />
            Stripped
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function BootFilesPage() {
  const { config, loading: configLoading, error: configError, load } = useConfigStore()
  const { homedir } = useInfoStore()

  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [bootData, setBootData] = useState<BootFilesResult | null>(null)
  const [loadingBoot, setLoadingBoot] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)

  // Local stripped set — initialised from lean-boot state, user can toggle
  const [strippedNames, setStrippedNames] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)

  // Load config on mount
  useEffect(() => {
    if (!config) load()
  }, [])

  // Pick first agent by default once config loads
  useEffect(() => {
    if (config && !selectedAgentId) {
      const firstAgent = config.agents?.list?.[0]
      if (firstAgent) setSelectedAgentId(firstAgent.id)
    }
  }, [config])

  // Fetch boot files whenever selected agent changes
  const fetchBootFiles = useCallback(async (agentId: string) => {
    if (!agentId) return
    setLoadingBoot(true)
    setBootError(null)
    setBootData(null)
    setDirty(false)
    setApplySuccess(false)

    const res = await api.bootfiles.get(agentId)
    setLoadingBoot(false)

    if (!res.ok) {
      setBootError(res.error)
      return
    }

    setBootData(res.data)
    setStrippedNames(new Set(res.data.leanBoot.strippedFiles))
  }, [])

  useEffect(() => {
    if (selectedAgentId) fetchBootFiles(selectedAgentId)
  }, [selectedAgentId])

  const handleToggle = (name: string) => {
    setStrippedNames((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
    setDirty(true)
    setApplySuccess(false)
  }

  const handleApply = async () => {
    if (!selectedAgentId) return
    setApplying(true)
    setApplySuccess(false)

    const res = await api.bootfiles.applyLeanBoot(selectedAgentId, [...strippedNames])
    setApplying(false)

    if (!res.ok) {
      setBootError(res.error)
      return
    }

    setDirty(false)
    setApplySuccess(true)
    // Refresh to confirm hook was written
    await fetchBootFiles(selectedAgentId)
  }

  const agents: AgentConfig[] = config?.agents?.list ?? []

  if (configLoading) return <LoadingSpinner message="Loading config..." />
  if (configError) return <ErrorState error={configError} onRetry={load} />

  const noWorkspace =
    !loadingBoot &&
    bootData !== null &&
    bootData.workspacePath === null

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Boot Files"
        subtitle={
          bootData?.workspacePath
            ? formatPath(bootData.workspacePath, homedir)
            : 'Manage which files load into agent context at startup'
        }
        actions={
          dirty ? (
            <Button variant="primary" onClick={handleApply} disabled={applying}>
              {applying ? 'Applying...' : 'Apply lean-boot hook'}
            </Button>
          ) : applySuccess ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <span>✓</span> Hook written
            </span>
          ) : null
        }
      />

      <div className="flex-1 px-8 py-6 flex flex-col gap-6">

        {/* Agent selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-white/40 shrink-0">Agent:</label>
          {agents.length === 0 ? (
            <span className="text-sm text-white/30">No agents configured</span>
          ) : (
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
            >
              {agents.map((a: AgentConfig) => (
                <option key={a.id} value={a.id} className="bg-slate-900">
                  {a.name ?? a.id}
                </option>
              ))}
            </select>
          )}

          {bootData?.leanBoot.exists && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400">
              lean-boot active
            </span>
          )}
        </div>

        {/* Workspace path */}
        {bootData?.workspacePath && (
          <p className="text-xs text-white/20 font-mono -mt-3">
            {bootData.workspacePath}
          </p>
        )}

        {/* Loading / error states */}
        {loadingBoot && <LoadingSpinner message="Scanning boot files..." />}
        {bootError && !loadingBoot && (
          <ErrorState
            error={bootError}
            onRetry={() => fetchBootFiles(selectedAgentId)}
          />
        )}

        {/* No workspace warning */}
        {noWorkspace && !loadingBoot && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col gap-2">
            <p className="text-amber-400 text-sm font-medium">No workspace configured</p>
            <p className="text-white/40 text-xs">
              This agent has no workspace path set. Set a workspace in the Agents page to
              manage boot files.
            </p>
          </div>
        )}

        {/* Boot file grid */}
        {bootData && !loadingBoot && (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {bootData.files.map((file) => (
                <BootFileCard
                  key={file.name}
                  file={file}
                  stripped={strippedNames.has(file.name)}
                  onToggle={handleToggle}
                />
              ))}
            </div>

            {/* Summary bar */}
            <SummaryBar files={bootData.files} strippedNames={strippedNames} />

            {/* Lean-boot hook info */}
            {strippedNames.size > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-2">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  lean-boot hook preview
                </p>
                <p className="text-xs text-white/30">
                  Will write to:{' '}
                  <span className="font-mono text-white/50">
                    {bootData.workspacePath
                      ? `${bootData.workspacePath}\\hooks\\lean-boot\\`
                      : '<workspace>/hooks/lean-boot/'}
                  </span>
                </p>
                <div className="mt-1 font-mono text-xs text-white/40 bg-black/30 rounded-lg px-3 py-2 leading-relaxed">
                  <span className="text-white/20">STRIP_FILES</span> = {'{'}
                  {[...strippedNames].map((n, i) => (
                    <span key={n}>
                      {i > 0 ? ', ' : ''}
                      <span className="text-red-400/70">{n}</span>
                    </span>
                  ))}
                  {'}'}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
