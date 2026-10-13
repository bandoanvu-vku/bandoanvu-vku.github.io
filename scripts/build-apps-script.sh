#!/usr/bin/env bash
# Gộp các file trong apps-script/ thành 1 file để dán vào Mã.gs của dự án Apps Script.
# Dùng: scripts/build-apps-script.sh > /tmp/Ma.gs
set -euo pipefail
cd "$(dirname "$0")/../apps-script"
# Mọi file .gs dùng chung một không gian tên: trùng tên hàm/hằng thì hàm sau ghi đè hàm trước -> dừng lại.
trung=$(grep -ho '^function [A-Za-z0-9_$]*\|^const [A-Za-z0-9_$]*' *.gs | sort | uniq -d)
if [ -n "$trung" ]; then echo "Trùng tên giữa các file .gs: $trung" >&2; exit 1; fi
for f in $(ls *.gs | sort); do cat "$f"; printf '\n'; done
