/**
 * Tauri command invoker with error handling
 */
import { invoke } from '@tauri-apps/api/core'

export interface CommandResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Invoke a Tauri command with proper error handling
 * Tauri commands return Result<T, E> which auto-resolves to T or throws
 */
export async function invokeCommand<T>(
  cmd: string,
  args: Record<string, unknown> = {}
): Promise<CommandResponse<T>> {
  try {
    const data = await invoke<T>(cmd, args)
    return { success: true, data }
  } catch (error) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else {
      errorMessage = JSON.stringify(error)
    }
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Get the application version
 */
export async function getVersion(): Promise<string> {
  return invoke<string>('get_version')
}

/**
 * Get current configuration
 */
export async function getConfig<T = unknown>() {
  return invokeCommand<T>('get_config')
}

/**
 * Update configuration
 */
export async function updateConfig(config: unknown) {
  return invokeCommand<void>('update_config', { config })
}

/**
 * List all sessions
 */
export async function listSessions() {
  return invokeCommand<unknown[]>('list_sessions')
}

/**
 * Create a new session
 */
export async function createSession(name: string) {
  return invokeCommand<unknown>('create_session', { name })
}

/**
 * Get a specific session
 */
export async function getSession(sessionId: string) {
  return invokeCommand<unknown>('get_session', { sessionId })
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string) {
  return invokeCommand<void>('delete_session', { sessionId })
}

/**
 * Get messages for a session
 */
export async function getMessages(sessionId: string) {
  return invokeCommand<unknown[]>('get_messages', { sessionId })
}

/**
 * Send a message
 */
export async function sendMessage(sessionId: string, content: string) {
  return invokeCommand<void>('send_message', { sessionId, content })
}

/**
 * Stream AI response
 */
export async function streamResponse(sessionId: string, prompt: string) {
  return invokeCommand<void>('stream_response', { sessionId, prompt })
}

/**
 * Execute a tool
 */
export async function executeTool(toolName: string, arguments_: unknown) {
  return invokeCommand<unknown>('execute_tool', {
    tool_name: toolName,
    arguments: arguments_,
  })
}
