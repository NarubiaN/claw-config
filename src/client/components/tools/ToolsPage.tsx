import React, { useEffect, useState } from 'react'
import { useDiscoveryStore } from '../../store/discovery-store'
import { useInfoStore } from '../../store/info-store'
import { PageHeader } from '../common/PageHeader'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ErrorState } from '../common/ErrorState'
import { formatPath } from '../../lib/format-path'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildHighlightedTools(
  allow: string[],
  groups: Record<string, string[]>,
): { highlightAll: boolean; highlighted: Set<string> } {
  if (allow.length === 0) {
    return { highlightAll: true, highlighted: new Set() }
  }
  const highlighted = new Set<string>()
  for (const item of allow) {
    if (item.startsWith('group:')) {
      const members = groups[item] ?? []
      members.forEach((t) => highlighted.add(t))
    } else {
      highlighted.add(item)
    }
  }
  return { highlightAll: false, highlighted }
}

// ---------------------------------------------------------------------------
// New Group Modal
// ---------------------------------------------------------------------------

interface NewGroupModalProps {
  allTools: string[]
  displayNames: Record<string, { emoji?: string; title?: string }>
  onSave: (name: string, tools: string[]) => void
  onClose: () => void
}

function NewGroupModal({ allTools, displayNames, onSave, onClose }: NewGroupModalProps) {
  const [name, setName] = useState('group:')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [nameError, setNameError] = useState('')

  const toggleTool = (tool: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tool)) next.delete(tool)
      else next.add(tool)
      return next
    })
  }

  const handleSave = () => {
    if (!name.startsWith('group:') || name === 'group:') {
      setNameError('Name must start with "group:" and have a suffix')
      return
    }
    if (selected.size === 0) return
    onSave(name, Array.from(selected))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-base font-semibold text-white/90 mb-4">New Tool Group</h2>

        <div className="mb-4">
          <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
            Group Name
          </label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="group:mygroup"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError('') }}
          />
          {nameError && <p className="text-xs text-red-400 mt-1">{nameError}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
            Tools ({selected.size} selected)
          </label>
          <div className="max-h-64 overflow-y-auto rounded-lg bg-white/[0.03] border border-white/5 p-2 space-y-1">
            {allTools.map((tool) => {
              const display = displayNames[tool]
              return (
                <label
                  key={tool}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(tool)}
                    onChange={() => toggleTool(tool)}
                    className="accent-blue-400"
                  />
                  {display?.emoji && <span className="text-sm">{display.emoji}</span>}
                  <span className="text-sm text-white/70">{display?.title ?? tool}</span>
                  {display?.title && (
                    <span className="text-xs text-white/25">({tool})</span>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={name === 'group:' || selected.size === 0}
            className="px-4 py-2 text-sm rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Group
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Profile Modal
// ---------------------------------------------------------------------------

interface NewProfileModalProps {
  groups: Record<string, string[]>
  customGroups: Record<string, string[]>
  allTools: string[]
  displayNames: Record<string, { emoji?: string; title?: string }>
  onSave: (name: string, allow: string[]) => void
  onClose: () => void
}

function NewProfileModal({
  groups,
  customGroups,
  allTools,
  displayNames,
  onSave,
  onClose,
}: NewProfileModalProps) {
  const [name, setName] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set())

  const allGroups = { ...groups, ...customGroups }

  const toggleGroup = (g: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) => {
      const next = new Set(prev)
      if (next.has(tool)) next.delete(tool)
      else next.add(tool)
      return next
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    const allow: string[] = [
      ...Array.from(selectedGroups),
      ...Array.from(selectedTools),
    ]
    onSave(name.trim(), allow)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
        <h2 className="text-base font-semibold text-white/90 mb-4">New Profile</h2>

        <div className="mb-4">
          <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
            Profile Name
          </label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="my-profile"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
              Groups ({selectedGroups.size} selected)
            </label>
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2 space-y-1">
              {Object.keys(allGroups).map((g) => (
                <label
                  key={g}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.has(g)}
                    onChange={() => toggleGroup(g)}
                    className="accent-blue-400"
                  />
                  <span className="text-sm text-white/70">{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
              Individual Tools ({selectedTools.size} selected)
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg bg-white/[0.03] border border-white/5 p-2 space-y-1">
              {allTools.map((tool) => {
                const display = displayNames[tool]
                return (
                  <label
                    key={tool}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTools.has(tool)}
                      onChange={() => toggleTool(tool)}
                      className="accent-blue-400"
                    />
                    {display?.emoji && <span className="text-sm">{display.emoji}</span>}
                    <span className="text-sm text-white/70">{display?.title ?? tool}</span>
                    {display?.title && (
                      <span className="text-xs text-white/25">({tool})</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ToolsPage
// ---------------------------------------------------------------------------

export function ToolsPage() {
  const {
    tools,
    loading,
    error,
    scan,
    saveCustomGroup,
    saveCustomProfile,
    deleteCustomGroup,
    deleteCustomProfile,
  } = useDiscoveryStore()
  const { homedir } = useInfoStore()

  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [showNewGroupModal, setShowNewGroupModal] = useState(false)
  const [showNewProfileModal, setShowNewProfileModal] = useState(false)

  useEffect(() => {
    if (!tools) scan()
  }, [])

  const toolPolicyPath = '~\\.openclaw\\claw-config-toolpolicy.json'
  const toolsSubtitle = tools?.basePath && homedir
    ? `${formatPath(tools.basePath, homedir)} · ${toolPolicyPath}`
    : toolPolicyPath

  if (loading) return <LoadingSpinner message="Scanning tools..." />
  if (error) return <ErrorState error={error} onRetry={scan} />

  if (!tools || !tools.installed) {
    return (
      <div>
        <PageHeader title="Tools" subtitle={toolsSubtitle} />
        <div className="px-8 py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-400 text-xl">!</span>
          </div>
          <p className="text-white/60 text-sm font-medium">OpenClaw not found</p>
          <p className="text-white/30 text-xs mt-1">
            Tool discovery requires OpenClaw to be installed globally via npm.
          </p>
        </div>
      </div>
    )
  }

  const customGroups = tools.customGroups ?? {}
  const customProfiles = tools.customProfiles ?? {}
  const allGroups = { ...tools.groups, ...customGroups }

  const groupCount = Object.keys(allGroups).length
  const toolCount = tools.allTools.length

  // Build highlight set from selected profile
  let highlightAll = false
  let highlightedTools = new Set<string>()
  if (selectedProfile !== null) {
    const profileData =
      tools.profiles[selectedProfile] ?? customProfiles[selectedProfile]
    if (profileData) {
      const result = buildHighlightedTools(profileData.allow, allGroups)
      highlightAll = result.highlightAll
      highlightedTools = result.highlighted
    }
  }

  const profileSelected = selectedProfile !== null

  const handleProfileClick = (name: string) => {
    setSelectedProfile((prev) => (prev === name ? null : name))
  }

  const handleSaveGroup = async (name: string, toolsList: string[]) => {
    await saveCustomGroup(name, toolsList)
    setShowNewGroupModal(false)
  }

  const handleSaveProfile = async (name: string, allow: string[]) => {
    await saveCustomProfile(name, allow)
    setShowNewProfileModal(false)
  }

  // Helper: is a group highlighted?
  const isGroupHighlighted = (groupName: string, groupTools: string[]) => {
    if (!profileSelected) return false
    if (highlightAll) return true
    if (groupTools.some((t) => highlightedTools.has(t))) return true
    const profileData =
      tools.profiles[selectedProfile!] ?? customProfiles[selectedProfile!]
    return !!(profileData?.allow.includes(groupName))
  }

  return (
    <div>
      <PageHeader
        title="Tools"
        subtitle={toolsSubtitle}
      />

      <div className="px-8 py-6 space-y-6">
        {/* Profiles */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              Profiles
            </h2>
            <button
              onClick={() => setShowNewProfileModal(true)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
            >
              + New Profile
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Built-in profiles */}
            {Object.entries(tools.profiles).map(([name, profile]) => {
              const isActive = selectedProfile === name
              return (
                <Card
                  key={name}
                  className={[
                    'p-4 cursor-pointer transition-all duration-150',
                    isActive
                      ? 'ring-2 ring-blue-400 bg-blue-500/10 border-blue-500/40'
                      : 'hover:bg-white/[0.04]',
                  ].join(' ')}
                  onClick={() => handleProfileClick(name)}
                >
                  <h3 className="text-sm font-semibold text-white/80 mb-1 capitalize">{name}</h3>
                  {profile.allow.length === 0 ? (
                    <p className="text-xs text-white/30">All tools</p>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.allow.map((t) => (
                        <span
                          key={t}
                          className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/30"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}

            {/* Custom profiles */}
            {Object.entries(customProfiles).map(([name, profile]) => {
              const isActive = selectedProfile === name
              return (
                <Card
                  key={`custom-profile-${name}`}
                  className={[
                    'p-4 cursor-pointer transition-all duration-150 relative',
                    isActive
                      ? 'ring-2 ring-blue-400 bg-blue-500/10 border-blue-500/40'
                      : 'hover:bg-white/[0.04]',
                  ].join(' ')}
                  onClick={() => handleProfileClick(name)}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="text-sm font-semibold text-white/80 capitalize">{name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCustomProfile(name)
                        if (selectedProfile === name) setSelectedProfile(null)
                      }}
                      className="text-white/20 hover:text-red-400 transition-colors text-base leading-none flex-shrink-0"
                      title="Delete custom profile"
                    >
                      ×
                    </button>
                  </div>
                  <Badge color="yellow">(custom)</Badge>
                  {profile.allow.length === 0 ? (
                    <p className="text-xs text-white/30 mt-1">All tools</p>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.allow.map((t) => (
                        <span
                          key={t}
                          className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/30"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {profileSelected && (
            <p className="text-xs text-white/30 mt-2">
              Showing tools for <span className="text-blue-400">{selectedProfile}</span>. Click the profile again to deselect.
            </p>
          )}
        </section>

        {/* Groups */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              Tool Groups
            </h2>
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
            >
              + New Group
            </button>
          </div>

          <div className="space-y-3">
            {/* Built-in groups */}
            {Object.entries(tools.groups).map(([groupName, groupTools]) => {
              const groupHighlighted = isGroupHighlighted(groupName, groupTools)
              return (
                <Card
                  key={groupName}
                  className={[
                    'p-5 transition-all duration-150',
                    profileSelected && groupHighlighted
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-white/80">{groupName}</h3>
                    <Badge color="blue">{groupTools.length} tools</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupTools.map((tool) => {
                      const display = tools.displayNames[tool]
                      const toolHighlighted = highlightAll || highlightedTools.has(tool)
                      const dimmed = profileSelected && !toolHighlighted
                      return (
                        <div
                          key={tool}
                          className={[
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-150',
                            toolHighlighted && profileSelected
                              ? 'bg-blue-400/20 border-blue-400/40 text-blue-300'
                              : 'bg-white/[0.04] border-white/8 hover:bg-white/[0.07]',
                            dimmed ? 'opacity-50' : '',
                          ].join(' ')}
                        >
                          {display?.emoji && (
                            <span className="text-sm">{display.emoji}</span>
                          )}
                          <span className="text-xs text-white/70">
                            {display?.title ?? tool}
                          </span>
                          {display?.title && (
                            <span className="text-xs text-white/25 hidden lg:inline">
                              ({tool})
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}

            {/* Custom groups */}
            {Object.entries(customGroups).map(([groupName, groupTools]) => {
              const groupHighlighted = isGroupHighlighted(groupName, groupTools)
              return (
                <Card
                  key={`custom-group-${groupName}`}
                  className={[
                    'p-5 transition-all duration-150',
                    profileSelected && groupHighlighted
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-white/80">{groupName}</h3>
                    <Badge color="yellow">custom</Badge>
                    <Badge color="blue">{groupTools.length} tools</Badge>
                    <button
                      onClick={() => deleteCustomGroup(groupName)}
                      className="ml-auto text-white/20 hover:text-red-400 transition-colors text-base leading-none"
                      title="Delete custom group"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupTools.map((tool) => {
                      const display = tools.displayNames[tool]
                      const toolHighlighted = highlightAll || highlightedTools.has(tool)
                      const dimmed = profileSelected && !toolHighlighted
                      return (
                        <div
                          key={tool}
                          className={[
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-150',
                            toolHighlighted && profileSelected
                              ? 'bg-blue-400/20 border-blue-400/40 text-blue-300'
                              : 'bg-white/[0.04] border-white/8 hover:bg-white/[0.07]',
                            dimmed ? 'opacity-50' : '',
                          ].join(' ')}
                        >
                          {display?.emoji && (
                            <span className="text-sm">{display.emoji}</span>
                          )}
                          <span className="text-xs text-white/70">
                            {display?.title ?? tool}
                          </span>
                          {display?.title && (
                            <span className="text-xs text-white/25 hidden lg:inline">
                              ({tool})
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      </div>

      {/* Modals */}
      {showNewGroupModal && (
        <NewGroupModal
          allTools={tools.allTools}
          displayNames={tools.displayNames}
          onSave={handleSaveGroup}
          onClose={() => setShowNewGroupModal(false)}
        />
      )}

      {showNewProfileModal && (
        <NewProfileModal
          groups={tools.groups}
          customGroups={customGroups}
          allTools={tools.allTools}
          displayNames={tools.displayNames}
          onSave={handleSaveProfile}
          onClose={() => setShowNewProfileModal(false)}
        />
      )}
    </div>
  )
}
