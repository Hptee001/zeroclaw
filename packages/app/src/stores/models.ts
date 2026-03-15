import { create } from 'zustand'
import { invokeCommand } from '@/lib/commands'

export interface ModelUsage {
  model: string
  provider: string
  tokens_used: number
  cost: number
  last_used: string
}

export interface Provider {
  type: string
  name: string
  enabled: boolean
  models: string[]
  api_key_set: boolean
}

interface ModelsState {
  providers: Provider[]
  usage: ModelUsage[]
  loading: boolean
  error: string | null
  fetchProviders: () => Promise<void>
  fetchUsage: (window: '7d' | '30d' | '90d') => Promise<void>
  updateProvider: (type: string, updates: Partial<Provider>) => Promise<void>
  testProvider: (type: string) => Promise<boolean>
}

export const useModelsStore = create<ModelsState>((set) => ({
  providers: [],
  usage: [],
  loading: false,
  error: null,

  fetchProviders: async () => {
    set({ loading: true, error: null })
    try {
      const result = await invokeCommand<Provider[]>('list_providers')
      if (result.success && result.data) {
        set({ providers: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to fetch providers', loading: false })
      }
    } catch (err) {
      set({ error: 'Failed to fetch providers', loading: false })
    }
  },

  fetchUsage: async (window: '7d' | '30d' | '90d') => {
    set({ loading: true, error: null })
    try {
      const result = await invokeCommand<ModelUsage[]>('get_usage', { window })
      if (result.success && result.data) {
        set({ usage: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to fetch usage', loading: false })
      }
    } catch (err) {
      set({ error: 'Failed to fetch usage', loading: false })
    }
  },

  updateProvider: async (type: string, updates: Partial<Provider>) => {
    const result = await invokeCommand<Provider>('update_provider', { type, updates })
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update provider')
    }
    
    set((state) => ({
      providers: state.providers.map((p) => 
        p.type === type ? { ...p, ...updates } : p
      ),
    }))
  },

  testProvider: async (type: string) => {
    const result = await invokeCommand<{ success: boolean }>('test_provider', { type })
    return result.success && result.data?.success === true
  },
}))
