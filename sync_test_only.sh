#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃       ${C_CYAN}Neon + Local Sync Test${C_RESET}                ┃"
box_bottom
echo

if pg_dump "$NEON_DB" > /tmp/neon_dump_test.sql 2>/tmp/neon_dump_test.err; then
  echo "[ok] pg_dump succeeded"
else
  echo "[warn] pg_dump failed"
fi

read -p "Enter to return..."
