# backend/app/auth.py
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from app.config import settings
import logging

# Initialize logger to see detailed messages in 'docker-compose logs'
logger = logging.getLogger("uvicorn.error")
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Verifies the Supabase JWT token and returns the user's UUID.
    """
    token = credentials.credentials
    
    if not settings.SUPABASE_JWT_SECRET:
        logger.error("AUTH ERROR: SUPABASE_JWT_SECRET is not set in environment!")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Backend Error: SUPABASE_JWT_SECRET is not configured."
        )

    try:
        # DEBUG: Log the header to see what 'alg' is actually being sent
        unverified_header = jwt.get_unverified_header(token)
        logger.info(f"AUTH DEBUG: Received token with header: {unverified_header}")

        # ADDED 'ES256' to the allowed algorithms list
        # Note: If this fails with 'Signature verification failed', it means 
        # your SUPABASE_JWT_SECRET is not the correct key for an ES256 token.
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256", "ES256"],
            options={"verify_aud": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            logger.error("AUTH ERROR: 'sub' (User UUID) missing from payload.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid Token: User ID not found."
            )
            
        return user_id

    except ExpiredSignatureError:
        logger.warning("AUTH WARNING: Authentication failed - Token has expired.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Session expired. Please log in again."
        )
    except JWTError as e:
        # If you see 'Signature verification failed', see the steps below
        logger.error(f"AUTH ERROR: JWT Verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Authentication failed: {str(e)}"
        )
