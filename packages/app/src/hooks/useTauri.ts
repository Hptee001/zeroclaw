/**
 * React hooks for ZeroClaw Desktop
 */
import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { StreamChunk, Message } from '../types'

/**
 * Get the application version
 */
export function useVersion() {
  return useQuery({
    queryKey: ['version'],
    queryFn: () => invoke<string>('get_version'),
    staleTime: Infinity,
  })
}

/**
 * Get configuration with auto-refresh on updates
 */
export function useConfig() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let cleanup: (() => void) | null = null

    listen('config_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['config'] })
    }).then((fn) => {
      cleanup = fn
    })

    return () => {
      cleanup?.()
    }
  }, [queryClient])

  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const result = await invoke<{ success: boolean; data?: unknown; error?: string }>(
        'get_config'
      )
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

/**
 * Manage sessions
 */
export function useSessions() {
  const queryClient = useQueryClient()

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const result = await invoke<{ success: boolean; data?: unknown[]; error?: string }>(
        'list_sessions'
      )
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await invoke<{ success: boolean; data?: unknown; error?: string }>(
        'create_session',
        { name }
      )
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await invoke<{ success: boolean; error?: string }>('delete_session', {
        session_id: sessionId,
      })
      if (!result.success) {
        throw new Error(result.error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  return {
    sessions,
    isLoading,
    createSession: createMutation.mutateAsync,
    deleteSession: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

/**
 * Manage messages in a session
 */
export function useMessages(sessionId: string | null) {
  const queryClient = useQueryClient()

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return []
      const result = await invoke<{ success: boolean; data?: Message[]; error?: string }>(
        'get_messages',
        { session_id: sessionId }
      )
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    enabled: !!sessionId,
  })

  const sendMutation = useMutation({
    mutationFn: async ({ session_id, content }: { session_id: string; content: string }) => {
      const result = await invoke<{ success: boolean; error?: string }>('send_message', {
        session_id,
        content,
      })
      if (!result.success) {
        throw new Error(result.error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] })
    },
  })

  return {
    messages,
    isLoading,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  }
}

/**
 * Subscribe to streaming events
 */
export function useStream(onChunk?: (chunk: StreamChunk) => void) {
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    let cleanup: (() => void) | null = null

    const setupStream = async () => {
      cleanup = await listen('stream_chunk', (event) => {
        const chunk = event.payload as StreamChunk
        if (chunk && chunk.type) {
          if (chunk.type === 'done') {
            setIsStreaming(false)
          } else {
            setIsStreaming(true)
            onChunk?.(chunk)
          }
        }
      })
    }

    setupStream()

    return () => {
      cleanup?.()
    }
  }, [onChunk])

  return { isStreaming }
}

/**
 * Execute a tool
 */
export function useExecuteTool() {
  return useMutation({
    mutationFn: async ({ toolName, args }: { toolName: string; args: unknown }) => {
      const result = await invoke<{ success: boolean; data?: unknown; error?: string }>(
        'execute_tool',
        {
          tool_name: toolName,
          arguments: args,
        }
      )
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}
