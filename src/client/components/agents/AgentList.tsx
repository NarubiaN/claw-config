import React, { useState } from 'react'
import type { AgentConfig } from '../../types/config'

interface AgentListProps {
  agents: AgentConfig[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function AgentList({ agents, selectedId, onSelect, onDelete }: AgentListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirmDelete === id) {
      onDelete(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 2500)
    }
  }

  if (agents.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-white/25 text-xs">No agents configured</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto py-2">
      {agents.map((agent) => {
        const active = selectedId === agent.id
        const profile = agent.tools?.profile ?? 'default'
        return (
          <div
            key={agent.id}
            onClick={() => onSelect(agent.id)}
            className={[
              'group relative mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150',
              active
                ? 'bg-blue-500/15 ring-1 ring-blue-500/20'
                : 'hover:bg-white/5',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    active ? 'text-blue-300' : 'text-white/70'
                  }`}
                >
                  {agent.name ?? agent.id}
                </p>
                <p className="text-xs text-white/30 truncate mt-0.5">
                  {agent.id}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-white/20 px-1.5 py-0.5 rounded bg-white/5">
                  {profile}
                </span>
                <button
                  onClick={(e) => handleDelete(e, agent.id)}
                  className={[
                    'text-xs px-1.5 py-0.5 rounded transition-all opacity-0 group-hover:opacity-100',
                    confirmDelete === agent.id
                      ? 'bg-red-500/20 text-red-400 opacity-100'
                      : 'hover:bg-red-500/10 text-white/30 hover:text-red-400',
                  ].join(' ')}
                  title={confirmDelete === agent.id ? 'Click again to confirm' : 'Delete'}
                >
                  {confirmDelete === agent.id ? '!' : '×'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
