#!/usr/bin/env bash
# Deterministic web deploy for a given EAS environment.
#
# Why this script exists: EXPO_PUBLIC_* values (e.g. the Supabase URL/key) are baked
# into the client bundle by Metro at `expo export` time — and Metro's cache does NOT
# bust when only env values change. Deploying staging vs production with different
# databases therefore requires: pull that environment's vars, CLEAR the Metro cache,
# export, then deploy. Skipping the cache clear silently ships the wrong database.
#
# Usage:
#   EXPO_TOKEN=... ./scripts/deploy.sh staging      # -> preview env, alias camino--staging
#   EXPO_TOKEN=... ./scripts/deploy.sh production    # -> production env, getcamino.app
set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="${1:-}"
case "$TARGET" in
  staging)    EAS_ENV=preview;    DEPLOY_FLAGS=(--environment preview --alias staging) ;;
  production) EAS_ENV=production; DEPLOY_FLAGS=(--prod --environment production) ;;
  *) echo "usage: $0 {staging|production}"; exit 1 ;;
esac

echo "▸ Pulling '$EAS_ENV' env vars into .env.local (EXPO_PUBLIC_* + secrets)…"
npx eas-cli env:pull "$EAS_ENV" --path .env.local --non-interactive

echo "▸ Which Supabase project will be baked in:"
grep -E 'EXPO_PUBLIC_SUPABASE_URL' .env.local || true

echo "▸ Exporting web bundle with a CLEARED Metro cache (critical — see header)…"
rm -rf dist
npx expo export --platform web --clear

echo "▸ Deploying to $TARGET…"
npx eas-cli deploy "${DEPLOY_FLAGS[@]}"

echo "▸ Cleaning up .env.local (leaves your local dev .env untouched)…"
rm -f .env.local

echo "✓ Deployed $TARGET."
