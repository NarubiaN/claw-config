import React, { useEffect } from 'react'
import { useDiscoveryStore } from '../../store/discovery-store'
import { PageHeader } from '../common/PageHeader'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ErrorState } from '../common/ErrorState'

export function SkillsPage() {
  const { skills, loading, error, scan } = useDiscoveryStore()

  useEffect(() => {
    if (!skills) scan()
  }, [])

  if (loading) return <LoadingSpinner message="Scanning skills..." />
  if (error) return <ErrorState error={error} onRetry={scan} />

  const claudeSkills = skills?.claude ?? []
  const openclawSkills = skills?.openclaw ?? []
  const total = claudeSkills.length + openclawSkills.length

  const skillsSubtitle = '~\\.claude\\skills · ~\\.openclaw\\workspace\\skills'

  return (
    <div>
      <PageHeader
        title="Skills"
        subtitle={skillsSubtitle}
      />

      <div className="px-8 py-6 space-y-8">
        {/* Claude Skills */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              Claude Code Skills
            </h2>
            <Badge color="blue">{claudeSkills.length}</Badge>
          </div>

          {claudeSkills.length === 0 ? (
            <p className="text-white/30 text-sm">
              No skills found in ~/.claude/skills/
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claudeSkills.map((skill) => (
                <Card key={skill.dirName} className="p-4 hover:bg-white/[0.08]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white/80">{skill.name}</h3>
                    <Badge color="blue">claude</Badge>
                  </div>
                  {skill.description && (
                    <p className="text-xs text-white/40 leading-relaxed">
                      {skill.description.slice(0, 120)}
                      {skill.description.length > 120 ? '...' : ''}
                    </p>
                  )}
                  <p className="text-xs text-white/20 mt-2 font-mono truncate">{skill.dirName}</p>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* OpenClaw Skills */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              OpenClaw Skills
            </h2>
            <Badge color="purple">{openclawSkills.length}</Badge>
          </div>

          {openclawSkills.length === 0 ? (
            <p className="text-white/30 text-sm">
              No skills found in ~/.openclaw/workspace/skills/
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openclawSkills.map((skill) => (
                <Card key={skill.dirName} className="p-4 hover:bg-white/[0.08]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white/80">{skill.name}</h3>
                    <Badge color="purple">openclaw</Badge>
                  </div>
                  {skill.description && (
                    <p className="text-xs text-white/40 leading-relaxed">
                      {skill.description.slice(0, 120)}
                      {skill.description.length > 120 ? '...' : ''}
                    </p>
                  )}
                  <p className="text-xs text-white/20 mt-2 font-mono truncate">{skill.dirName}</p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
