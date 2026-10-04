#!/bin/bash
# Installs the motion-studio toolchain in Claude Code on the web sessions:
# ffmpeg, the Python audio-analysis venv, Node deps, and the claude-animation plugin.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# ffmpeg: encoding, muxing, audio extraction
if ! command -v ffmpeg >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  # Some third-party apt sources are blocked by the proxy; the Ubuntu archive is enough.
  apt-get update -qq || true
  apt-get install -y -qq ffmpeg >/dev/null
fi

# Python audio analysis. Ubuntu's system Python is externally managed, so use a venv.
[ -x .venv/bin/python ] || python3 -m venv .venv
.venv/bin/pip install -q --disable-pip-version-check -r requirements.txt

# Playwright is pinned to the Chromium pre-installed in /opt/pw-browsers.
# Never run `playwright install` here.
npm install --no-audit --no-fund --loglevel=error

# Remotion project. It renders with the same pre-installed headless shell (see remotion/remotion.config.ts).
(cd remotion && npm install --no-audit --no-fund --loglevel=error)

# claude-animation plugin (hand-drawn rigs, pens, synthesized sound) and its canvas dependency.
# Non-fatal so a GitHub hiccup doesn't block the session.
if claude plugin marketplace add buildwithhanif/claude-animation-skill --scope project >/dev/null &&
  claude plugin install claude-animation@claude-animation-skill --scope project >/dev/null; then
  for dir in "$HOME"/.claude/plugins/cache/claude-animation-skill/claude-animation/*/skills/claude-animation; do
    if [ -f "$dir/package.json" ]; then
      (cd "$dir" && npm install --no-audit --no-fund --loglevel=error)
    fi
  done
else
  echo "warning: claude-animation plugin install failed; re-run .claude/hooks/session-start.sh to retry" >&2
fi

# Make the venv's python the default for the session.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$CLAUDE_PROJECT_DIR/.venv/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi
