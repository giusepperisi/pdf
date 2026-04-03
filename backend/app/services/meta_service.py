import logging
from typing import Optional
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"


async def post_to_facebook(
    page_id: str,
    token: str,
    text: str,
    image_url: Optional[str] = None,
) -> Optional[str]:
    """
    Post content to a Facebook Page.
    If image_url is provided, posts a photo with caption.
    Otherwise posts a text-only message.
    Returns the Facebook post ID on success, or None on failure.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if image_url:
                url = f"{GRAPH_API_BASE}/{page_id}/photos"
                payload = {
                    "url": image_url,
                    "caption": text,
                    "access_token": token,
                }
            else:
                url = f"{GRAPH_API_BASE}/{page_id}/feed"
                payload = {
                    "message": text,
                    "access_token": token,
                }

            resp = await client.post(url, data=payload)
            data = resp.json()

            if resp.status_code == 200 and ("id" in data or "post_id" in data):
                post_id = data.get("post_id") or data.get("id")
                logger.info(f"Posted to Facebook page {page_id}: {post_id}")
                return post_id
            else:
                error = data.get("error", {})
                logger.error(f"Facebook API error: {error.get('message', str(data))}")
                return None

    except Exception as e:
        logger.error(f"Error posting to Facebook: {e}")
        return None


async def post_to_instagram(
    ig_user_id: str,
    token: str,
    image_url: str,
    caption: str,
) -> Optional[str]:
    """
    Post a photo to an Instagram Business account using 2-step process:
    1. Create media container
    2. Publish the container
    Returns the Instagram media ID on success, or None on failure.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Create media container
            container_url = f"{GRAPH_API_BASE}/{ig_user_id}/media"
            container_payload = {
                "image_url": image_url,
                "caption": caption,
                "access_token": token,
            }
            resp1 = await client.post(container_url, data=container_payload)
            data1 = resp1.json()

            if resp1.status_code != 200 or "id" not in data1:
                error = data1.get("error", {})
                logger.error(f"Instagram container creation error: {error.get('message', str(data1))}")
                return None

            container_id = data1["id"]
            logger.info(f"Instagram container created: {container_id}")

            # Step 2: Publish the container
            publish_url = f"{GRAPH_API_BASE}/{ig_user_id}/media_publish"
            publish_payload = {
                "creation_id": container_id,
                "access_token": token,
            }
            resp2 = await client.post(publish_url, data=publish_payload)
            data2 = resp2.json()

            if resp2.status_code == 200 and "id" in data2:
                media_id = data2["id"]
                logger.info(f"Posted to Instagram account {ig_user_id}: {media_id}")
                return media_id
            else:
                error = data2.get("error", {})
                logger.error(f"Instagram publish error: {error.get('message', str(data2))}")
                return None

    except Exception as e:
        logger.error(f"Error posting to Instagram: {e}")
        return None


async def verify_token(token: str) -> dict:
    """
    Verify a Facebook/Instagram access token by calling /me.
    Returns dict with valid, user_id, name, error.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{GRAPH_API_BASE}/me",
                params={"access_token": token, "fields": "id,name"},
            )
            data = resp.json()

            if resp.status_code == 200 and "id" in data:
                return {
                    "valid": True,
                    "user_id": data.get("id"),
                    "name": data.get("name"),
                    "error": None,
                }
            else:
                error = data.get("error", {})
                return {
                    "valid": False,
                    "user_id": None,
                    "name": None,
                    "error": error.get("message", "Unknown error"),
                }

    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return {"valid": False, "user_id": None, "name": None, "error": str(e)}


def get_token_expiry_days(token_expires_at: Optional[datetime]) -> Optional[int]:
    """
    Calculate days until token expiry.
    Returns None if token_expires_at is None (non-expiring token).
    """
    if token_expires_at is None:
        return None
    now = datetime.now(timezone.utc)
    if token_expires_at.tzinfo is None:
        token_expires_at = token_expires_at.replace(tzinfo=timezone.utc)
    delta = token_expires_at - now
    return max(0, delta.days)
