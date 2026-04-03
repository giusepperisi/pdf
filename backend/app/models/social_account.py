from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class SocialPlatform(str, enum.Enum):
    facebook = "facebook"
    instagram = "instagram"


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(Enum(SocialPlatform), nullable=False)
    page_id = Column(String(255), nullable=False)
    page_name = Column(String(255))
    access_token_encrypted = Column(String(1000), nullable=False)
    token_expires_at = Column(DateTime(timezone=True))
    ig_business_id = Column(String(255))
    connected_at = Column(DateTime(timezone=True), server_default=func.now())
