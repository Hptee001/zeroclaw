import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

export interface ProviderConfig {
  type: 'anthropic' | 'openai' | 'zhipu' | 'ollama' | 'openrouter' | 'gemini'
  name: string
  api_key?: string
  base_url?: string
  model: string
  enabled: boolean
  provider_type?: string  // For backend compatibility
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

export interface Config {
  identifier: string
  version: string
  providers: ProviderConfig[]
  channels: ChannelConfig[]
  tools: ToolConfig
  memory: MemoryConfig
  security: SecurityConfig
}

interface ConfigState {
  config: Config | null
  loading: boolean
  error: string | null
  fetchConfig: () => Promise<void>
  updateConfig: (updates: Partial<Config>) => Promise<void>
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true, error: null })
    try {
      const config = await invoke<Config>('get_config')
      set({ config, loading: false })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch config'
      set({ error: errorMsg, loading: false })
    }
  },

  updateConfig: async (updates: Partial<Config>) => {
    const state = get()
    if (!state.config) {
      throw new Error('No config loaded')
    }

    const newConfig: Config = {
      ...state.config,
      ...updates,
    }

    try {
      await invoke('update_config', { config: newConfig })
      set({ config: newConfig })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update config'
      console.error('updateConfig error:', err)
      throw new Error(errorMsg)
    }
  },
}))
