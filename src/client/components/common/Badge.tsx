import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple'
}

const colorMap = {
  blue: 'bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20',
  green: 'bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20',
  red: 'bg-red-400/10 text-red-400 ring-1 ring-red-400/20',
  yellow: 'bg-yellow-400/10 text-yellow-400 ring-1 ring-yellow-400/20',
  gray: 'bg-white/5 text-white/40 ring-1 ring-white/10',
  purple: 'bg-violet-400/10 text-violet-400 ring-1 ring-violet-400/20',
}

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color]}`}
    >
      {children}
    </span>
  )
}
