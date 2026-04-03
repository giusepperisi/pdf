import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _get_cloudinary():
    """Lazy-initialize Cloudinary with settings."""
    from app.config import settings
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    return cloudinary.uploader


async def upload_from_url(image_url: str, public_id: Optional[str] = None) -> Optional[str]:
    """
    Upload an image from a URL to Cloudinary.
    Returns the secure HTTPS URL of the uploaded image, or None on failure.
    """
    from app.config import settings

    if not all([settings.cloudinary_cloud_name, settings.cloudinary_api_key, settings.cloudinary_api_secret]):
        logger.warning("Cloudinary credentials not configured, returning original URL")
        return image_url

    try:
        uploader = _get_cloudinary()
        upload_options = {
            "folder": "social_manager_ai",
            "overwrite": True,
        }
        if public_id:
            upload_options["public_id"] = public_id

        result = uploader.upload(image_url, **upload_options)
        secure_url = result.get("secure_url")
        logger.info(f"Uploaded image to Cloudinary: {secure_url}")
        return secure_url

    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        return image_url  # Return original URL as fallback
