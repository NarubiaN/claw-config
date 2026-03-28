import { create } from 'zustand'
import type { OpenClawConfig } from '../types/config'
import { api } from '../lib/api'

interface ConfigStore {
  config: OpenClawConfig | null
  loading: boolean
  saving: boolean
  error: string | null
  load: () => Promise<void>
  save: () => Promise<void>
  updateConfig: (updater: (prev: OpenClawConfig) => OpenClawConfig) => void
  setConfig: (config: OpenClawConfig) => void
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  loading: false,
  saving: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    const res = await api.config.get()
    if (res.ok) {
      set({ config: res.data, loading: false })
    } else {
      set({ error: res.error, loading: false })
    }
  },

  save: async () => {
    const { config } = get()
    if (!config) return
    set({ saving: true, error: null })
    const res = await api.config.put(config)
    if (res.ok) {
      set({ saving: false })
    } else {
      set({ error: res.error, saving: false })
    }
  },

  updateConfig: (updater) => {
    const { config } = get()
    if (!config) return
    set({ config: updater(config) })
  },

  setConfig: (config) => set({ config }),
}))
