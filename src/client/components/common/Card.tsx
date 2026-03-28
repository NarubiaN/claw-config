import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  const base =
    'rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-200'
  const clickable = onClick ? 'cursor-pointer hover:bg-white/[0.08]' : ''

  return (
    <div
      className={`${base} ${clickable} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
