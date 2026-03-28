import { create } from 'zustand'
import { api } from '../lib/api'

interface InfoStore {
  homedir: string
  configPath: string
  load: () => Promise<void>
}

export const useInfoStore = create<InfoStore>((set) => ({
  homedir: '',
  configPath: '',

  load: async () => {
    const res = await api.info.get()
    if (res.ok) {
      set({
        homedir: res.data.homedir,
        configPath: res.data.configPath,
      })
    }
  },
}))
