#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"
PUBLIC_LINK="$BACKEND_DIR/public"

# Build frontend
pushd "$FRONTEND_DIR" >/dev/null
pnpm install
pnpm run build
popd >/dev/null

# Replace backend/public with a symlink to frontend/dist
# If public exists and is not a symlink, remove it first to avoid ln errors.
if [ -e "$PUBLIC_LINK" ] && [ ! -L "$PUBLIC_LINK" ]; then
  rm -rf "$PUBLIC_LINK"
fi
ln -sfn "$FRONTEND_DIR/dist" "$PUBLIC_LINK"

# Run backend
cd "$BACKEND_DIR"
cargo run --release
