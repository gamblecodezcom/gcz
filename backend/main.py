from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.promos import router as promos_router

app = FastAPI(
    title="GambleCodez API",
    version="1.0.0",
    description="FastAPI backend for GambleCodez"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Routers
app.include_router(promos_router, prefix="/api/promos")