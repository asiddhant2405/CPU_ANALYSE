"""
FastAPI application entrypoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.storage.database import init_db

app = FastAPI(
    title="CPU Energy Efficiency Analyzer API",
    description="Educational benchmarking and computational cost analyzer for Computer Organization and Architecture (COA).",
    version="1.0.0",
)

# CORS configuration restricted to local development frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize persistent SQLite database
init_db()

# Mount API router
app.include_router(api_router, prefix="/api")


from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
ASSETS_DIR = DIST_DIR / "assets"

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


@app.get("/")
def serve_root():
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "app": "CPU Energy Efficiency Analyzer API",
        "tagline": "Same output. Different implementations. Different computational costs.",
        "documentation": "/docs",
        "health": "/api/health",
    }


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    target = DIST_DIR / full_path
    if target.is_file():
        return FileResponse(str(target))
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "app": "CPU Energy Efficiency Analyzer API",
        "tagline": "Same output. Different implementations. Different computational costs.",
        "documentation": "/docs",
        "health": "/api/health",
    }

