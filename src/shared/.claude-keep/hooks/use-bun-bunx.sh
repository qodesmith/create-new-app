#!/usr/bin/env bash

cmd=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command // empty')

if echo "$cmd" | grep -qE '(^|\s)(node|npm|npx|node_modules/.bin)\s'; then
  echo "Use bun or bunx instead of node, npm, or npx. Replace node and npm with bun, npx with bunx." >&2
  exit 2
fi

exit 0
