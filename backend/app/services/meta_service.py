import asyncio
import logging
from typing import Optional
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

# Backoff delays in seconds: 60s, 300s, 900s
_RETRY_DELAYS = [60, 300, 900]


async def _post_with_retry(client: httpx.AsyncClient, url: str, payload: dict) -> Optional[dict]:
    """
    POST with exponential backoff retry on rate-limit (429) or transient errors (5xx).
    Returns parsed JSON dict on success, or None after all retries exhausted.
    """
    for attempt, delay in enumerate([0] + _RETRY_DELAYS):
        if delay:
            logger.warning(f"Rate limit hit, retrying in {delay}s (attempt {attempt + 1}/4)")
            await asyncio.sleep(delay)
        try:
            resp = await client.post(url, data=payload)
            if resp.status_code == 429 or resp.status_code >= 500:
                logger.warning(f"HTTP {resp.status_code} on attempt {attempt + 1}, will retry")
                continue
            return resp.json()
        except httpx.TransportError as e:
            logger.warning(f"Transport error on attempt {attempt + 1}: {e}")
            if attempt == len(_RETRY_DELAYS):
                raise
    return None


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
    Retries on rate-limit with backoff 1min→5min→15min.
    Returns the Facebook post ID on success, or None on failure.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if image_url:
                url = f"{GRAPH_API_BASE}/{page_id}/photos"
                payload = {"url": image_url, "caption": text, "access_token": token}
            else:
                url = f"{GRAPH_API_BASE}/{page_id}/feed"
                payload = {"message": text, "access_token": token}

            data = await _post_with_retry(client, url, payload)
            if data is None:
                logger.error("Facebook API: all retries exhausted")
                return None

            if "id" in data or "post_id" in data:
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
    Retries on rate-limit with backoff 1min→5min→15min.
    Returns the Instagram media ID on success, or None on failure.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Create media container
            container_url = f"{GRAPH_API_BASE}/{ig_user_id}/media"
            container_payload = {"image_url": image_url, "caption": caption, "access_token": token}
            data1 = await _post_with_retry(client, container_url, container_payload)

            if data1 is None or "id" not in data1:
                error = (data1 or {}).get("error", {})
                logger.error(f"Instagram container creation error: {error.get('message', str(data1))}")
                return None

            container_id = data1["id"]
            logger.info(f"Instagram container created: {container_id}")

            # Step 2: Publish the container
            publish_url = f"{GRAPH_API_BASE}/{ig_user_id}/media_publish"
            publish_payload = {"creation_id": container_id, "access_token": token}
            data2 = await _post_with_retry(client, publish_url, publish_payload)

            if data2 and "id" in data2:
                media_id = data2["id"]
                logger.info(f"Posted to Instagram account {ig_user_id}: {media_id}")
                return media_id
            else:
                error = (data2 or {}).get("error", {})
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
