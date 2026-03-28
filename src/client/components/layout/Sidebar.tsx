import React from 'react'

export type NavPage = 'agents' | 'tools' | 'skills' | 'models' | 'context' | 'bootfiles'

interface NavItem {
  id: NavPage
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'agents', label: 'Agents', icon: '◆' },
  { id: 'tools', label: 'Tools', icon: '⚙' },
  { id: 'skills', label: 'Skills', icon: '◉' },
  { id: 'models', label: 'Models', icon: '◈' },
  { id: 'context', label: 'Context Budget', icon: '▣' },
  { id: 'bootfiles', label: 'Boot Files', icon: '⬡' },
]

interface SidebarProps {
  currentPage: NavPage
  onNavigate: (page: NavPage) => void
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 min-h-screen bg-slate-950 border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-lg font-bold tracking-tight">claw</span>
          <span className="text-white/30 text-lg">/</span>
          <span className="text-white/60 text-sm font-medium">config</span>
        </div>
        <p className="text-white/25 text-xs mt-0.5">OpenClaw config editor</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5',
              ].join(' ')}
            >
              <span className="text-xs opacity-70">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-white/20 text-xs">v0.1.0</p>
      </div>
    </aside>
  )
}
