from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ClusterBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    keywords: Optional[List[str]] = None
    description: Optional[str] = None
    tone: str = "professionale"
    hashtags: Optional[List[str]] = None
    language: str = "it"


class ClusterCreate(ClusterBase):
    campaign_id: int


class ClusterUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    keywords: Optional[List[str]] = None
    description: Optional[str] = None
    tone: Optional[str] = None
    hashtags: Optional[List[str]] = None
    language: Optional[str] = None


class ClusterRead(ClusterBase):
    id: int
    campaign_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ClusterGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    language: str = "it"
    n_clusters: int = Field(default=3, ge=1, le=10)
    tone: str = "professionale"


class GeneratedCluster(BaseModel):
    name: str
    keywords: List[str]
    description: str
    tone: str
    hashtags: List[str]
    language: str
