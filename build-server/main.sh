#!/bin/bash

set -euo pipefail

if [[ -z "${GIT_REPOSITORY_URL:-}" ]]; then
  echo "GIT_REPOSITORY_URL env var is required"
  exit 1
fi

if [[ -z "${PROJECT_ID:-}" ]]; then
  echo "PROJECT_ID env var is required"
  exit 1
fi

echo "Cloning repository ${GIT_REPOSITORY_URL}"
git clone "${GIT_REPOSITORY_URL}" /home/app/output

exec node script.js