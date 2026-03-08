#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <base-url>"
  echo "Example: $0 https://demo-bank-app.onrender.com"
  exit 1
fi

BASE_URL="${1%/}"

check() {
  local path="$1"
  local expected="${2:-200}"
  local code
  code=$(curl -sS -o /tmp/demobank_verify.out -w "%{http_code}" "$BASE_URL$path")
  if [ "$code" != "$expected" ]; then
    echo "[FAIL] $path -> expected $expected, got $code"
    echo "Response:"
    cat /tmp/demobank_verify.out
    exit 1
  fi
  echo "[OK]   $path -> $code"
}

check "/api/health" 200
check "/login.html" 200
check "/home.html" 200
check "/credit-card.html" 200
check "/api-docs/" 200

echo "All basic hosted checks passed."
