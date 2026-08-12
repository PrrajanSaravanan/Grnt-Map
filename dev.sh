#!/usr/bin/env bash
#
# Starts all three GrantWeave services and streams their logs together.
#   ml       :8000  FAISS semantic matcher (Discovery Agent tool)
#   backend  :3001  Express + the six agents
#   frontend :5173  Vite dev server (proxies /api to the backend)
#
# Frees the ports first, so a leftover process from an earlier run can't cause
# EADDRINUSE. Ctrl-C stops everything.

set -uo pipefail
cd "$(dirname "$0")"

PORTS=(8000 3001 5173)
PIDS=()

cleanup() {
  echo ""
  echo "Shutting down…"
  for pid in "${PIDS[@]:-}"; do
    [ -n "${pid:-}" ] && kill "$pid" 2>/dev/null
  done
  for port in "${PORTS[@]}"; do
    lsof -ti:"$port" -sTCP:LISTEN 2>/dev/null | xargs -r kill 2>/dev/null
  done
  exit 0
}
trap cleanup INT TERM

echo "Freeing ports ${PORTS[*]}…"
for port in "${PORTS[@]}"; do
  lsof -ti:"$port" -sTCP:LISTEN 2>/dev/null | xargs -r kill 2>/dev/null
done
sleep 1

# --- preflight ---
if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env is missing. Copy backend/.env.example and add your Gemini key."
  exit 1
fi
if ! grep -qE '^GEMINI_API_KEYS?=.+' backend/.env; then
  echo "ERROR: no GEMINI_API_KEY / GEMINI_API_KEYS set in backend/.env — the agents cannot run."
  exit 1
fi

PY=ml/venv/bin/python
if [ ! -x "$PY" ]; then
  echo "WARNING: ml/venv not found; skipping the semantic matcher."
  echo "         Create it with: python3 -m venv ml/venv && ml/venv/bin/pip install -r ml/requirements.txt"
  PY=""
fi
if [ ! -f ml/grant_index.faiss ]; then
  echo "WARNING: ml/grant_index.faiss missing. Build it with:"
  echo "         cd ml && ./venv/bin/python build_index.py"
fi

wait_for() { # url, label, attempts
  for _ in $(seq 1 "$3"); do
    curl -sf "$1" >/dev/null 2>&1 && echo "  ✓ $2 ready" && return 0
    sleep 1
  done
  echo "  ✗ $2 did not come up — check the log above"
  return 1
}

# --- ml ---
if [ -n "$PY" ]; then
  echo "Starting ML matcher on :8000…"
  ( cd ml && exec ../"$PY" -m uvicorn app:app --port 8000 ) 2>&1 | sed 's/^/[ml]       /' &
  PIDS+=($!)
  wait_for http://localhost:8000/health "ML matcher" 60
fi

# --- backend ---
echo "Starting backend on :3001…"
( cd backend && exec npx tsx server.ts ) 2>&1 | sed 's/^/[backend]  /' &
PIDS+=($!)
wait_for http://localhost:3001/api/health "Backend" 30

# --- frontend ---
echo "Starting frontend on :5173…"
( cd frontend && exec npx vite ) 2>&1 | sed 's/^/[frontend] /' &
PIDS+=($!)
wait_for http://localhost:5173 "Frontend" 30

echo ""
echo "───────────────────────────────────────────"
echo "  GrantWeave running → http://localhost:5173"
echo "  Ctrl-C to stop all three services"
echo "───────────────────────────────────────────"
echo ""

wait
