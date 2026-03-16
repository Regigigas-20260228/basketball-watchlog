#!/bin/bash
COMMAND=$(jq -r '.tool_input.command' < /dev/stdin)

if echo "$COMMAND" | grep -Eq 'rm -rf|git push|chmod 777|sudo '; then
  echo "Blocked: dangerous command is not allowed" >&2
  exit 2
fi

if echo "$COMMAND" | grep -q 'prod'; then
  echo "Blocked: production access is not allowed" >&2
  exit 2
fi

exit 0
