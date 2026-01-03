#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃              ${C_CYAN}BACKUP TOOLS${C_RESET}                       ┃"
box_bottom
echo

TS="$(date +%Y%m%d-%H%M%S)"
OUT="$GZ_BACKUPS/gcz-backup-$TS.tar.gz"

echo "Creating backup: $OUT"
tar -czf "$OUT" -C "$GZ_ROOT" . \
  --exclude="node_modules" \
  --exclude="logs" \
  --exclude="backups"

echo "[ok] backup created"
read -p "Enter to return..."
