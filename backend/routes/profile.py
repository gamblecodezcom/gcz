from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from services.db import get_db
from backend.logger import get_logger
from services.auth import verify_telegram_signature

router = APIRouter(prefix="/api/profile", tags=["Profile"])
logger = get_logger("gcz-profile")


@router.get("/{telegram_id}")
async def get_profile(telegram_id: int):
    db = await get_db()

    try:
        # ============================
        # USER CORE PROFILE
        # ============================
        user = await db.fetchrow(
            """
            SELECT
                telegram_id,
                username,
                cwallet_id,
                runewager_username,
                winna_username,
                newsletter_agreed,
                jurisdiction,
                raffle_pin_set,
                created_at
            FROM users
            WHERE telegram_id = $1
            """,
            telegram_id,
        )

        if not user:
            logger.warning(f"[PROFILE] User not found: {telegram_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # ============================
        # LINKED CASINOS
        # ============================
        linked = await db.fetch(
            """
            SELECT site, account_id, created_at
            FROM linked_casinos
            WHERE telegram_id = $1
            ORDER BY created_at DESC
            """,
            telegram_id,
        )

        # ============================
        # RESPONSE
        # ============================
        return {
            "telegram_id": user["telegram_id"],
            "username": user["username"],
            "cwallet_id": user["cwallet_id"],
            "runewager_username": user["runewager_username"],
            "winna_username": user["winna_username"],
            "newsletterAgreed": user["newsletter_agreed"],
            "jurisdiction": user["jurisdiction"],
            "rafflePinSet": user["raffle_pin_set"],
            "created_at": user["created_at"],
            "linkedCasinos": [dict(r) for r in linked],
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"[PROFILE] Error loading profile {telegram_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to load profile")


def _render_telegram_response(message: str, detail: str, status: str = "success") -> HTMLResponse:
    html = f"""
    <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Telegram Link — GambleCodez</title>
        <style>
          body {{
            background: #05070d;
            color: #f6f7fb;
            font-family: "Inter", system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 2rem;
          }}
          .card {{
            background: rgba(5,7,13,0.85);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 1rem;
            padding: 2rem;
            max-width: 420px;
            text-align: center;
            box-shadow: 0 20px 35px rgba(0,0,0,0.35);
          }}
          .status {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
          }}
          .status.success {{ color: #46f17a; }}
          .status.error {{ color: #ff6b6b; }}
          a {{
            color: #3cd6ff;
            text-decoration: none;
            font-weight: 600;
          }}
        </style>
      </head>
      <body>
        <div class="card">
          <p class="status {status}">{status}</p>
          <h1>{message}</h1>
          <p style="color: #cfd3e4;">{detail}</p>
          <p style="margin-top: 1rem;">
            <a href="https://gamblecodez.com/degen-profile">Return to Degen Profile</a>
          </p>
        </div>
      </body>
    </html>
    """
    return HTMLResponse(content=html, status_code=200)


@router.post("/telegram/link")
async def link_telegram_profile(request: Request):
    form = await request.form()
    payload = {key: form[key] for key in form}
    cwallet_id = request.query_params.get("cwallet") or payload.get("cwallet_id")
    if not cwallet_id:
        return _render_telegram_response(
            "Missing wallet",
            "Please set your Cwallet on profile first, then try linking again.",
            status="error",
        )

    if not verify_telegram_signature(payload):
        raise HTTPException(status_code=403, detail="Telegram signature invalid")

    telegram_id = payload.get("id")
    if not telegram_id:
        raise HTTPException(status_code=400, detail="Telegram data missing")

    telegram_username = payload.get("username")
    first_name = payload.get("first_name", "")
    last_name = payload.get("last_name", "")
    full_name = " ".join(filter(None, [first_name, last_name])).strip() or None

    db = await get_db()
    try:
        existing_telegram = await db.fetchrow(
            "SELECT user_id, cwallet_id FROM users WHERE telegram_id = $1",
            telegram_id,
        )

        if existing_telegram and existing_telegram["cwallet_id"] and existing_telegram["cwallet_id"] != cwallet_id:
            return _render_telegram_response(
                "Telegram linked elsewhere",
                "This Telegram account is already attached to another profile.",
                status="error",
            )

        profile = await db.fetchrow(
            "SELECT user_id FROM users WHERE cwallet_id = $1",
            cwallet_id,
        )

        target_user_id = profile["user_id"] if profile else None

        if profile:
            await db.execute(
                """
                UPDATE users
                SET telegram_id = $1,
                    telegram_username = $2,
                    username = COALESCE(NULLIF($3, ''), username),
                    full_name = COALESCE(NULLIF($4, ''), full_name),
                    updated_at = CURRENT_TIMESTAMP
                WHERE cwallet_id = $5
                """,
                telegram_id,
                telegram_username,
                telegram_username,
                full_name,
                cwallet_id,
            )
        else:
            target_user_id = existing_telegram["user_id"] if existing_telegram else cwallet_id
            await db.execute(
                """
                INSERT INTO users (user_id, telegram_id, telegram_username, username, full_name, cwallet_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO UPDATE SET
                    telegram_id = EXCLUDED.telegram_id,
                    telegram_username = COALESCE(NULLIF(EXCLUDED.telegram_username, ''), users.telegram_username),
                    username = COALESCE(NULLIF(EXCLUDED.username, ''), users.username),
                    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
                    cwallet_id = COALESCE(NULLIF(EXCLUDED.cwallet_id, ''), users.cwallet_id),
                    updated_at = CURRENT_TIMESTAMP
                """,
                target_user_id,
                telegram_id,
                telegram_username,
                telegram_username,
                full_name,
                cwallet_id,
            )

        logger.info(
            "[PROFILE] Telegram linked",
            extra={
                "cwallet_id": cwallet_id,
                "telegram_id": telegram_id,
                "telegram_username": telegram_username,
            },
        )

        return _render_telegram_response(
            "Telegram linked",
            "Your Telegram account is now connected to this Degen Profile. Close this tab and return to GambleCodez.",
        )

    except Exception as exc:
        logger.error("[PROFILE] Telegram link failed", exc_info=exc)
        raise HTTPException(status_code=500, detail="Failed to link Telegram account")
