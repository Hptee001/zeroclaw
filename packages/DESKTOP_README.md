# ZeroClaw Desktop

> Zero overhead. Zero compromise. 100% Rust. The fastest, smallest AI assistant - now with a native desktop UI.

## Features

- 🚀 **Native Performance** - Built with Rust + Tauri v2
- 🔒 **Secure by Default** - Sandboxed execution, permission controls
- 📦 **Sidecar Mode** - Leverages existing CLI as subprocess
- 🎨 **Modern UI** - React + Tailwind CSS
- ⚡ **Real-time Streaming** - Live AI response streaming
- 🔔 **System Tray** - Quick access from menu bar
- 🔗 **Deep Links** - `zeroclaw://` protocol support
- 🔄 **Auto Updates** - Seamless updates via GitHub Releases

## Installation

### macOS
```bash
# Download from Releases
# Or build from source:
pnpm tauri build
```

### Windows
```bash
# Download MSI or EXE from Releases
pnpm tauri build
```

### Linux
```bash
# Debian/Ubuntu
sudo apt install ./zeroclaw_*.deb

# Or use AppImage
chmod +x zeroclaw_*.AppImage
./zeroclaw_*.AppImage
```

## Development

### Prerequisites

- Rust >= 1.87
- Node.js >= 20
- pnpm >= 10

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run type checks
pnpm typecheck
```

### Project Structure

```
zeroclaw/
├── packages/
│   ├── app/              # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   ├── desktop/          # Tauri backend
│   │   ├── src-tauri/
│   │   │   ├── src/
│   │   │   │   ├── commands.rs
│   │   │   │   ├── sidecar.rs
│   │   │   │   ├── tray.rs
│   │   │   │   └── types.rs
│   │   │   └── Cargo.toml
│   │   └── package.json
│   │
│   └── shared/           # Shared types
│       └── src/
│           ├── types.ts
│           └── utils.ts
│
├── .github/workflows/    # CI/CD
└── docs/                 # Documentation
```

## Architecture

### Frontend (React)
- **State Management**: Zustand + TanStack Query
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4
- **IPC**: Tauri Commands + Events

### Backend (Rust)
- **Runtime**: Tokio async
- **IPC**: Tauri v2 Commands
- **Sidecar**: CLI subprocess manager
- **Types**: ts-rs for TypeScript generation

### Communication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │ ──────► │   Tauri      │ ──────► │   Rust      │
│   Components│  invoke │   Commands   │  exec   │   Backend   │
└─────────────┘         └──────────────┘         └─────────────┘
       ▲                        │                      │
       │                        │                      │
       │         emit           │                      │
       └────────────────────────┴──────────────────────┘
                    Events
```

## Configuration

### Environment Variables

```bash
# Development
VITE_ALLOWED_HOSTS=localhost,127.0.0.1

# Production (set in CI)
TAURI_SIGNING_PRIVATE_KEY=...
APPLE_ID=...
```

### Config File

Location: `~/.config/zeroclaw/config.toml`

```toml
[providers.anthropic]
api_key = "sk-..."
model = "claude-sonnet-4-5-20250929"

[tools]
shell_enabled = true
file_read_enabled = true
```

## API Reference

### Tauri Commands

| Command | Description |
|---------|-------------|
| `get_version` | Get app version |
| `get_config` | Get current configuration |
| `update_config` | Update configuration |
| `list_sessions` | List all sessions |
| `create_session` | Create new session |
| `delete_session` | Delete a session |
| `get_messages` | Get messages for session |
| `send_message` | Send a message |
| `stream_response` | Stream AI response |
| `execute_tool` | Execute a tool |
| `start_sidecar` | Start CLI sidecar |
| `stop_sidecar` | Stop CLI sidecar |
| `sidecar_status` | Get sidecar status |

### Events

| Event | Payload |
|-------|---------|
| `config_updated` | Config |
| `session_created` | Session |
| `message_new` | Message |
| `stream_chunk` | StreamChunk |
| `tool_called` | { name, args } |

## Testing

```bash
# Run all tests
cargo test --workspace

# Frontend tests
pnpm test

# E2E tests (coming soon)
pnpm test:e2e
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Quick Start

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `cargo clippy` and `pnpm typecheck`
5. Submit a PR

## License

MIT or Apache-2.0

---

**Download**: [GitHub Releases](https://github.com/zeroclaw-labs/zeroclaw/releases)

**Documentation**: [docs/](./docs/)

**CLI Version**: [zeroclaw CLI](../../)
