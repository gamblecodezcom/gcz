from fastapi import FastAPI

app = FastAPI(title="GCZ Sandbox AI", version="0.1")

@app.get("/health")
async def health():
    return {"status": "ok", "env": "sandbox"}
