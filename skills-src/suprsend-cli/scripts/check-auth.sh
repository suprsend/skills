#!/usr/bin/env bash
# Verify SuprSend CLI authentication is configured
set -euo pipefail

if ! command -v suprsend &>/dev/null; then
  echo "Error: suprsend CLI is not installed. Run: npm install -g @suprsend/cli"
  exit 1
fi

if suprsend workspace list &>/dev/null; then
  echo "SuprSend CLI is authenticated."
else
  echo "Error: Not authenticated. Run: suprsend login"
  exit 1
fi
