import { create } from 'zustand'
import { invokeCommand } from '@/lib/commands'

export interface ChatSession {
  id: string
  name: string
  agent_id?: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata?: {
    tool_calls?: ToolCall[]
    usage?: UsageInfo
    error?: string
  }
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: string
  error?: string
}

export interface UsageInfo {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string | null
  messages: Message[]
  loading: boolean
  sending: boolean
  error: string | null
  streamingMessage: Message | null
  fetchSessions: () => Promise<void>
  createSession: (name?: string, agentId?: string) => Promise<ChatSession>
  deleteSession: (id: string) => Promise<void>
  switchSession: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  clearError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  loading: false,
  sending: false,
  error: null,
  streamingMessage: null,

  fetchSessions: async () => {
    set({ loading: true, error: null })
    try {
      const result = await invokeCommand<ChatSession[]>('list_sessions')
      if (result.success && result.data) {
        set({ sessions: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to fetch sessions', loading: false })
      }
    } catch (err) {
      set({ error: 'Failed to fetch sessions', loading: false })
    }
  },

  createSession: async (name?: string, agentId?: string) => {
    const result = await invokeCommand<ChatSession>('create_session', { 
      name: name || 'New Chat',
      agent_id: agentId 
    })
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create session')
    }
    
    set((state) => ({
      sessions: [result.data!, ...state.sessions],
      currentSessionId: result.data!.id,
    }))
    
    return result.data
  },

  deleteSession: async (id: string) => {
    const result = await invokeCommand<void>('delete_session', { id })
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete session')
    }
    
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id)
      return {
        sessions: newSessions,
        currentSessionId: state.currentSessionId === id 
          ? (newSessions[0]?.id || null)
          : state.currentSessionId,
      }
    })
  },

  switchSession: async (id: string) => {
    set({ currentSessionId: id, loading: true })
    
    const result = await invokeCommand<Message[]>('get_messages', { session_id: id })
    if (result.success && result.data) {
      set({ messages: result.data, loading: false })
    } else {
      set({ messages: [], loading: false })
    }
  },

  sendMessage: async (content: string) => {
    const { currentSessionId } = get()
    if (!currentSessionId) {
      throw new Error('No active session')
    }

    set({ sending: true, error: null })

    // Add user message optimistically
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      session_id: currentSessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage],
    }))

    try {
      // Stream the response
      const result = await invokeCommand<void>('stream_response', {
        session_id: currentSessionId,
        prompt: content,
      })

      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to send message',
        sending: false 
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
