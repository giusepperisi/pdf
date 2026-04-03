from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.campaign import CampaignStatus


class CampaignBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    topic: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    topic: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[CampaignStatus] = None


class CampaignRead(CampaignBase):
    id: int
    status: CampaignStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CampaignWithClusters(CampaignRead):
    clusters: List["ClusterRead"] = []

    model_config = {"from_attributes": True}


# Avoid circular import
from app.schemas.cluster import ClusterRead  # noqa: E402
CampaignWithClusters.model_rebuild()
