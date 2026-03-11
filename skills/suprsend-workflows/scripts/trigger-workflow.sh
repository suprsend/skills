#!/usr/bin/env bash
# Trigger a SuprSend workflow via the REST API
# Usage: ./trigger-workflow.sh <workflow-slug> <distinct-id> [data-json]
#
# Environment variables:
#   SUPRSEND_WORKSPACE_KEY    - Your workspace key (required)
#   SUPRSEND_WORKSPACE_SECRET - Your workspace secret (required)
#   SUPRSEND_BASE_URL         - API base URL (default: https://hub.suprsend.com)

set -euo pipefail

WORKFLOW="${1:?Usage: trigger-workflow.sh <workflow-slug> <distinct-id> [data-json]}"
DISTINCT_ID="${2:?Usage: trigger-workflow.sh <workflow-slug> <distinct-id> [data-json]}"
DATA="${3:-{}}"
BASE_URL="${SUPRSEND_BASE_URL:-https://hub.suprsend.com}"

if [[ -z "${SUPRSEND_WORKSPACE_KEY:-}" || -z "${SUPRSEND_WORKSPACE_SECRET:-}" ]]; then
  echo "Error: SUPRSEND_WORKSPACE_KEY and SUPRSEND_WORKSPACE_SECRET must be set" >&2
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed" >&2
  exit 1
fi

PAYLOAD=$(jq -n \
  --arg workflow "$WORKFLOW" \
  --arg distinct_id "$DISTINCT_ID" \
  --argjson data "$DATA" \
  '{workflow: $workflow, recipients: [{distinct_id: $distinct_id}], data: $data}')

curl -s -X POST "${BASE_URL}/trigger/" \
  -H "Authorization: Bearer ${SUPRSEND_WORKSPACE_KEY}:${SUPRSEND_WORKSPACE_SECRET}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
