#!/bin/bash
# Ralph Loop for Tower Defense Game
# Usage: ./ralph.sh [max_iterations]

MAX_ITERATIONS=${1:-20}
GAME_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_FILE="$GAME_DIR/PROMPT.md"
PRD_FILE="$GAME_DIR/prd.json"

echo "🔄 Ralph Loop — Tower Defense"
echo "   Max iterations: $MAX_ITERATIONS"
echo "   Game dir: $GAME_DIR"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  # Check if all items pass
  REMAINING=$(python3 -c "
import json
with open('$PRD_FILE') as f:
    prd = json.load(f)
remaining = [s for s in prd['stories'] if not s['passes']]
print(len(remaining))
if remaining:
    print(f\"Next: [{remaining[0]['id']}] {remaining[0]['title']}\")
else:
    print('ALL DONE')
")

  COUNT=$(echo "$REMAINING" | head -1)
  NEXT=$(echo "$REMAINING" | tail -1)

  if [ "$COUNT" = "0" ]; then
    echo "✅ All PRD items pass! Done in $i iterations."
    exit 0
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 Iteration $i/$MAX_ITERATIONS — $COUNT items remaining"
  echo "   $NEXT"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Run Claude Code with the prompt
  cd "$GAME_DIR"
  claude -p "$(cat "$PROMPT_FILE")" \
    --allowedTools Edit,Write,Read,Bash,Grep,Glob

  echo ""
  echo "💤 Iteration $i complete. Pausing 3s..."
  sleep 3
done

echo "⚠️  Max iterations ($MAX_ITERATIONS) reached."
echo "   Check prd.json for remaining items."
