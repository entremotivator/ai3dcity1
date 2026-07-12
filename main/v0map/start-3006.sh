#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
rm -rf node_modules .next package-lock.json pnpm-lock.yaml yarn.lock
pnpm install
pnpm exec next dev -p 3006
