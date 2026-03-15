#!/usr/bin/env bash
# Build ZeroClaw Desktop for all platforms
set -e

echo "=== ZeroClaw Desktop Build ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prereqs() {
    echo "Checking prerequisites..."
    
    if ! command -v cargo &> /dev/null; then
        echo -e "${RED}❌ Rust not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Rust: $(cargo --version)${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}⚠ pnpm not found, installing...${NC}"
        npm install -g pnpm
    fi
    echo -e "${GREEN}✓ pnpm: $(pnpm --version)${NC}"
    
    if ! cargo tauri --version &> /dev/null; then
        echo -e "${YELLOW}⚠ Tauri CLI not found, installing...${NC}"
        cargo install tauri-cli --version ^2.0.0
    fi
    echo -e "${GREEN}✓ Tauri CLI: $(cargo tauri --version)${NC}"
    
    echo ""
}

# Install dependencies
install_deps() {
    echo "Installing dependencies..."
    pnpm install
    echo ""
}

# Type check
typecheck() {
    echo "Running type checks..."
    pnpm typecheck
    echo ""
}

# Build frontend
build_frontend() {
    echo "Building frontend..."
    pnpm build:app
    echo ""
}

# Build Tauri app
build_tauri() {
    local target=$1
    
    if [ -n "$target" ]; then
        echo "Building Tauri app for $target..."
        pnpm tauri build --target "$target"
    else
        echo "Building Tauri app..."
        pnpm tauri build
    fi
    echo ""
}

# Show build results
show_results() {
    echo -e "${GREEN}=== Build Complete ===${NC}"
    echo ""
    echo "Artifacts location:"
    echo "  macOS:   packages/desktop/src-tauri/target/*/release/bundle/dmg/"
    echo "  Windows: packages/desktop/src-tauri/target/*/release/bundle/msi/"
    echo "  Linux:   packages/desktop/src-tauri/target/*/release/bundle/deb/"
    echo ""
}

# Main
main() {
    check_prereqs
    install_deps
    typecheck
    build_frontend
    
    case "${1:-native}" in
        all)
            echo -e "${YELLOW}Building for all platforms (this will take a while)...${NC}"
            build_tauri "x86_64-apple-darwin"
            build_tauri "aarch64-apple-darwin"
            build_tauri "x86_64-pc-windows-msvc"
            build_tauri "x86_64-unknown-linux-gnu"
            ;;
        macos)
            build_tauri "x86_64-apple-darwin"
            build_tauri "aarch64-apple-darwin"
            ;;
        windows)
            build_tauri "x86_64-pc-windows-msvc"
            ;;
        linux)
            build_tauri "x86_64-unknown-linux-gnu"
            ;;
        native)
            build_tauri ""
            ;;
        dev)
            echo -e "${YELLOW}Starting development mode...${NC}"
            pnpm dev
            exit 0
            ;;
        *)
            echo "Usage: $0 {all|macos|windows|linux|native|dev}"
            exit 1
            ;;
    esac
    
    show_results
}

main "$@"
