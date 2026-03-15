# ZeroClaw Desktop 功能实现计划

## 概述

本文档说明如何实现所有前端页面的完整功能，包括与 Rust 后端的 API 集成。

## Stores 已创建

所有 Zustand stores 已在 `packages/app/src/stores/` 目录中创建：

- `agents.ts` - Agent 管理
- `channels.ts` - 渠道配置
- `models.ts` - 模型和用量统计
- `skills.ts` - 技能管理
- `cron.ts` - 定时任务
- `chat.ts` - 聊天会话和消息
- `config.ts` - 应用配置
- `gateway.ts` - Gateway 状态
- `settings.ts` - 用户设置

## 需要实现的 Rust Commands

在 `packages/desktop/src-tauri/src/commands.rs` 中添加以下命令：

### Agents 相关

```rust
#[tauri::command]
pub async fn list_agents(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<Agent>, String>

#[tauri::command]
pub async fn create_agent(state: State<'_, Arc<Mutex<AppState>>>, name: String) -> Result<Agent, String>

#[tauri::command]
pub async fn delete_agent(state: State<'_, Arc<Mutex<AppState>>>, id: String) -> Result<(), String>

#[tauri::command]
pub async fn update_agent(state: State<'_, Arc<Mutex<AppState>>>, id: String, updates: Partial<Agent>) -> Result<Agent, String>
```

### Channels 相关

```rust
#[tauri::command]
pub async fn list_channels() -> Result<Vec<Channel>, String>
#[tauri::command]
pub async fn add_channel(channel_type: String, config: Value) -> Result<Channel, String>
#[tauri::command]
pub async fn delete_channel(id: String) -> Result<(), String>
#[tauri::command]
pub async fn test_channel(id: String) -> Result<bool, String>
```

### Models/Providers 相关

```rust
#[tauri::command]
pub async fn list_providers() -> Result<Vec<Provider>, String>
#[tauri::command]
pub async fn get_usage(window: String) -> Result<Vec<ModelUsage>, String>
#[tauri::command]
pub async fn test_provider(provider_type: String) -> Result<bool, String>
```

### Skills 相关

```rust
#[tauri::command]
pub async fn list_skills() -> Result<Vec<Skill>, String>
#[tauri::command]
pub async fn toggle_skill(id: String, enabled: bool) -> Result<(), String>
#[tauri::command]
pub async fn install_skill(name: String) -> Result<Skill, String>
#[tauri::command]
pub async fn uninstall_skill(id: String) -> Result<(), String>
```

### Cron 相关

```rust
#[tauri::command]
pub async fn list_cron_jobs() -> Result<Vec<CronJob>, String>
#[tauri::command]
pub async fn create_cron_job(job: CronJobInput) -> Result<CronJob, String>
#[tauri::command]
pub async fn delete_cron_job(id: String) -> Result<(), String>
#[tauri::command]
pub async fn run_cron_job(id: String) -> Result<(), String>
#[tauri::command]
pub async fn get_cron_job_history(id: String, limit: u32) -> Result<Vec<JobRun>, String>
```

### Chat 相关

```rust
#[tauri::command]
pub async fn get_messages(session_id: String) -> Result<Vec<Message>, String>
#[tauri::command]
pub async fn stream_response(window: Window, session_id: String, prompt: String) -> Result<(), String>
```

## 实现步骤

### 1. 定义类型

在 `packages/desktop/src-tauri/src/types.rs` 中添加所有需要的类型：

```rust
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
pub struct Channel {
    pub id: String,
    #[serde(rename = "type")]
    pub channel_type: String,
    pub name: String,
    pub enabled: bool,
    pub status: String,
    pub config: serde_json::Value,
}

// ... 其他类型
```

### 2. 实现命令

在 `commands.rs` 中实现所有命令，每个命令都应该：
- 验证输入
- 操作状态或调用底层 API
- 返回 Result<T, String>

### 3. 注册命令

在 `lib.rs` 的 `invoke_handler` 中注册所有新命令：

```rust
.invoke_handler(tauri::generate_handler![
    // Agents
    commands::list_agents,
    commands::create_agent,
    commands::delete_agent,
    commands::update_agent,
    // Channels
    commands::list_channels,
    commands::add_channel,
    // ... 所有其他命令
])
```

### 4. 集成到页面

更新每个页面组件使用 stores：

```tsx
// 示例：Agents 页面
const { agents, loading, fetchAgents, createAgent, deleteAgent } = useAgentsStore()

useEffect(() => {
  void fetchAgents()
}, [fetchAgents])

const handleCreate = async (name: string) => {
  try {
    await createAgent(name)
    toast.success('Agent created')
  } catch (err) {
    toast.error('Failed to create agent')
  }
}
```

## 优先级

1. **高优先级** - 核心功能
   - Chat (消息发送/接收)
   - Config (配置管理)
   - Gateway (启动/停止)

2. **中优先级** - 常用功能
   - Agents (Agent 管理)
   - Channels (渠道配置)
   - Models (提供商配置)

3. **低优先级** - 增强功能
   - Skills (技能管理)
   - Cron (定时任务)
   - Settings (用户设置)

## 测试

每个 store 都应该有对应的测试：

```typescript
// stores/agents.test.ts
describe('useAgentsStore', () => {
  it('should fetch agents', async () => {
    const { fetchAgents } = useAgentsStore.getState()
    await fetchAgents()
    const { agents } = useAgentsStore.getState()
    expect(agents.length).toBeGreaterThan(0)
  })
})
```

## 下一步

1. 在 Rust 后端实现所有 commands
2. 更新前端页面使用 stores
3. 添加错误处理和加载状态
4. 实现实时事件订阅
5. 添加单元测试
