import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.campaign import Post, PostStatus
from app.models.social_account import SocialAccount, SocialPlatform

logger = logging.getLogger(__name__)


def _decrypt_token(encrypted_token: str) -> str:
    """Decrypt a Fernet-encrypted access token."""
    from app.config import settings
    from cryptography.fernet import Fernet

    if not settings.fernet_key:
        raise ValueError("FERNET_KEY not configured")
    f = Fernet(settings.fernet_key.encode())
    return f.decrypt(encrypted_token.encode()).decode()


async def dispatch_scheduled_posts():
    """
    Job that runs every minute to publish posts that are due.
    Fetches all scheduled posts with scheduled_at <= now,
    publishes them to Facebook/Instagram, then updates status.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        due_posts = (
            db.query(Post)
            .filter(
                Post.status == PostStatus.scheduled,
                Post.scheduled_at <= now,
            )
            .all()
        )

        if not due_posts:
            return

        logger.info(f"Dispatching {len(due_posts)} scheduled posts")

        # Load social accounts once
        accounts = db.query(SocialAccount).all()
        fb_accounts = [a for a in accounts if a.platform == SocialPlatform.facebook]
        ig_accounts = [a for a in accounts if a.platform == SocialPlatform.instagram]

        for post in due_posts:
            try:
                await _publish_post(db, post, fb_accounts, ig_accounts)
            except Exception as e:
                logger.error(f"Failed to publish post {post.id}: {e}")
                post.status = PostStatus.failed
                post.error_message = str(e)
                db.commit()

    finally:
        db.close()


async def _publish_post(db: Session, post: Post, fb_accounts, ig_accounts):
    """Publish a single post to the appropriate platforms."""
    from app.models.campaign import PostPlatform
    from app.services.meta_service import post_to_facebook, post_to_instagram

    platform = post.platform
    fb_post_id = None
    ig_post_id = None
    errors = []

    if platform in (PostPlatform.facebook, PostPlatform.both):
        if fb_accounts:
            account = fb_accounts[0]
            try:
                token = _decrypt_token(account.access_token_encrypted)
                fb_post_id = await post_to_facebook(
                    page_id=account.page_id,
                    token=token,
                    text=post.text_content or "",
                    image_url=post.image_url,
                )
                if not fb_post_id:
                    errors.append("Facebook posting returned no post ID")
            except Exception as e:
                errors.append(f"Facebook error: {e}")
                logger.error(f"Facebook publish error for post {post.id}: {e}")
        else:
            logger.warning(f"No Facebook account configured for post {post.id}")

    if platform in (PostPlatform.instagram, PostPlatform.both):
        if ig_accounts:
            account = ig_accounts[0]
            if account.ig_business_id and post.image_url:
                try:
                    token = _decrypt_token(account.access_token_encrypted)
                    ig_post_id = await post_to_instagram(
                        ig_user_id=account.ig_business_id,
                        token=token,
                        image_url=post.image_url,
                        caption=post.text_content or "",
                    )
                    if not ig_post_id:
                        errors.append("Instagram posting returned no media ID")
                except Exception as e:
                    errors.append(f"Instagram error: {e}")
                    logger.error(f"Instagram publish error for post {post.id}: {e}")
            else:
                logger.warning(f"Instagram post {post.id} skipped: missing ig_business_id or image_url")
        else:
            logger.warning(f"No Instagram account configured for post {post.id}")

    # Update post status
    if errors and not fb_post_id and not ig_post_id:
        post.status = PostStatus.failed
        post.error_message = "; ".join(errors)
    else:
        post.status = PostStatus.published
        post.published_at = datetime.now(timezone.utc)
        if fb_post_id:
            post.fb_post_id = fb_post_id
        if ig_post_id:
            post.ig_post_id = ig_post_id
        if errors:
            post.error_message = "Partial success: " + "; ".join(errors)

    db.commit()
    logger.info(f"Post {post.id} -> status={post.status.value}")
