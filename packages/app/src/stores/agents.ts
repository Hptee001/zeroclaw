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

interface AgentInput {
  name: string
}

interface AgentUpdate {
  name?: string
  enabled?: boolean
  channels?: string[]
}

interface AgentsState {
  agents: Agent[]
  loading: boolean
  error: string | null
  fetchAgents: () => Promise<void>
  createAgent: (name: string) => Promise<Agent>
  deleteAgent: (id: string) => Promise<void>
  updateAgent: (id: string, updates: AgentUpdate) => Promise<void>
  getAgent: (id: string) => Agent | undefined
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
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
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create agent')
    }
    
    set((state) => ({
      agents: [...state.agents, result.data!],
    }))
    
    return result.data
  },

  deleteAgent: async (id: string) => {
    const result = await invokeCommand<void>('delete_agent', { id })
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete agent')
    }
    
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
    }))
  },

  updateAgent: async (id: string, updates: AgentUpdate) => {
    const result = await invokeCommand<Agent>('update_agent', { id, updates })
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update agent')
    }
    
    set((state) => ({
      agents: state.agents.map((a) => 
        a.id === id ? { ...a, ...updates } : a
      ),
    }))
  },

  getAgent: (id: string) => {
    return get().agents.find((a) => a.id === id)
  },
}))
