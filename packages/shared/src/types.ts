// ZeroClaw Shared Types
// These types are mirrored from Rust via ts-rs generation
// Run: pnpm -F zeroclaw-desktop generate-types to update

/**
 * Application configuration
 */
export interface Config {
  identifier: string
  version: string
  providers: ProviderConfig[]
  channels: ChannelConfig[]
  tools: ToolConfig
  memory: MemoryConfig
  security: SecurityConfig
}

export interface ProviderConfig {
  type: 'anthropic' | 'openai' | 'zhipu' | 'ollama'
  name: string
  api_key?: string
  base_url?: string
  model: string
  enabled: boolean
}

export interface ChannelConfig {
  type: 'telegram' | 'discord' | 'slack' | 'matrix' | 'lark' | 'feishu'
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

/**
 * Session and Message types
 */
export interface Session {
  id: string
  name: string
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
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  tool_calls?: ToolCall[]
  usage?: UsageInfo
  error?: string
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

/**
 * Tool definitions
 */
export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  enabled: boolean
}

/**
 * Command response types
 */
export interface CommandResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done'
  content?: string
  data?: unknown
}

/**
 * App state
 */
export interface AppState {
  status: 'initializing' | 'ready' | 'error'
  config?: Config
  current_session?: Session
  error?: string
}

/**
 * Events from backend
 */
export type BackendEvent =
  | { type: 'config_updated'; config: Config }
  | { type: 'session_created'; session: Session }
  | { type: 'message_new'; message: Message }
  | { type: 'stream_chunk'; chunk: StreamChunk }
  | { type: 'tool_called'; tool_call: ToolCall }
  | { type: 'error'; error: string }
  | { type: 'status_change'; status: AppState['status'] }
