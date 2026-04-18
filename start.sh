#!/bin/zsh

set -e

cd /Users/grobles/Documents/Codex/2026-04-18-i-want-to-build-an-app

PYTHON_BIN=/Users/grobles/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
NODE_BIN=/Users/grobles/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node

if [ ! -f .env ]; then
  echo ".env is missing. Create it before starting the app."
  exit 1
fi

if ! PYTHONPATH=.python-packages $PYTHON_BIN -c "import faster_whisper" >/dev/null 2>&1; then
  echo "faster-whisper is not installed yet. Run ./install.sh first."
  exit 1
fi

PYTHONPATH=.python-packages $NODE_BIN --env-file=.env server.mjs
