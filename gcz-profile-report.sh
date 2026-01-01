#!/bin/bash
set -e

REPORT="gcz-profile-report.txt"
echo "=== GCZ PROFILE / NEWSLETTER / DROPS REPORT ($(date -Iseconds)) ===" | tee "$REPORT"

section() {
  echo -e "\n=== $1 ===" | tee -a "$REPORT"
}

append_cmd() {
  echo -e "\n--- $1 ---" | tee -a "$REPORT"
  shift
  "$@" 2>&1 | tee -a "$REPORT" || echo "[WARN] Command failed: $*" | tee -a "$REPORT"
}

section "DROPS ENDPOINT"
append_cmd "curl /api/drops" curl -v https://gamblecodez.com/api/drops || true

section "PROFILE ENDPOINT (no auth)"
append_cmd "curl /api/profile" curl -v https://gamblecodez.com/api/profile || true

section "NEWSLETTER TABLE SAMPLE"
if [ -z "$AI_AGENT_NEON_DB_URL" ]; then
  echo "[WARN] AI_AGENT_NEON_DB_URL not set" | tee -a "$REPORT"
else
  append_cmd "SELECT 5 rows from newsletter_subscribers" \
    psql "$AI_AGENT_NEON_DB_URL" -c "SELECT * FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 5;"
fi

echo -e "\n=== REPORT COMPLETE ===" | tee -a "$REPORT"
