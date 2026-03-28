import React, { useEffect, useState } from 'react'
import { useConfigStore } from '../../store/config-store'
import { useInfoStore } from '../../store/info-store'
import { PageHeader } from '../common/PageHeader'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { formatPath } from '../../lib/format-path'

export function ModelsPage() {
  const { config, loading, load } = useConfigStore()
  const { homedir, configPath } = useInfoStore()
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)

  useEffect(() => {
    if (!config) load()
  }, [])

  if (loading) return <LoadingSpinner message="Loading config..." />

  const providers = config?.models?.providers ?? {}
  const providerEntries = Object.entries(providers)

  return (
    <div>
      <PageHeader
        title="Models"
        subtitle={configPath ? formatPath(configPath, homedir) : `${providerEntries.length} providers`}
      />

      <div className="px-8 py-6 space-y-4">
        {providerEntries.length === 0 ? (
          <p className="text-white/30 text-sm py-12 text-center">
            No providers configured in openclaw.json
          </p>
        ) : (
          providerEntries.map(([providerName, provider]) => {
            const isExpanded = expandedProvider === providerName
            const maskedKey = provider.apiKey
              ? `...${provider.apiKey.slice(-4)}`
              : '(none)'

            return (
              <Card key={providerName} className="overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedProvider(isExpanded ? null : providerName)
                  }
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-semibold text-white/80">
                      {providerName}
                    </h3>
                    <Badge color="gray">{provider.api}</Badge>
                    <Badge color="blue">{provider.models.length} models</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/30 font-mono">{maskedKey}</span>
                    <span className="text-white/30 text-xs">{isExpanded ? '▾' : '▸'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
                    {/* Provider details */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/[0.03] rounded-lg p-3">
                        <p className="text-white/40 mb-1">Base URL</p>
                        <p className="text-white/70 font-mono break-all">{provider.baseUrl}</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-3">
                        <p className="text-white/40 mb-1">API Key</p>
                        <p className="text-white/70 font-mono">{maskedKey}</p>
                      </div>
                    </div>

                    {/* Models table */}
                    <div>
                      <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                        Models
                      </h4>
                      <div className="space-y-2">
                        {provider.models.map((model) => (
                          <div
                            key={model.id}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-white/80 font-medium">{model.name}</p>
                              <p className="text-xs text-white/30 font-mono truncate">{model.id}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {model.reasoning && (
                                <Badge color="purple">reasoning</Badge>
                              )}
                              {model.contextWindow && (
                                <span className="text-xs text-white/30">
                                  {(model.contextWindow / 1000).toFixed(0)}k ctx
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
