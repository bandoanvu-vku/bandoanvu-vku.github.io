#!/usr/bin/env bash
# Gộp các file trong apps-script/ thành 1 file để dán vào Mã.gs của dự án Apps Script.
# Dùng: scripts/build-apps-script.sh > /tmp/Ma.gs
set -euo pipefail
cd "$(dirname "$0")/../apps-script"
for f in $(ls *.gs | sort); do cat "$f"; printf '\n'; done
