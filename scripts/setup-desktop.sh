#!/usr/bin/env bash
set -e

echo "=== ZeroClaw Desktop Setup ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Rust
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust/Cargo not found. Please install from https://rustup.rs/"
    exit 1
fi
echo "✓ Rust: $(cargo --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js: $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing..."
    npm install -g pnpm
fi
echo "✓ pnpm: $(pnpm --version)"

# Check Tauri CLI
echo ""
echo "Checking Tauri CLI..."
if ! cargo tauri --version &> /dev/null; then
    echo "Installing Tauri CLI (this may take a few minutes)..."
    cargo install tauri-cli --version ^2.0.0
else
    echo "✓ Tauri CLI: $(cargo tauri --version)"
fi

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
pnpm install

# Generate icons (if rsvg-convert is available)
echo ""
echo "Generating app icons..."
if command -v rsvg-convert &> /dev/null; then
    ICON_DIR="packages/desktop/src-tauri/icons"
    rsvg-convert -w 32 -h 32 "$ICON_DIR/icon.svg" -o "$ICON_DIR/32x32.png"
    rsvg-convert -w 128 -h 128 "$ICON_DIR/icon.svg" -o "$ICON_DIR/128x128.png"
    rsvg-convert -w 256 -h 256 "$ICON_DIR/icon.svg" -o "$ICON_DIR/128x128@2x.png"
    rsvg-convert -w 512 -h 512 "$ICON_DIR/icon.svg" -o "$ICON_DIR/icon.png"
    echo "✓ Icons generated"
else
    echo "⚠ rsvg-convert not found. Icons will use placeholders."
    echo "  Install librsvg to generate proper icons:"
    echo "  - macOS: brew install librsvg"
    echo "  - Linux: apt install librsvg2-bin"
fi

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "To start development:"
echo "  pnpm dev"
echo ""
echo "To build for production:"
echo "  pnpm build"
echo ""
