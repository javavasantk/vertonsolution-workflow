#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
port="${FASTAPI_TEST_PORT:-8123}"

PYTHONPATH=backend uvicorn app.main:app --host 127.0.0.1 --port "$port" >/tmp/verton-fastapi-health.log 2>&1 &
service_pid=$!
trap 'kill "$service_pid" 2>/dev/null || true; wait "$service_pid" 2>/dev/null || true' EXIT

for _ in $(seq 1 15); do
  if response=$(curl -fsS "http://127.0.0.1:${port}/health"); then
    test "$response" = '{"status":"ok","service":"verton-workforce-hub-fastapi"}'
    printf '%s\n' "$response"
    exit 0
  fi
  sleep 1
done

cat /tmp/verton-fastapi-health.log >&2
exit 1
