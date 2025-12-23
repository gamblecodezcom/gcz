# Entrypoint for PM2 to run FastAPI using Uvicorn
# Run with: uvicorn main:app --host 0.0.0.0 --port 8001

from app import app