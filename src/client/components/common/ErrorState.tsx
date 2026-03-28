import React from 'react'

interface ErrorStateProps {
  error: string
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-red-400/10 flex items-center justify-center">
        <span className="text-red-400 text-xl">!</span>
      </div>
      <div className="text-center">
        <p className="text-white/70 text-sm font-medium">Something went wrong</p>
        <p className="text-white/30 text-xs mt-1 max-w-sm">{error}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 hover:text-white/80 transition-all duration-150"
        >
          Retry
        </button>
      )}
    </div>
  )
}
