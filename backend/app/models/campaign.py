from sqlalchemy import Column, Integer, String, Text, DateTime, ARRAY, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class CampaignStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"


class PostStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    published = "published"
    failed = "failed"


class PostPlatform(str, enum.Enum):
    facebook = "facebook"
    instagram = "instagram"
    both = "both"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    topic = Column(String(500), nullable=False)
    description = Column(Text)
    status = Column(Enum(CampaignStatus), default=CampaignStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clusters = relationship("Cluster", back_populates="campaign", cascade="all, delete-orphan")


class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    name = Column(String(255), nullable=False)
    keywords = Column(ARRAY(String))
    description = Column(Text)
    tone = Column(String(50), default="professionale")
    hashtags = Column(ARRAY(String))
    language = Column(String(10), default="it")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    campaign = relationship("Campaign", back_populates="clusters")
    posts = relationship("Post", back_populates="cluster", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=False)
    platform = Column(Enum(PostPlatform), default=PostPlatform.both)
    text_content = Column(Text)
    image_prompt = Column(Text)
    image_url = Column(String(1000))
    status = Column(Enum(PostStatus), default=PostStatus.draft)
    scheduled_at = Column(DateTime(timezone=True))
    published_at = Column(DateTime(timezone=True))
    fb_post_id = Column(String(255))
    ig_post_id = Column(String(255))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cluster = relationship("Cluster", back_populates="posts")
