import { create } from 'zustand'
import { invokeCommand } from '@/lib/commands'

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  language: string
  sidebarCollapsed: boolean
  devModeUnlocked: boolean
  setupComplete: boolean
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: string) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setDevModeUnlocked: (unlocked: boolean) => void
  setSetupComplete: (complete: boolean) => void
  init: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  language: 'en',
  sidebarCollapsed: false,
  devModeUnlocked: false,
  setupComplete: false,

  setTheme: (theme) => {
    set({ theme })
    // Persist to localStorage
    localStorage.setItem('zeroclaw_theme', theme)
  },

  setLanguage: (language) => {
    set({ language })
    localStorage.setItem('zeroclaw_language', language)
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed })
    localStorage.setItem('zeroclaw_sidebar_collapsed', String(collapsed))
  },

  setDevModeUnlocked: (unlocked) => {
    set({ devModeUnlocked: unlocked })
  },

  setSetupComplete: (complete) => {
    set({ setupComplete: complete })
    localStorage.setItem('zeroclaw_setup_complete', String(complete))
  },

  init: () => {
    // Load from localStorage
    const theme = localStorage.getItem('zeroclaw_theme') as 'light' | 'dark' | 'system' | null
    const language = localStorage.getItem('zeroclaw_language')
    const sidebarCollapsed = localStorage.getItem('zeroclaw_sidebar_collapsed') === 'true'
    const setupComplete = localStorage.getItem('zeroclaw_setup_complete') === 'true'

    set({
      theme: theme || 'system',
      language: language || 'en',
      sidebarCollapsed,
      setupComplete,
    })
  },
}))
