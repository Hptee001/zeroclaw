import { create } from 'zustand'
import { invokeCommand } from '@/lib/commands'

export interface GatewayStatus {
  state: 'running' | 'stopped' | 'starting' | 'error'
  pid?: number
  port?: number
  connected_at?: string
  version?: string
}

interface GatewayState {
  status: GatewayStatus
  initializing: boolean
  init: () => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  restart: () => Promise<void>
}

export const useGatewayStore = create<GatewayState>((set) => ({
  status: {
    state: 'stopped',
  },
  initializing: false,

  init: async () => {
    set({ initializing: true })
    try {
      const result = await invokeCommand<GatewayStatus>('get_gateway_status')
      if (result.success && result.data) {
        set({ status: result.data, initializing: false })
      } else {
        set({ 
          status: { state: 'stopped' },
          initializing: false 
        })
      }
    } catch (err) {
      set({ 
        status: { state: 'error' },
        initializing: false 
      })
    }
  },

  start: async () => {
    set((state) => ({
      status: { ...state.status, state: 'starting' },
    }))
    
    const result = await invokeCommand<void>('start_gateway')
    if (!result.success) {
      throw new Error(result.error || 'Failed to start gateway')
    }
    
    // Refresh status after starting
    setTimeout(async () => {
      const statusResult = await invokeCommand<GatewayStatus>('get_gateway_status')
      if (statusResult.success && statusResult.data) {
        set({ status: statusResult.data })
      }
    }, 1000)
  },

  stop: async () => {
    const result = await invokeCommand<void>('stop_gateway')
    if (!result.success) {
      throw new Error(result.error || 'Failed to stop gateway')
    }
    
    set({ status: { state: 'stopped' } })
  },

  restart: async () => {
    await invokeCommand<void>('restart_gateway')
    
    setTimeout(async () => {
      const statusResult = await invokeCommand<GatewayStatus>('get_gateway_status')
      if (statusResult.success && statusResult.data) {
        set({ status: statusResult.data })
      }
    }, 1000)
  },
}))
