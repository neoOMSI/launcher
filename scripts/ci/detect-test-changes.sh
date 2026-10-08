#!/usr/bin/env bash
# Detect whether changes between commits/refs require running the tests.
set -euo pipefail

EVENT_NAME="${EVENT_NAME:-}"
PR_BASE="${PR_BASE:-}"
PR_HEAD="${PR_HEAD:-}"
PUSH_BEFORE="${PUSH_BEFORE:-}"
PUSH_HEAD="${PUSH_HEAD:-}"
GITHUB_OUTPUT="${GITHUB_OUTPUT:-/dev/null}"

if [ "$EVENT_NAME" = "workflow_dispatch" ]; then
  echo "run-tests=true" >> "$GITHUB_OUTPUT"
  echo "Manual run: tests required."
  exit 0
fi

if [ "$EVENT_NAME" = "pull_request" ]; then
  range="$PR_BASE...$PR_HEAD"
elif [ "$EVENT_NAME" = "push" ]; then
  if [ -z "$PUSH_BEFORE" ] || [ "$PUSH_BEFORE" = "0000000000000000000000000000000000000000" ]; then
    echo "run-tests=true" >> "$GITHUB_OUTPUT"
    echo "No usable previous revision: tests required."
    exit 0
  fi
  range="$PUSH_BEFORE..$PUSH_HEAD"
else
  echo "run-tests=true" >> "$GITHUB_OUTPUT"
  echo "Unknown event type: tests required."
  exit 0
fi

echo "Checking changes in $range"
changed="$(git diff --name-only "$range")"

echo "Changed files:"
printf '%s\n' "$changed"

if printf '%s\n' "$changed" | grep -Eq \
  '^(src/|electron/|build/|assets/|index\.html$|package\.json$|pnpm-lock\.yaml$|pnpm-workspace\.yaml$|tsconfig[^/]*\.json$|vite[^/]*\.ts$|vitest\.config\.ts$|electron-builder\.yml$|\.prettier[^/]*$|\.github/workflows/test\.yml$|scripts/ci/)'
then
  echo "run-tests=true" >> "$GITHUB_OUTPUT"
  echo "Test-relevant changes detected."
else
  echo "run-tests=false" >> "$GITHUB_OUTPUT"
  echo "No test-relevant changes detected."
fi
