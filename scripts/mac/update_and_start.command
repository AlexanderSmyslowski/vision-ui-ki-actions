#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$REPO_DIR"

echo "== Vision UI Actions =="
echo "Repo: $REPO_DIR"

echo "\n[1/4] Git status"
git status --porcelain || true

echo "\n[2/4] Git pull (fast-forward only)"
# If there are local changes, this may fail; that's intentional to avoid overwriting.
git pull --ff-only

echo "\n[3/4] Install deps (if needed)"
if [[ ! -d node_modules ]]; then
  npm install
fi

echo "\n[4/4] Start server"
open "mac/Vision UI Actions.app"

echo "\nDone."
