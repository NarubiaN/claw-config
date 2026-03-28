import React, { useEffect, useState } from 'react'
import { useConfigStore } from '../../store/config-store'
import { useDiscoveryStore } from '../../store/discovery-store'
import { useInfoStore } from '../../store/info-store'
import { PageHeader } from '../common/PageHeader'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ErrorState } from '../common/ErrorState'
import { AgentList } from './AgentList'
import { AgentEditor } from './AgentEditor'
import { formatPath } from '../../lib/format-path'
import type { AgentConfig } from '../../types/config'

export function AgentsPage() {
  const { config, loading, error, load, save, saving } = useConfigStore()
  const { scan } = useDiscoveryStore()
  const { homedir, configPath } = useInfoStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [unsaved, setUnsaved] = useState(false)

  useEffect(() => {
    if (!config) load()
    scan()
  }, [])

  const agents = config?.agents?.list ?? []
  const selectedAgent = agents.find((a) => a.id === selectedId) ?? null

  const handleAddAgent = () => {
    const newId = `agent-${Date.now()}`
    const newAgent: AgentConfig = {
      id: newId,
      name: 'New Agent',
      tools: { profile: 'coding' },
    }
    useConfigStore.getState().updateConfig((prev) => ({
      ...prev,
      agents: {
        ...prev.agents,
        list: [...(prev.agents?.list ?? []), newAgent],
      },
    }))
    setSelectedId(newId)
    setUnsaved(true)
  }

  const handleDeleteAgent = (id: string) => {
    useConfigStore.getState().updateConfig((prev) => ({
      ...prev,
      agents: {
        ...prev.agents,
        list: (prev.agents?.list ?? []).filter((a) => a.id !== id),
      },
    }))
    if (selectedId === id) setSelectedId(null)
    setUnsaved(true)
  }

  const handleUpdateAgent = (updated: AgentConfig) => {
    useConfigStore.getState().updateConfig((prev) => ({
      ...prev,
      agents: {
        ...prev.agents,
        list: (prev.agents?.list ?? []).map((a) =>
          a.id === updated.id ? updated : a
        ),
      },
    }))
    setUnsaved(true)
  }

  const handleSave = async () => {
    await save()
    setUnsaved(false)
  }

  if (loading) return <LoadingSpinner message="Loading config..." />
  if (error) return <ErrorState error={error} onRetry={load} />

  return (
    <div className="flex h-full min-h-screen">
      {/* Left panel: agent list */}
      <div className="w-64 shrink-0 border-r border-white/5 flex flex-col">
        <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white/60">Agents</h2>
          <button
            onClick={handleAddAgent}
            className="text-blue-400 hover:text-blue-300 transition-colors text-xs px-2 py-1 rounded hover:bg-blue-400/10"
            title="Add agent"
          >
            + Add
          </button>
        </div>
        <AgentList
          agents={agents}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={handleDeleteAgent}
        />
      </div>

      {/* Right panel: editor */}
      <div className="flex-1 flex flex-col">
        <PageHeader
          title="Agents"
          subtitle={configPath ? formatPath(configPath, homedir) : `${agents.length} agent${agents.length !== 1 ? 's' : ''} configured`}
          actions={
            unsaved ? (
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            ) : (
              <span className="text-xs text-white/30">All saved</span>
            )
          }
        />
        <div className="flex-1 overflow-auto px-8 py-6">
          {selectedAgent ? (
            <AgentEditor
              agent={selectedAgent}
              onChange={handleUpdateAgent}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-white/30 text-sm">Select an agent to edit</p>
              <button
                onClick={handleAddAgent}
                className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
              >
                + Create your first agent
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
