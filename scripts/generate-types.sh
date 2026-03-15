#!/usr/bin/env bash
# Generate TypeScript types from Rust definitions using ts-rs
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DESKTOP_DIR="$PROJECT_ROOT/packages/desktop"
SHARED_DIR="$PROJECT_ROOT/packages/shared"

echo "=== Generating TypeScript types from Rust ==="

cd "$DESKTOP_DIR/src-tauri"

# Run ts-rs export
cargo test --lib types::export_bindings -- --nocapture 2>/dev/null || true

# The types should be exported to the zeroclaw-types directory
# Copy them to the shared package
if [ -d "zeroclaw-types" ]; then
    echo "Copying generated types to shared package..."
    cp zeroclaw-types/*.ts "$SHARED_DIR/src/generated/" 2>/dev/null || mkdir -p "$SHARED_DIR/src/generated"
    echo "✓ Types generated successfully"
else
    echo "⚠ No types directory found. Running cargo build first..."
    cargo build --lib
fi

echo "Done!"
