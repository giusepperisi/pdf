import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.social_account import SocialAccount
from app.schemas.social_account import (
    SocialAccountCreate,
    SocialAccountRead,
    SocialAccountUpdate,
    TokenVerifyResult,
)
from app.services import meta_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/social-accounts", tags=["social_accounts"])


def _encrypt_token(plain_token: str) -> str:
    from app.config import settings
    from cryptography.fernet import Fernet

    if not settings.fernet_key:
        raise ValueError("FERNET_KEY not configured. Run: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"")
    f = Fernet(settings.fernet_key.encode())
    return f.encrypt(plain_token.encode()).decode()


def _decrypt_token(encrypted_token: str) -> str:
    from app.config import settings
    from cryptography.fernet import Fernet

    if not settings.fernet_key:
        raise ValueError("FERNET_KEY not configured")
    f = Fernet(settings.fernet_key.encode())
    return f.decrypt(encrypted_token.encode()).decode()


def _build_read(account: SocialAccount) -> SocialAccountRead:
    from app.services.meta_service import get_token_expiry_days
    days = get_token_expiry_days(account.token_expires_at)
    data = SocialAccountRead.model_validate(account)
    data.days_until_expiry = days
    return data


@router.get("/", response_model=List[SocialAccountRead])
def list_social_accounts(db: Session = Depends(get_db)):
    accounts = db.query(SocialAccount).all()
    return [_build_read(a) for a in accounts]


@router.post("/", response_model=SocialAccountRead, status_code=status.HTTP_201_CREATED)
def create_social_account(payload: SocialAccountCreate, db: Session = Depends(get_db)):
    try:
        encrypted = _encrypt_token(payload.access_token)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    account = SocialAccount(
        platform=payload.platform,
        page_id=payload.page_id,
        page_name=payload.page_name,
        access_token_encrypted=encrypted,
        token_expires_at=payload.token_expires_at,
        ig_business_id=payload.ig_business_id,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _build_read(account)


@router.get("/{account_id}", response_model=SocialAccountRead)
def get_social_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")
    return _build_read(account)


@router.patch("/{account_id}", response_model=SocialAccountRead)
def update_social_account(account_id: int, payload: SocialAccountUpdate, db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "access_token" in update_data:
        try:
            account.access_token_encrypted = _encrypt_token(update_data.pop("access_token"))
        except ValueError as e:
            raise HTTPException(status_code=500, detail=str(e))

    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return _build_read(account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_social_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")
    db.delete(account)
    db.commit()


@router.post("/{account_id}/verify", response_model=TokenVerifyResult)
async def verify_social_account(account_id: int, db: Session = Depends(get_db)):
    """Verify that the stored access token is still valid."""
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")

    try:
        token = _decrypt_token(account.access_token_encrypted)
    except Exception as e:
        return TokenVerifyResult(valid=False, error=f"Token decryption failed: {e}")

    result = await meta_service.verify_token(token)
    return TokenVerifyResult(**result)
