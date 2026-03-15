import { create } from 'zustand'
import { invokeCommand } from '@/lib/commands'

export interface Config {
  identifier: string
  version: string
  providers: ProviderConfig[]
  channels: ChannelConfig[]
  tools: ToolConfig
  memory: MemoryConfig
  security: SecurityConfig
}

export interface ProviderConfig {
  type: 'anthropic' | 'openai' | 'zhipu' | 'ollama' | 'openrouter' | 'gemini'
  name: string
  api_key?: string
  base_url?: string
  model: string
  enabled: boolean
}

export interface ChannelConfig {
  type: string
  enabled: boolean
  config: Record<string, unknown>
}

export interface ToolConfig {
  shell_enabled: boolean
  file_read_enabled: boolean
  file_write_enabled: boolean
  browser_enabled: boolean
  allowed_commands: string[]
}

export interface MemoryConfig {
  type: 'markdown' | 'sqlite'
  path?: string
  embedding_model?: string
}

export interface SecurityConfig {
  policy_enabled: boolean
  require_approval_for: string[]
  webhook_secret?: string
}

interface ConfigState {
  config: Config | null
  loading: boolean
  error: string | null
  fetchConfig: () => Promise<void>
  updateConfig: (updates: Partial<Config>) => Promise<void>
  updateProvider: (type: string, updates: Partial<ProviderConfig>) => Promise<void>
  updateTools: (updates: Partial<ToolConfig>) => Promise<void>
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true, error: null })
    try {
      const result = await invokeCommand<Config>('get_config')
      if (result.success && result.data) {
        set({ config: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to fetch config', loading: false })
      }
    } catch (err) {
      set({ error: 'Failed to fetch config', loading: false })
    }
  },

  updateConfig: async (updates: Partial<Config>) => {
    const result = await invokeCommand<void>('update_config', { config: updates })
    if (!result.success) {
      throw new Error(result.error || 'Failed to update config')
    }
    
    set((state) => ({
      config: state.config ? { ...state.config, ...updates } : null,
    }))
  },

  updateProvider: async (type: string, updates: Partial<ProviderConfig>) => {
    const state = get()
    const providers = state.config?.providers || []
    const newProviders = providers.map((p) => 
      p.type === type ? { ...p, ...updates } : p
    )
    
    await invokeCommand<void>('update_config', {
      config: { providers: newProviders },
    })
    
    set((state) => ({
      config: state.config ? { 
        ...state.config, 
        providers: newProviders 
      } : null,
    }))
  },

  updateTools: async (updates: Partial<ToolConfig>) => {
    const state = get()
    const tools = state.config?.tools
    if (!tools) return
    
    const newTools = { ...tools, ...updates }
    
    await invokeCommand<void>('update_config', {
      config: { tools: newTools },
    })
    
    set((state) => ({
      config: state.config ? { 
        ...state.config, 
        tools: newTools 
      } : null,
    }))
  },
}))
