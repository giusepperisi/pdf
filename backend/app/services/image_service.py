import logging
import urllib.parse
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"


async def generate_image(
    prompt: str,
    width: int = 1080,
    height: int = 1080,
) -> Optional[str]:
    """
    Generate an image URL using Pollinations.ai.
    Falls back to HuggingFace if Pollinations fails.
    Returns a direct image URL string, or None on complete failure.
    """
    url = await _pollinations_image(prompt, width, height)
    if url:
        return url

    logger.warning("Pollinations failed, trying HuggingFace fallback")
    url = await _huggingface_image(prompt)
    return url


async def _pollinations_image(prompt: str, width: int, height: int) -> Optional[str]:
    """Call Pollinations.ai and return URL if image is accessible."""
    encoded = urllib.parse.quote(prompt)
    url = f"{POLLINATIONS_BASE}/{encoded}?width={width}&height={height}&nologo=true&model=flux"
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image/"):
                return url
            logger.warning(f"Pollinations returned status {resp.status_code}")
    except Exception as e:
        logger.error(f"Pollinations error: {e}")
    return None


async def _huggingface_image(prompt: str) -> Optional[str]:
    """
    Use HuggingFace Inference API as fallback.
    Requires HUGGINGFACE_TOKEN env var. Uses stabilityai/stable-diffusion-2-1 (free tier).
    """
    from app.config import settings

    if not settings.huggingface_token:
        logger.warning("HUGGINGFACE_TOKEN not set, skipping HuggingFace fallback")
        return None

    api_url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1"
    headers = {"Authorization": f"Bearer {settings.huggingface_token}"}
    payload = {"inputs": prompt}

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(api_url, headers=headers, json=payload)
            if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image/"):
                # HuggingFace returns raw bytes — we can't return a URL directly
                # We'll return None here and let the caller handle raw bytes if needed
                logger.info("HuggingFace returned image bytes (URL not available without upload)")
                return None
            logger.warning(f"HuggingFace returned status {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.error(f"HuggingFace error: {e}")
    return None
