from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.api.v1.router import api_router
from app.models.schemas import HealthResponse


def create_application() -> FastAPI:
    """Application factory for Neural Archaeologist AI API."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url="/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        version="0.1.0",
        description="Deep learning and computer vision framework for epigraphic reconstruction."
    )

    # CORS configuration
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount static files directory for raw and processed images
    import os
    from fastapi.staticfiles import StaticFiles

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(os.path.join(data_dir, "raw"), exist_ok=True)
    os.makedirs(os.path.join(data_dir, "processed"), exist_ok=True)
    os.makedirs(os.path.join(data_dir, "inscriptions"), exist_ok=True)
    application.mount("/static", StaticFiles(directory=data_dir), name="static")

    # Mount API routers under /api/v1
    application.include_router(api_router, prefix=settings.API_V1_STR)

    # Health check endpoints for /api/health, /health, and /api/v1/health
    @application.get("/api/health", response_model=HealthResponse, tags=["System"])
    @application.get("/health", response_model=HealthResponse, tags=["System"])
    async def global_health():
        return HealthResponse(
            status="operational",
            project=settings.PROJECT_NAME,
            environment=settings.ENVIRONMENT,
            version="0.1.0"
        )

    # Documentation redirects for compatibility
    @application.get(f"{settings.API_V1_STR}/docs", include_in_schema=False)
    @application.get("/api/docs", include_in_schema=False)
    async def docs_redirect():
        return RedirectResponse(url="/docs")

    @application.get(f"{settings.API_V1_STR}/openapi.json", include_in_schema=False)
    @application.get("/api/openapi.json", include_in_schema=False)
    async def openapi_redirect():
        return RedirectResponse(url="/openapi.json")

    @application.get("/")
    async def root():
        return {
            "message": "Welcome to Neural Archaeologist AI API",
            "docs": "/docs",
            "health": "/api/health"
        }

    return application


app = create_application()
