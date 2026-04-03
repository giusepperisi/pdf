import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.campaign import Post, PostStatus
from app.schemas.post import PostCreate, PostRead, PostScheduleRequest, PostUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/", response_model=List[PostRead])
def list_posts(
    cluster_id: Optional[int] = None,
    post_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Post)
    if cluster_id is not None:
        q = q.filter(Post.cluster_id == cluster_id)
    if post_status is not None:
        try:
            status_enum = PostStatus(post_status)
            q = q.filter(Post.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {post_status}")
    return q.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=PostRead, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate, db: Session = Depends(get_db)):
    post = Post(**payload.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/{post_id}", response_model=PostRead)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.patch("/{post_id}", response_model=PostRead)
def update_post(post_id: int, payload: PostUpdate, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()


@router.patch("/{post_id}/schedule", response_model=PostRead)
def schedule_post(post_id: int, payload: PostScheduleRequest, db: Session = Depends(get_db)):
    """Schedule a post for future publication."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.status == PostStatus.published:
        raise HTTPException(status_code=400, detail="Cannot reschedule an already published post")
    post.scheduled_at = payload.scheduled_at
    post.status = PostStatus.scheduled
    db.commit()
    db.refresh(post)
    return post


@router.post("/{post_id}/publish-now", response_model=PostRead)
async def publish_post_now(post_id: int, db: Session = Depends(get_db)):
    """Immediately publish a post to its configured platforms."""
    from app.services.post_dispatcher import _publish_post
    from app.models.social_account import SocialAccount, SocialPlatform

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.status == PostStatus.published:
        raise HTTPException(status_code=400, detail="Post already published")

    accounts = db.query(SocialAccount).all()
    fb_accounts = [a for a in accounts if a.platform == SocialPlatform.facebook]
    ig_accounts = [a for a in accounts if a.platform == SocialPlatform.instagram]

    try:
        await _publish_post(db, post, fb_accounts, ig_accounts)
        db.refresh(post)
    except Exception as e:
        logger.error(f"Publish now error for post {post_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Publishing failed: {e}")

    return post
