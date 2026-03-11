#!/usr/bin/env bash
# Verify SuprSend Inbox SDK is properly installed and configured
# Usage: ./check-inbox-setup.sh [project-dir]

set -euo pipefail

PROJECT_DIR="${1:-.}"

echo "Checking SuprSend Inbox setup in: ${PROJECT_DIR}"

# Check if package.json exists
if [[ ! -f "${PROJECT_DIR}/package.json" ]]; then
  echo "ERROR: No package.json found in ${PROJECT_DIR}" >&2
  exit 1
fi

# Check for @suprsend/react or @suprsend/react-core
if grep -q '"@suprsend/react"' "${PROJECT_DIR}/package.json"; then
  echo "OK: @suprsend/react is listed in dependencies"
elif grep -q '"@suprsend/react-core"' "${PROJECT_DIR}/package.json"; then
  echo "OK: @suprsend/react-core is listed in dependencies"
else
  echo "MISSING: Neither @suprsend/react nor @suprsend/react-core found in package.json"
  echo "  Run: npm install @suprsend/react"
  exit 1
fi

# Check if node_modules has the package
if [[ -d "${PROJECT_DIR}/node_modules/@suprsend/react" ]]; then
  echo "OK: @suprsend/react is installed in node_modules"
elif [[ -d "${PROJECT_DIR}/node_modules/@suprsend/react-core" ]]; then
  echo "OK: @suprsend/react-core is installed in node_modules"
else
  echo "WARNING: Package not found in node_modules. Run: npm install"
fi

# Check for SuprSendProvider usage in source files
if grep -rq "SuprSendProvider" "${PROJECT_DIR}/src/" 2>/dev/null; then
  echo "OK: SuprSendProvider found in source files"
else
  echo "WARNING: SuprSendProvider not found in src/. Ensure you wrap your app with <SuprSendProvider>."
fi

echo "Setup check complete."
