import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import campaigns, clusters, posts, social_accounts, analytics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SocialManager-AI",
    description="AI-powered social media campaign manager for Facebook and Instagram",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(campaigns.router, prefix="/api/v1")
app.include_router(clusters.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")
app.include_router(social_accounts.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    # Create all database tables
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")

    # Start APScheduler
    logger.info("Starting APScheduler...")
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from app.services.post_dispatcher import dispatch_scheduled_posts

        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            dispatch_scheduled_posts,
            trigger="interval",
            minutes=1,
            id="dispatch_posts",
            replace_existing=True,
        )
        scheduler.start()
        app.state.scheduler = scheduler
        logger.info("APScheduler started — checking for scheduled posts every minute")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    if hasattr(app.state, "scheduler"):
        app.state.scheduler.shutdown()
        logger.info("APScheduler stopped")


@app.get("/")
async def root():
    return {"message": "SocialManager-AI API is running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
