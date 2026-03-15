# ZeroClaw Desktop Development

## Prerequisites

- **Rust** >= 1.87 (see root `Cargo.toml`)
- **Node.js** >= 20.x
- **pnpm** >= 10.x
- **Tauri CLI** (will be installed automatically)

## Project Structure

```
zeroclaw/
├── packages/
│   ├── app/              # React + Vite frontend
│   │   ├── src/
│   │   ├── index.html
│   │   └── package.json
│   └── desktop/          # Tauri desktop wrapper
│       ├── src-tauri/    # Rust backend
│       └── package.json
├── pnpm-workspace.yaml
└── package.json          # Root workspace
```

## Development

### Install Dependencies

```bash
pnpm install
```

### Start Development Server

```bash
# Starts both frontend and Tauri app
pnpm dev

# Or separately:
pnpm dev:app      # Frontend only (Vite)
pnpm tauri dev    # Tauri app (will start frontend automatically)
```

### Build

```bash
# Build for production
pnpm build

# Or separately:
pnpm build:app       # Frontend only
pnpm build:desktop   # Full Tauri build
```

### Type Checking

```bash
pnpm typecheck
```

## Architecture

### Frontend (packages/app)

- **React 18** + TypeScript
- **Vite** for bundling
- **Tailwind CSS 4** for styling
- **React Router 7** for routing
- **Zustand** for state management
- **TanStack Query** for data fetching

### Backend (packages/desktop/src-tauri)

- **Tauri v2** for desktop runtime
- **Tokio** for async runtime
- **serde** for serialization

### Communication

Frontend ↔ Backend communication via Tauri Commands:

```typescript
// Frontend
import { invoke } from '@tauri-apps/api/core'
const result = await invoke('greet', { name: 'World' })
```

```rust
// Backend
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

## Adding Tauri Plugins

1. Add to `packages/desktop/src-tauri/Cargo.toml`:
```toml
[dependencies]
tauri-plugin-dialog = "2"
```

2. Initialize in `packages/desktop/src-tauri/src/lib.rs`:
```rust
.plugin(tauri_plugin_dialog::init())
```

3. Use in frontend:
```typescript
import { open } from '@tauri-apps/plugin-dialog'
```

## Debugging

### Frontend

Open DevTools in Tauri app: `Ctrl+Shift+I` (Linux/Windows) or `Cmd+Option+I` (macOS)

### Backend

```bash
# Enable logging
RUST_LOG=debug pnpm dev
```

## Common Issues

### Port already in use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Tauri build fails

```bash
# Clean and rebuild
cargo clean -p zeroclaw-desktop
pnpm tauri dev
```

### Frontend not reloading

```bash
# Restart dev server
pnpm dev:app
```

## Next Steps

- [ ] Add real app icons (see `packages/desktop/src-tauri/icons/`)
- [ ] Implement core Tauri commands
- [ ] Set up auto-update infrastructure
- [ ] Configure code signing for production builds
