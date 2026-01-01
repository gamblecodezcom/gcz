from fastapi import APIRouter
from services.promos_service import get_promo_codes, get_promo_links

router = APIRouter()

@router.get("/")
async def all_promos():
    codes = await get_promo_codes()
    links = await get_promo_links()
    return {"codes": codes, "links": links}

@router.get("/codes")
async def promo_codes():
    return await get_promo_codes()

@router.get("/links")
async def promo_links():
    return await get_promo_links()