#!/bin/zsh

set -e

cd /Users/grobles/Documents/Codex/2026-04-18-i-want-to-build-an-app

PYTHON_BIN=/Users/grobles/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3

mkdir -p .python-packages
$PYTHON_BIN -m pip install --target .python-packages faster-whisper
