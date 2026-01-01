# /var/www/html/gcz/services/siteRoles.py
# Atomic per‑site RBAC service for GambleCodez

class SiteRoles:
    VIEWER = "viewer"
    EDITOR = "editor"
    MANAGER = "manager"
    OWNER = "owner"

    # Role hierarchy (lowest → highest)
    ROLE_LEVELS = {
        VIEWER: 1,
        EDITOR: 2,
        MANAGER: 3,
        OWNER: 4,
    }


class SiteRoleService:
    def __init__(self, db):
        """
        db = async database client (Neon, asyncpg, etc.)
        """
        self.db = db

    # -----------------------------
    # GET USER ROLE FOR A SITE
    # -----------------------------
    async def get_role(self, site_id: int, user_id: int):
        query = """
            SELECT r.name
            FROM site_admin_users sau
            JOIN site_admin_roles r ON r.id = sau.role_id
            WHERE sau.site_id = $1 AND sau.user_id = $2
        """
        row = await self.db.fetchrow(query, site_id, user_id)
        return row["name"] if row else None

    # -----------------------------
    # CHECK IF USER HAS MINIMUM ROLE
    # -----------------------------
    async def has_role(self, site_id: int, user_id: int, required_role: str):
        user_role = await self.get_role(site_id, user_id)
        if not user_role:
            return False

        return (
            SiteRoles.ROLE_LEVELS[user_role]
            >= SiteRoles.ROLE_LEVELS[required_role]
        )

    # -----------------------------
    # ASSIGN ROLE (UPSERT)
    # -----------------------------
    async def assign_role(self, site_id: int, user_id: int, role_name: str):
        query = """
            INSERT INTO site_admin_users (site_id, user_id, role_id)
            VALUES ($1, $2, (SELECT id FROM site_admin_roles WHERE name = $3))
            ON CONFLICT (site_id, user_id) DO UPDATE
            SET role_id = EXCLUDED.role_id
        """
        await self.db.execute(query, site_id, user_id, role_name)
        return True

    # -----------------------------
    # REMOVE ROLE
    # -----------------------------
    async def remove_role(self, site_id: int, user_id: int):
        query = """
            DELETE FROM site_admin_users
            WHERE site_id = $1 AND user_id = $2
        """
        await self.db.execute(query, site_id, user_id)
        return True

    # -----------------------------
    # LIST ADMINS FOR A SITE
    # -----------------------------
    async def list_admins(self, site_id: int):
        query = """
            SELECT sau.user_id, r.name AS role
            FROM site_admin_users sau
            JOIN site_admin_roles r ON r.id = sau.role_id
            WHERE sau.site_id = $1
            ORDER BY r.id DESC
        """
        return await self.db.fetch(query, site_id)