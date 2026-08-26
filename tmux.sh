#!/usr/bin/env bash
set -euo pipefail

SESSION="cheesefrog"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux attach -t "$SESSION"
  exit 0
fi

tmux new-session -d -s "$SESSION" -n editor -c "$ROOT"
tmux send-keys -t "$SESSION:editor" "nvim" C-m

tmux new-window -t "$SESSION" -n dev -c "$ROOT/web"
tmux send-keys -t "$SESSION:dev" "bun run dev" C-m

tmux new-window -t "$SESSION" -n supabase -c "$ROOT/supabase"
tmux send-keys -t "$SESSION:supabase" "supabase start" C-m

tmux select-window -t "$SESSION:editor"
tmux attach -t "$SESSION"
