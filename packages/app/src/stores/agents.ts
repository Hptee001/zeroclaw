import { create } from 'zustand'
import { invokeCommand } from '@/lib/commands'

export interface Agent {
  id: string
  name: string
  enabled: boolean
  channels?: string[]
  created_at?: string
  updated_at?: string
}

interface AgentsState {
  agents: Agent[]
  loading: boolean
  error: string | null
  fetchAgents: () => Promise<void>
  createAgent: (name: string) => Promise<void>
  deleteAgent: (id: string) => Promise<void>
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>
}

export const useAgentsStore = create<AgentsState>((set) => ({
  agents: [],
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null })
    try {
      const result = await invokeCommand<Agent[]>('list_agents')
      if (result.success && result.data) {
        set({ agents: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to fetch agents', loading: false })
      }
    } catch (err) {
      set({ error: 'Failed to fetch agents', loading: false })
    }
  },

  createAgent: async (name: string) => {
    const result = await invokeCommand<Agent>('create_agent', { name })
    if (!result.success) {
      throw new Error(result.error)
    }
  },

  deleteAgent: async (id: string) => {
    const result = await invokeCommand<void>('delete_agent', { id })
    if (!result.success) {
      throw new Error(result.error)
    }
  },

  updateAgent: async (id: string, updates: Partial<Agent>) => {
    const result = await invokeCommand<void>('update_agent', { id, updates })
    if (!result.success) {
      throw new Error(result.error)
    }
  },
}))
