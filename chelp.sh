#!/usr/bin/env bash
# ============================================================
#  GAMBLECODEZ — COMMAND QUICK HELP (FINAL + GIT COMMANDS)
# ============================================================

echo "==================== GambleCodez Command Help ===================="
echo
echo " sshv          → Connect to VPS (ssh root@72.60.113.42)"
echo
echo " gcz           → Master control dashboard"
echo " gczs          → Full system status"
echo
echo " gczapi        → Restart API"
echo " gczbot        → Restart Bot"
echo " gczred        → Restart Redirect"
echo " gczwd         → Restart Watchdog"
echo " gczall        → Restart ALL services"
echo
echo " gczdaily      → Run daily automation"
echo " gczwarm       → Warm redirect cache"
echo " gczsync       → Reconcile DB ↔ CSV"
echo
echo " gczbackup     → Backup CSV + DB"
echo " gzczaudit     → Show latest affiliates"
echo
echo " sql           → Open PostgreSQL shell"
echo " dbtest        → Test DB connection"
echo
echo " ports         → Show open ports (ss -tulpn)"
echo " mem           → RAM usage (free -h)"
echo " disk          → Disk usage (df -h)"
echo
echo " gczdiag       → Full deep system diagnostic + self-heal"
echo
echo "---------------------- GIT COMMANDS -----------------------------"
echo
echo " gitstatus     → Show repo status"
echo " gitlog        → Show last 5 commits"
echo
echo " gitpushvps    → Push VPS → GitHub (safe)"
echo " gitforce      → Force push VPS → GitHub (overwrite GitHub)"
echo " gitpullvps    → Pull GitHub → VPS (overwrite VPS)"
echo
echo " gitinit       → Initialize Git repo on VPS"
echo " gitremote     → Set GitHub repo as origin"
echo " gitssh        → Test SSH connection to GitHub"
echo
echo "=================================================================="