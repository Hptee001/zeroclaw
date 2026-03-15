# ZeroClaw Desktop Release Guide

## Prerequisites

### 1. Generate Code Signing Keys

#### macOS
```bash
# Generate private key for Tauri updater
openssl genrsa -out private.key 2048
openssl rsa -in private.key -pubout -out public.key

# Base64 encode for GitHub secret
base64 -w 0 private.key  # Save as TAURI_SIGNING_PRIVATE_KEY
base64 -w 0 public.key   # Save as TAURI_SIGNING_PUBLIC_KEY
```

#### Windows (Optional - EV Certificate)
For production Windows releases, consider purchasing an EV certificate from:
- DigiCert
- Sectigo
- GlobalSign

### 2. Setup GitHub Secrets

Go to repository Settings → Secrets and variables → Actions:

```
TAURI_SIGNING_PRIVATE_KEY=<base64 encoded private key>
TAURI_SIGNING_PASSWORD=<your key password>
APPLE_ID=<your Apple ID for notarization>
APPLE_PASSWORD=<app-specific password>
APPLE_TEAM_ID=<your Apple Team ID>
```

## Release Process

### 1. Update Version

Update version in all files:

```bash
# packages/desktop/src-tauri/Cargo.toml
version = "0.3.1"

# packages/desktop/package.json
"version": "0.3.1"

# packages/app/package.json
"version": "0.3.1"

# package.json
"version": "0.3.1"
```

### 2. Create Release Tag

```bash
git add .
git commit -m "release: v0.3.1"
git tag -a v0.3.1 -m "ZeroClaw Desktop v0.3.1"
git push origin v0.3.1
```

### 3. GitHub Actions will:
- Build for macOS (x86_64 + aarch64)
- Build for Windows
- Build for Linux
- Create GitHub Release with all artifacts

### 4. Verify Release

Check the [Releases page](https://github.com/zeroclaw-labs/zeroclaw/releases) for:
- ✅ All platform binaries
- ✅ Release notes
- ✅ Checksums

## Manual Build (Local Testing)

```bash
# Development build
pnpm tauri dev

# Production build
pnpm tauri build

# Build with specific config
pnpm tauri build --config src-tauri/tauri.dev.conf.json
```

## Platform-Specific Notes

### macOS
- Notarization is required for distribution outside App Store
- Minimum version: macOS 10.15
- Supports both Intel and Apple Silicon

### Windows
- MSIs require code signing for SmartScreen
- NSIS installers are unsigned by default
- Windows 10+ recommended

### Linux
- Debian/Ubuntu: Use .deb packages
- Other distros: Use .AppImage
- Dependencies: webkit2gtk, libappindicator

## Auto-Update Configuration

The updater checks GitHub Releases for `latest.json`:

```json
{
  "version": "0.3.1",
  "notes": "Release notes...",
  "pub_date": "2024-01-01T00:00:00Z",
  "platforms": {
    "darwin-x86_64": { "signature": "", "url": "..." },
    "darwin-aarch64": { "signature": "", "url": "..." },
    "windows-x86_64": { "signature": "", "url": "..." },
    "linux-x86_64": { "signature": "", "url": "..." }
  }
}
```

## Troubleshooting

### Build fails on Linux
```bash
sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
```

### macOS notarization fails
- Check Apple ID credentials
- Ensure app-specific password is used
- Verify Team ID is correct

### Windows build too large
- Enable LTO in Cargo.toml
- Use `opt-level = "z"`
- Strip debug symbols
