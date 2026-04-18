#!/bin/zsh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PYTHON_BIN="${PYTHON_BIN:-$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3}"

mkdir -p .python-packages
"$PYTHON_BIN" -m pip install --target .python-packages faster-whisper
