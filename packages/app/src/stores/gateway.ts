import { create } from 'zustand'

interface GatewayStatus {
  state: 'running' | 'stopped' | 'starting' | 'error'
  pid?: number
  connectedAt?: string
}

interface GatewayState {
  status: GatewayStatus
  init: () => void
}

export const useGatewayStore = create<GatewayState>((set) => ({
  status: {
    state: 'stopped',
  },
  init: () => {
    // Mock initialization
    set({
      status: {
        state: 'running',
        pid: 12345,
        connectedAt: new Date().toISOString(),
      },
    })
  },
}))
