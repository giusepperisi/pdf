from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.campaign import Post, PostStatus, Campaign, Cluster

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/posts")
def get_post_analytics(db: Session = Depends(get_db)):
    """Return aggregate post metrics."""
    total_posts = db.query(func.count(Post.id)).scalar() or 0
    published = db.query(func.count(Post.id)).filter(Post.status == PostStatus.published).scalar() or 0
    scheduled = db.query(func.count(Post.id)).filter(Post.status == PostStatus.scheduled).scalar() or 0
    draft = db.query(func.count(Post.id)).filter(Post.status == PostStatus.draft).scalar() or 0
    failed = db.query(func.count(Post.id)).filter(Post.status == PostStatus.failed).scalar() or 0
    active_campaigns = db.query(func.count(Campaign.id)).scalar() or 0
    total_clusters = db.query(func.count(Cluster.id)).scalar() or 0

    return {
        "total_posts": total_posts,
        "published": published,
        "scheduled": scheduled,
        "draft": draft,
        "failed": failed,
        "active_campaigns": active_campaigns,
        "total_clusters": total_clusters,
    }


@router.get("/posts/by-platform")
def get_posts_by_platform(db: Session = Depends(get_db)):
    """Return post counts grouped by platform."""
    from app.models.campaign import PostPlatform
    result = {}
    for platform in PostPlatform:
        count = db.query(func.count(Post.id)).filter(Post.platform == platform).scalar() or 0
        result[platform.value] = count
    return result


@router.get("/posts/by-status")
def get_posts_by_status(db: Session = Depends(get_db)):
    """Return post counts grouped by status."""
    result = {}
    for s in PostStatus:
        count = db.query(func.count(Post.id)).filter(Post.status == s).scalar() or 0
        result[s.value] = count
    return result
