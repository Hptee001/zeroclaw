//! Shared types for ZeroClaw Desktop
//! These types are serialized to JSON for TypeScript consumption

use serde::{Deserialize, Serialize};

// ============================================================================
// Agent Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub channels: Option<Vec<String>>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInput {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentUpdate {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub channels: Option<Vec<String>>,
}

// ============================================================================
// Channel Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Channel {
    pub id: String,
    #[serde(rename = "type")]
    pub channel_type: String,
    pub name: String,
    pub enabled: bool,
    pub status: String,
    pub config: serde_json::Value,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelInput {
    #[serde(rename = "type")]
    pub channel_type: String,
    pub config: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelUpdate {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub config: Option<serde_json::Value>,
}

// ============================================================================
// Provider/Model Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Provider {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub name: String,
    pub enabled: bool,
    pub models: Vec<String>,
    pub api_key_set: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderUpdate {
    pub enabled: Option<bool>,
    pub api_key: Option<String>,
    pub models: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUsage {
    pub model: String,
    pub provider: String,
    pub tokens_used: u64,
    pub cost: f64,
    pub last_used: String,
}

// ============================================================================
// Skill Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub is_bundled: bool,
    pub source: Option<String>,
    pub author: Option<String>,
    pub version: Option<String>,
    pub config: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillInput {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillUpdate {
    pub enabled: Option<bool>,
    pub config: Option<serde_json::Value>,
}

// ============================================================================
// Cron Job Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ScheduleType {
    Interval,
    Daily,
    Weekly,
    Monthly,
    Once,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CronJob {
    pub id: String,
    pub name: String,
    pub schedule: String,
    pub schedule_type: ScheduleType,
    pub command: String,
    pub args: Option<serde_json::Value>,
    pub enabled: bool,
    pub last_run: Option<String>,
    pub next_run: Option<String>,
    pub last_status: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CronJobInput {
    pub name: String,
    pub schedule: String,
    pub schedule_type: ScheduleType,
    pub command: String,
    pub args: Option<serde_json::Value>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CronJobUpdate {
    pub name: Option<String>,
    pub schedule: Option<String>,
    pub command: Option<String>,
    pub args: Option<serde_json::Value>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobRun {
    pub id: String,
    pub job_id: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub status: String,
    pub output: Option<String>,
    pub error: Option<String>,
}

// ============================================================================
// Chat Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSession {
    pub id: String,
    pub name: String,
    pub agent_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub message_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub created_at: String,
    pub metadata: Option<MessageMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageMetadata {
    pub tool_calls: Option<Vec<ToolCall>>,
    pub usage: Option<UsageInfo>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
    pub result: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageInfo {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatInput {
    pub session_id: String,
    pub content: String,
}

// ============================================================================
// Config Types (existing)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub identifier: String,
    pub version: String,
    pub providers: Vec<ProviderConfig>,
    pub channels: Vec<ChannelConfig>,
    pub tools: ToolConfig,
    pub memory: MemoryConfig,
    pub security: SecurityConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    #[serde(alias = "type", rename = "provider_type")]
    pub provider_type: String,
    pub name: String,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub model: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelConfig {
    #[serde(rename = "type")]
    pub channel_type: String,
    pub enabled: bool,
    pub config: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolConfig {
    pub shell_enabled: bool,
    pub file_read_enabled: bool,
    pub file_write_enabled: bool,
    pub browser_enabled: bool,
    pub allowed_commands: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryConfig {
    #[serde(rename = "type")]
    pub memory_type: String,
    pub path: Option<String>,
    pub embedding_model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub policy_enabled: bool,
    pub require_approval_for: Vec<String>,
    pub webhook_secret: Option<String>,
}

// ============================================================================
// Gateway Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayStatus {
    pub state: String,
    pub pid: Option<u32>,
    pub port: Option<u32>,
    pub connected_at: Option<String>,
    pub version: Option<String>,
}

// ============================================================================
// Session Types (existing)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub message_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunk {
    #[serde(rename = "type")]
    pub chunk_type: String,
    pub content: Option<String>,
    pub data: Option<serde_json::Value>,
}
