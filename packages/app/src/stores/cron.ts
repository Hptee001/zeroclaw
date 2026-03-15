import { create } from 'zustand'
import { invokeCommand } from '@/lib/commands'

export type ScheduleType = 'interval' | 'daily' | 'weekly' | 'monthly' | 'once'

export interface CronJob {
  id: string
  name: string
  schedule: string
  schedule_type: ScheduleType
  command: string
  args?: Record<string, unknown>
  enabled: boolean
  last_run?: string
  next_run?: string
  last_status?: 'success' | 'failed' | 'running'
  created_at?: string
}

interface CronState {
  jobs: CronJob[]
  loading: boolean
  error: string | null
  fetchJobs: () => Promise<void>
  createJob: (job: Omit<CronJob, 'id'>) => Promise<CronJob>
  deleteJob: (id: string) => Promise<void>
  updateJob: (id: string, updates: Partial<CronJob>) => Promise<void>
  toggleJob: (id: string, enabled: boolean) => Promise<void>
  runJobNow: (id: string) => Promise<void>
  getJobHistory: (id: string, limit?: number) => Promise<JobRun[]>
}

export interface JobRun {
  id: string
  job_id: string
  started_at: string
  completed_at?: string
  status: 'success' | 'failed' | 'running'
  output?: string
  error?: string
}

export const useCronStore = create<CronState>((set) => ({
  jobs: [],
  loading: false,
  error: null,

  fetchJobs: async () => {
    set({ loading: true, error: null })
    try {
      const result = await invokeCommand<CronJob[]>('list_cron_jobs')
      if (result.success && result.data) {
        set({ jobs: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to fetch cron jobs', loading: false })
      }
    } catch (err) {
      set({ error: 'Failed to fetch cron jobs', loading: false })
    }
  },

  createJob: async (job: Omit<CronJob, 'id'>) => {
    const result = await invokeCommand<CronJob>('create_cron_job', job)
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create cron job')
    }
    
    set((state) => ({
      jobs: [...state.jobs, result.data!],
    }))
    
    return result.data
  },

  deleteJob: async (id: string) => {
    const result = await invokeCommand<void>('delete_cron_job', { id })
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete cron job')
    }
    
    set((state) => ({
      jobs: state.jobs.filter((j) => j.id !== id),
    }))
  },

  updateJob: async (id: string, updates: Partial<CronJob>) => {
    const result = await invokeCommand<CronJob>('update_cron_job', { id, updates })
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update cron job')
    }
    
    set((state) => ({
      jobs: state.jobs.map((j) => 
        j.id === id ? { ...j, ...updates } : j
      ),
    }))
    
    return result.data
  },

  toggleJob: async (id: string, enabled: boolean) => {
    await invokeCommand<void>('toggle_cron_job', { id, enabled })
    
    set((state) => ({
      jobs: state.jobs.map((j) => 
        j.id === id ? { ...j, enabled } : j
      ),
    }))
  },

  runJobNow: async (id: string) => {
    const result = await invokeCommand<void>('run_cron_job', { id })
    if (!result.success) {
      throw new Error(result.error || 'Failed to run cron job')
    }
    
    set((state) => ({
      jobs: state.jobs.map((j) => 
        j.id === id ? { ...j, last_status: 'running' as const } : j
      ),
    }))
  },

  getJobHistory: async (id: string, limit = 10) => {
    const result = await invokeCommand<JobRun[]>('get_cron_job_history', { id, limit })
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch job history')
    }
    return result.data
  },
}))
