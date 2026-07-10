#!/usr/bin/env bash
# Deploy a preview build and point a stable alias at it (for Kevin / QA).
# Usage: ./scripts/deploy-staging.sh
# Requires: vercel CLI logged in; STAGING_ALIAS env optional (default below).

set -euo pipefail

SCOPE="${VERCEL_SCOPE:-flex26}"
ALIAS="${STAGING_ALIAS:-rove-staging.vercel.app}"

echo "Deploying preview to scope: $SCOPE"
OUTPUT="$(vercel deploy --scope "$SCOPE" --yes 2>&1)"
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
