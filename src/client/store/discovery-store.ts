import { create } from 'zustand'
import type { DiscoveredTools, DiscoveredSkills } from '../types/config'
import { api } from '../lib/api'

interface DiscoveryStore {
  tools: DiscoveredTools | null
  skills: DiscoveredSkills | null
  loading: boolean
  error: string | null
  scan: () => Promise<void>
  loadCustomTools: () => Promise<void>
  saveCustomGroup: (name: string, toolsList: string[]) => Promise<void>
  saveCustomProfile: (name: string, allow: string[]) => Promise<void>
  deleteCustomGroup: (name: string) => Promise<void>
  deleteCustomProfile: (name: string) => Promise<void>
}

export const useDiscoveryStore = create<DiscoveryStore>((set, get) => ({
  tools: null,
  skills: null,
  loading: false,
  error: null,

  scan: async () => {
    set({ loading: true, error: null })
    const [toolsRes, skillsRes] = await Promise.all([
      api.discovery.tools(),
      api.discovery.skills(),
    ])

    const tools = toolsRes.ok ? toolsRes.data : null
    const skills = skillsRes.ok ? skillsRes.data : null
    const error =
      !toolsRes.ok ? toolsRes.error :
      !skillsRes.ok ? skillsRes.error :
      null

    set({ tools, skills, loading: false, error })

    // Load custom tools after base scan completes
    if (tools) {
      await get().loadCustomTools()
    }
  },

  loadCustomTools: async () => {
    const customRes = await api.discovery.customTools()
    if (!customRes.ok) return

    set((state) => {
      const base: DiscoveredTools = state.tools ?? {
        groups: {},
        profiles: {},
        allTools: [],
        displayNames: {},
        installed: false,
      }
      return {
        tools: {
          ...base,
          customGroups: customRes.data.customGroups,
          customProfiles: customRes.data.customProfiles,
        },
      }
    })
  },

  saveCustomGroup: async (name: string, toolsList: string[]) => {
    await api.discovery.saveCustomGroup(name, toolsList)
    await get().loadCustomTools()
  },

  saveCustomProfile: async (name: string, allow: string[]) => {
    await api.discovery.saveCustomProfile(name, allow)
    await get().loadCustomTools()
  },

  deleteCustomGroup: async (name: string) => {
    await api.discovery.deleteCustomGroup(name)
    await get().loadCustomTools()
  },

  deleteCustomProfile: async (name: string) => {
    await api.discovery.deleteCustomProfile(name)
    await get().loadCustomTools()
  },
}))
