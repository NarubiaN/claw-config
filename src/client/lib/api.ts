import type {
  OpenClawConfig,
  DiscoveredTools,
  DiscoveredSkills,
  ApiResponse,
  BootFilesResult,
  CustomToolsFile,
} from '../types/config'

export interface AppInfo {
  homedir: string
  configPath: string
}

const BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  return json as ApiResponse<T>
}

export const api = {
  config: {
    get: () => fetchJson<OpenClawConfig>('/config'),
    put: (data: OpenClawConfig) =>
      fetchJson<{ saved: boolean }>('/config', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    backup: () =>
      fetchJson<{ backupPath: string | null }>('/config/backup', {
        method: 'POST',
      }),
  },
  discovery: {
    tools: () => fetchJson<DiscoveredTools>('/discovery/tools'),
    skills: () => fetchJson<DiscoveredSkills>('/discovery/skills'),
    customTools: () => fetchJson<CustomToolsFile>('/discovery/custom-tools'),
    saveCustomGroup: (name: string, tools: string[]) =>
      fetchJson<{ name: string; tools: string[] }>('/discovery/custom-tools/groups', {
        method: 'POST',
        body: JSON.stringify({ name, tools }),
      }),
    deleteCustomGroup: (name: string) =>
      fetchJson<{ deleted: string }>(`/discovery/custom-tools/groups/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      }),
    saveCustomProfile: (name: string, allow: string[]) =>
      fetchJson<{ name: string; allow: string[] }>('/discovery/custom-tools/profiles', {
        method: 'POST',
        body: JSON.stringify({ name, allow }),
      }),
    deleteCustomProfile: (name: string) =>
      fetchJson<{ deleted: string }>(`/discovery/custom-tools/profiles/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      }),
  },
  bootfiles: {
    get: (agentId: string) =>
      fetchJson<BootFilesResult>(`/discovery/bootfiles/${encodeURIComponent(agentId)}`),
    applyLeanBoot: (agentId: string, stripFiles: string[]) =>
      fetchJson<{ hookDir: string; strippedFiles: string[] }>(
        `/bootfiles/${encodeURIComponent(agentId)}/lean-boot`,
        {
          method: 'POST',
          body: JSON.stringify({ stripFiles }),
        }
      ),
  },
  info: {
    get: () => fetchJson<AppInfo>('/info'),
  },
}
