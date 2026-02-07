#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Vision UI Actions"
REPO_SSH="git@github.com:AlexanderSmyslowski/vision-ui-ki-actions.git"
APP_SUPPORT_DIR="$HOME/Library/Application Support/${APP_NAME}"
APP_BUNDLE_SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/mac/${APP_NAME}.app"
APP_BUNDLE_DST="/Applications/${APP_NAME}.app"

echo "== ${APP_NAME} Installer =="

echo "[1/4] Ensure app support dir: ${APP_SUPPORT_DIR}"
mkdir -p "$APP_SUPPORT_DIR"

if [[ ! -d "$APP_SUPPORT_DIR/.git" ]]; then
  echo "[2/4] Clone repo into Application Support"
  git clone "$REPO_SSH" "$APP_SUPPORT_DIR"
else
  echo "[2/4] Update repo (git pull --ff-only)"
  (cd "$APP_SUPPORT_DIR" && git pull --ff-only)
fi

echo "[3/4] Install app bundle into /Applications"
if [[ -d "$APP_BUNDLE_DST" ]]; then
  echo "  Removing existing: $APP_BUNDLE_DST"
  rm -rf "$APP_BUNDLE_DST"
fi
cp -R "$APP_BUNDLE_SRC_DIR" "$APP_BUNDLE_DST"

echo "[4/4] Done"
echo "You can now launch it from /Applications: ${APP_NAME}.app"
