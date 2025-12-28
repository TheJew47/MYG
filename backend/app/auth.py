# backend/app/auth.py
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from app.config import settings
import logging

# Initialize logger to see errors in 'docker-compose logs'
logger = logging.getLogger("uvicorn.error")
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Verified JWT using HS256 Shared Secret.
    This works because your current Supabase key is 'Legacy HS256'.
    """
    token = credentials.credentials
    
    if not settings.SUPABASE_JWT_SECRET:
        logger.error("AUTH ERROR: SUPABASE_JWT_SECRET is not set in environment!")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Backend configuration error."
        )

    try:
        # HS256 is symmetric - we verify using the secret string directly.
        # verify_aud=False is required as Supabase uses 'authenticated' as the audience.
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            logger.error("AUTH ERROR: 'sub' (User UUID) missing from token.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token structure."
            )
            
        return user_id

    except ExpiredSignatureError:
        logger.warning("AUTH WARNING: Token has expired.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Session expired. Please log in again."
        )
    except JWTError as e:
        # If this happens now, it means the secret in .env is wrong 
        # OR you haven't logged out/in to get the new HS256 token.
        logger.error(f"AUTH ERROR: JWT Verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Authentication failed: {str(e)}"
        )
