// Local type definitions for the app
// These mirror the shared types but avoid the dependency for now

export interface Message {
  id: string
  session_id: string
  role: string
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

export interface Session {
  id: string
  name: string
  created_at: string
  updated_at: string
  message_count: number
}

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
  type: string
  name: string
  api_key?: string
  base_url?: string
  model: string
  enabled: boolean
}

export interface ChannelConfig {
  type: string
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
  type: string
  path?: string
  embedding_model?: string
}

export interface SecurityConfig {
  policy_enabled: boolean
  require_approval_for: string[]
  webhook_secret?: string
}

export interface StreamChunk {
  type: string
  content?: string
  data?: unknown
}

export interface AppState {
  status: 'initializing' | 'ready' | 'error'
  config?: Config
  current_session?: Session
  error?: string
}
