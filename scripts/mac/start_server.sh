#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
PORT="${PORT:-8787}"

cd "$REPO_DIR"

# Install deps if needed
if [[ ! -d node_modules ]]; then
  npm install
fi

# Start dev server (foreground)
exec npm run dev -- --port "$PORT" 2>/dev/null || exec npm run dev
