from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.campaign import PostStatus, PostPlatform


class PostBase(BaseModel):
    platform: PostPlatform = PostPlatform.both
    text_content: Optional[str] = None
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None


class PostCreate(PostBase):
    cluster_id: int


class PostUpdate(BaseModel):
    platform: Optional[PostPlatform] = None
    text_content: Optional[str] = None
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[PostStatus] = None
    scheduled_at: Optional[datetime] = None


class PostRead(PostBase):
    id: int
    cluster_id: int
    status: PostStatus
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    fb_post_id: Optional[str] = None
    ig_post_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PostScheduleRequest(BaseModel):
    scheduled_at: datetime = Field(..., description="UTC datetime when the post should be published")


class PostGenerateRequest(BaseModel):
    cluster_id: int
    platform: PostPlatform = PostPlatform.both
    generate_image: bool = True
