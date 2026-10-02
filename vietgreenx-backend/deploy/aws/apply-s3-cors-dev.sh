#!/usr/bin/env bash
set -euo pipefail

BUCKET="${1:-vietgreenx-media-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

aws s3api put-bucket-cors \
	--bucket "$BUCKET" \
	--cors-configuration "file://${SCRIPT_DIR}/s3-cors-dev.json"

echo "Applied dev CORS to s3://${BUCKET}"
