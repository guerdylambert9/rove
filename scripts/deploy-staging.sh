#!/usr/bin/env bash
# Deploy a preview build and point a stable alias at it (for Kevin / QA).
# Usage: ./scripts/deploy-staging.sh
# Requires: vercel CLI logged in to the Flex team that owns rove (org in .vercel/project.json).
# Optional: VERCEL_SCOPE=flex26  (Flex team slug)
# Optional: VERCEL_TOKEN=...     (token from Flex account → Settings → Tokens)

set -euo pipefail

ALIAS="${STAGING_ALIAS:-rove-staging.vercel.app}"
EXPECTED_ORG="${ROVE_VERCEL_ORG_ID:-team_W9vKgMZTQ6fAeJJdWPtWD0Cf}"

echo "Vercel identity:"
if ! vercel whoami 2>&1; then
  echo ""
  echo "Not logged in. Run: vercel login"
  echo "Use the Flex business account (not personal Guerdy Lambert)."
  exit 1
fi

echo ""
echo "Teams visible to this login:"
vercel teams ls 2>&1 || true

if [[ -f .vercel/project.json ]]; then
  LINKED_ORG="$(grep -o '"orgId": *"[^"]*"' .vercel/project.json | sed 's/.*"\([^"]*\)"$/\1/')"
  echo ""
  echo "Linked project org: $LINKED_ORG (expected Flex: $EXPECTED_ORG)"
fi

SCOPE="${VERCEL_SCOPE:-flex26}"

echo ""
echo "Deploying preview to scope: $SCOPE"
OUTPUT="$(vercel deploy --scope "$SCOPE" --yes 2>&1)" || {
  echo "$OUTPUT"
  echo ""
  echo "Deploy failed. Common fixes:"
  echo "  1. vercel logout && vercel login  (Flex account, e.g. flexmanagementgroup@gmail.com)"
  echo "  2. Or: export VERCEL_TOKEN=<token from Flex Vercel → Settings → Tokens>"
  echo "  3. Then: VERCEL_SCOPE=flex26 npm run deploy:staging"
  exit 1
}
echo "$OUTPUT"

# Preview deployment URL (not vercel.com dashboard links)
DEPLOY_URL="$(echo "$OUTPUT" | grep -oE 'https://[a-z0-9-]+-[a-z0-9-]+\.vercel\.app' | head -1)"

if [[ -z "$DEPLOY_URL" ]]; then
  echo "Could not read deployment URL from vercel output." >&2
  exit 1
fi

echo "Deployment: $DEPLOY_URL"
echo "Aliasing → https://$ALIAS"
vercel alias set "$DEPLOY_URL" "$ALIAS" --scope "$SCOPE"

echo ""
echo "Share with Kevin: https://$ALIAS"
echo "(Re-run this script after each dev session to update the alias.)"
