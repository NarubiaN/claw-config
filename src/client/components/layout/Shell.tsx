import React, { useState, useEffect } from 'react'
import { Sidebar, type NavPage } from './Sidebar'
import { AgentsPage } from '../agents/AgentsPage'
import { ToolsPage } from '../tools/ToolsPage'
import { SkillsPage } from '../skills/SkillsPage'
import { ModelsPage } from '../models/ModelsPage'
import { ContextPage } from '../context/ContextPage'
import { BootFilesPage } from '../bootfiles/BootFilesPage'
import { useInfoStore } from '../../store/info-store'

export function Shell() {
  const [page, setPage] = useState<NavPage>('agents')
  const loadInfo = useInfoStore((s) => s.load)

  useEffect(() => {
    void loadInfo()
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-auto">
        {page === 'agents' && <AgentsPage />}
        {page === 'tools' && <ToolsPage />}
        {page === 'skills' && <SkillsPage />}
        {page === 'models' && <ModelsPage />}
        {page === 'context' && <ContextPage />}
        {page === 'bootfiles' && <BootFilesPage />}
      </main>
    </div>
  )
}
