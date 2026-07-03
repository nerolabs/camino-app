#!/usr/bin/env bash
# Deterministic web deploy for a given EAS environment.
#
# Why this script exists: EXPO_PUBLIC_* values (e.g. the Supabase URL/key) are baked
# into the client bundle by Metro at `expo export` time -- and Metro's cache does NOT
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

echo "[deploy] Pulling '${EAS_ENV}' env vars into .env.local (EXPO_PUBLIC_ + secrets)..."
npx eas-cli env:pull "${EAS_ENV}" --path .env.local --non-interactive

# Load the pulled values into the actual shell environment. Metro inlines EXPO_PUBLIC_* from
# process.env with the HIGHEST priority — above every .env file — so this guarantees the target
# environment's values win over the local dev .env (which holds staging), instead of relying on
# .env-file precedence or a clean Metro cache. Without this, a plain `expo export` could bake the
# wrong database (observed: prod deployed with the staging Supabase after a back-to-back deploy).
set -a
# shellcheck source=/dev/null
source .env.local
set +a

echo "[deploy] Baking: EXPO_PUBLIC_ENV=${EXPO_PUBLIC_ENV:-<unset>}  SUPABASE=${EXPO_PUBLIC_SUPABASE_URL:-<unset>}"

echo "[deploy] Catalog audit (invariant 2: interview <-> catalog contract)..."
npm run --silent audit

echo "[deploy] Exporting web bundle with fully cleared caches (critical -- see header)..."
rm -rf dist node_modules/.cache
npx expo export --platform web --clear

echo "[deploy] Deploying to ${TARGET} ..."
npx eas-cli deploy "${DEPLOY_FLAGS[@]}"

echo "[deploy] Cleaning up .env.local (leaves your local dev .env untouched)..."
rm -f .env.local

echo "[deploy] Done: ${TARGET}."
