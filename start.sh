#!/bin/zsh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PYTHON_BIN="${PYTHON_BIN:-$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3}"
NODE_BIN="${NODE_BIN:-$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node}"

if [ ! -f .env ]; then
  echo ".env is missing. Create it before starting the app."
  exit 1
fi

if ! PYTHONPATH=.python-packages "$PYTHON_BIN" -c "import faster_whisper" >/dev/null 2>&1; then
  echo "faster-whisper is not installed yet. Run ./install.sh first."
  exit 1
fi

PYTHONPATH=.python-packages "$NODE_BIN" --env-file=.env server.mjs
