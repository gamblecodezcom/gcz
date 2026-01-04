# This file makes the scripts directory a Python package.
# Enables imports like:
#   from scripts import import_affiliates, rebuild_redirects, sync_casinos

from .import_affiliates import import_affiliates
from .rebuild_redirects import rebuild_redirects
from .sync_casinos import sync_casinos
from .sync_promos import sync_promos
from .sync_raffles import sync_raffles
from .sync_giveaways import sync_giveaways
from .health_check import health_check

__all__ = [
    "import_affiliates",
    "rebuild_redirects",
    "sync_casinos",
    "sync_promos",
    "sync_raffles",
    "sync_giveaways",
    "health_check",
]