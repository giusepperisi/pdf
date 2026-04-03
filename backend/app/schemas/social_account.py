from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.social_account import SocialPlatform


class SocialAccountBase(BaseModel):
    platform: SocialPlatform
    page_id: str = Field(..., min_length=1, max_length=255)
    page_name: Optional[str] = None
    ig_business_id: Optional[str] = None


class SocialAccountCreate(SocialAccountBase):
    access_token: str = Field(..., min_length=1, description="Plain-text access token (will be encrypted)")
    token_expires_at: Optional[datetime] = None


class SocialAccountUpdate(BaseModel):
    page_name: Optional[str] = None
    access_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    ig_business_id: Optional[str] = None


class SocialAccountRead(SocialAccountBase):
    id: int
    token_expires_at: Optional[datetime] = None
    connected_at: datetime
    days_until_expiry: Optional[int] = None

    model_config = {"from_attributes": True}


class TokenVerifyResult(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    name: Optional[str] = None
    error: Optional[str] = None
