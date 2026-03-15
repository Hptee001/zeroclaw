import { create } from 'zustand'
import { invokeCommand } from '@/lib/commands'

export type ChannelType = 
  | 'telegram' | 'discord' | 'slack' | 'matrix'
  | 'lark' | 'feishu' | 'dingtalk' | 'wecom' | 'qq'

export interface Channel {
  id: string
  type: ChannelType
  name: string
  enabled: boolean
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, unknown>
  created_at?: string
}

interface ChannelsState {
  channels: Channel[]
  loading: boolean
  error: string | null
  fetchChannels: () => Promise<void>
  addChannel: (type: ChannelType, config: Record<string, unknown>) => Promise<Channel>
  deleteChannel: (id: string) => Promise<void>
  updateChannel: (id: string, updates: Partial<Channel>) => Promise<void>
  testChannel: (id: string) => Promise<boolean>
}

export const useChannelsStore = create<ChannelsState>((set) => ({
  channels: [],
  loading: false,
  error: null,

  fetchChannels: async () => {
    set({ loading: true, error: null })
    try {
      const result = await invokeCommand<Channel[]>('list_channels')
      if (result.success && result.data) {
        set({ channels: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to fetch channels', loading: false })
      }
    } catch (err) {
      set({ error: 'Failed to fetch channels', loading: false })
    }
  },

  addChannel: async (type: ChannelType, config: Record<string, unknown>) => {
    const result = await invokeCommand<Channel>('add_channel', { type, config })
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to add channel')
    }
    
    set((state) => ({
      channels: [...state.channels, result.data!],
    }))
    
    return result.data
  },

  deleteChannel: async (id: string) => {
    const result = await invokeCommand<void>('delete_channel', { id })
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete channel')
    }
    
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== id),
    }))
  },

  updateChannel: async (id: string, updates: Partial<Channel>) => {
    const result = await invokeCommand<void>('update_channel', { id, updates })
    if (!result.success) {
      throw new Error(result.error || 'Failed to update channel')
    }
    
    set((state) => ({
      channels: state.channels.map((c) => 
        c.id === id ? { ...c, ...updates } : c
      ),
    }))
  },

  testChannel: async (id: string) => {
    const result = await invokeCommand<{ success: boolean }>('test_channel', { id })
    return result.success && result.data?.success === true
  },
}))
