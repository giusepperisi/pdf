import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.campaign import Campaign, Cluster, Post
from app.schemas.cluster import (
    ClusterCreate,
    ClusterGenerateRequest,
    ClusterRead,
    ClusterUpdate,
    GeneratedCluster,
)
from app.schemas.post import PostRead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/clusters", tags=["clusters"])


@router.get("/", response_model=List[ClusterRead])
def list_clusters(campaign_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    q = db.query(Cluster)
    if campaign_id is not None:
        q = q.filter(Cluster.campaign_id == campaign_id)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=ClusterRead, status_code=status.HTTP_201_CREATED)
def create_cluster(payload: ClusterCreate, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == payload.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    cluster = Cluster(**payload.model_dump())
    db.add(cluster)
    db.commit()
    db.refresh(cluster)
    return cluster


@router.get("/{cluster_id}", response_model=ClusterRead)
def get_cluster(cluster_id: int, db: Session = Depends(get_db)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster


@router.patch("/{cluster_id}", response_model=ClusterRead)
def update_cluster(cluster_id: int, payload: ClusterUpdate, db: Session = Depends(get_db)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cluster, field, value)
    db.commit()
    db.refresh(cluster)
    return cluster


@router.delete("/{cluster_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cluster(cluster_id: int, db: Session = Depends(get_db)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    db.delete(cluster)
    db.commit()


@router.post("/generate", response_model=List[GeneratedCluster])
async def generate_clusters_ai(payload: ClusterGenerateRequest):
    """Use Gemini to generate semantic clusters for a topic."""
    from app.services.gemini_service import generate_clusters

    clusters = await generate_clusters(
        topic=payload.topic,
        language=payload.language,
        n_clusters=payload.n_clusters,
        tone=payload.tone,
    )
    return clusters


@router.post("/{cluster_id}/generate-content", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def generate_cluster_content(
    cluster_id: int,
    platform: str = "both",
    generate_image: bool = True,
    db: Session = Depends(get_db),
):
    """
    Generate a post (text + image) for a cluster using AI.
    Creates and returns the new Post record.
    """
    from app.models.campaign import PostPlatform, PostStatus
    from app.services.cloudinary_service import upload_from_url
    from app.services.gemini_service import generate_post_content
    from app.services.image_service import generate_image as gen_image

    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    # Generate text content and image prompt via Gemini
    content = await generate_post_content(
        cluster_name=cluster.name,
        cluster_description=cluster.description or "",
        cluster_keywords=cluster.keywords or [],
        cluster_hashtags=cluster.hashtags or [],
        cluster_tone=cluster.tone or "professionale",
        cluster_language=cluster.language or "it",
        platform=platform,
    )

    image_url = None
    image_prompt = content.get("image_prompt", "")

    if generate_image and image_prompt:
        try:
            raw_url = await gen_image(image_prompt)
            if raw_url:
                image_url = await upload_from_url(raw_url, public_id=f"post_cluster_{cluster_id}")
        except Exception as e:
            logger.error(f"Image generation failed for cluster {cluster_id}: {e}")

    # Validate platform enum
    try:
        platform_enum = PostPlatform(platform)
    except ValueError:
        platform_enum = PostPlatform.both

    post = Post(
        cluster_id=cluster_id,
        platform=platform_enum,
        text_content=content.get("text_content", ""),
        image_prompt=image_prompt,
        image_url=image_url,
        status=PostStatus.draft,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post
