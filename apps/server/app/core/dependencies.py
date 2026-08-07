import uuid
import jwt
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.security import ALGORITHM
from app.core.redis import redis_client
from app.models.user import User
from app.models.property import Property

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # We use cookies for access token
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        
        if user_id_str is None or token_type != "access":
            raise credentials_exception
            
        user_id = uuid.UUID(user_id_str)
        
    except jwt.PyJWTError:
        raise credentials_exception
    except ValueError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

async def verify_refresh_token(request: Request) -> uuid.UUID:
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
        
    # Check if token is blacklisted
    is_blacklisted = await redis_client.get(f"blacklist:{token}")
    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        
        if user_id_str is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
            
        return uuid.UUID(user_id_str)
        
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

async def verify_property_access(property_id: uuid.UUID, current_user: User, db: AsyncSession) -> Property:
    result = await db.execute(
        select(Property).where(Property.id == property_id, Property.owner_id == current_user.id, Property.is_active == True)
    )
    property_obj = result.scalars().first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_obj
