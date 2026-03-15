import { create } from 'zustand'
import { invokeCommand } from '@/lib/commands'

export interface Skill {
  id: string
  name: string
  description: string
  enabled: boolean
  isBundled: boolean
  source?: string
  author?: string
  version?: string
  config?: Record<string, unknown>
}

interface SkillsState {
  skills: Skill[]
  loading: boolean
  error: string | null
  fetchSkills: () => Promise<void>
  toggleSkill: (id: string, enabled: boolean) => Promise<void>
  installSkill: (name: string) => Promise<Skill>
  uninstallSkill: (id: string) => Promise<void>
  updateSkillConfig: (id: string, config: Record<string, unknown>) => Promise<void>
}

export const useSkillsStore = create<SkillsState>((set) => ({
  skills: [],
  loading: false,
  error: null,

  fetchSkills: async () => {
    set({ loading: true, error: null })
    try {
      const result = await invokeCommand<Skill[]>('list_skills')
      if (result.success && result.data) {
        set({ skills: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to fetch skills', loading: false })
      }
    } catch (err) {
      set({ error: 'Failed to fetch skills', loading: false })
    }
  },

  toggleSkill: async (id: string, enabled: boolean) => {
    const result = await invokeCommand<void>('toggle_skill', { id, enabled })
    if (!result.success) {
      throw new Error(result.error || 'Failed to toggle skill')
    }
    
    set((state) => ({
      skills: state.skills.map((s) => 
        s.id === id ? { ...s, enabled } : s
      ),
    }))
  },

  installSkill: async (name: string) => {
    const result = await invokeCommand<Skill>('install_skill', { name })
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to install skill')
    }
    
    set((state) => ({
      skills: [...state.skills, result.data!],
    }))
    
    return result.data
  },

  uninstallSkill: async (id: string) => {
    const result = await invokeCommand<void>('uninstall_skill', { id })
    if (!result.success) {
      throw new Error(result.error || 'Failed to uninstall skill')
    }
    
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== id),
    }))
  },

  updateSkillConfig: async (id: string, config: Record<string, unknown>) => {
    const result = await invokeCommand<Skill>('update_skill_config', { id, config })
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update skill config')
    }
    
    set((state) => ({
      skills: state.skills.map((s) => 
        s.id === id ? { ...s, config } : s
      ),
    }))
  },
}))
