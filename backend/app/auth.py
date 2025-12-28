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
    token = credentials.credentials
    
    if not settings.SUPABASE_JWT_SECRET:
        logger.error("AUTH ERROR: SUPABASE_JWT_SECRET is not set in environment!")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Backend Error: SUPABASE_JWT_SECRET is not configured."
        )

    try:
        # HS256 is the default algorithm for Supabase JWTs
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            logger.error("AUTH ERROR: Token is valid but 'sub' (User UUID) is missing.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid Token: User ID (sub) not found."
            )
            
        return user_id

    except ExpiredSignatureError:
        logger.warning("AUTH WARNING: User tried to use an expired token.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Your session has expired. Please log in again."
        )
    except JWTError as e:
        # THIS IS THE MOST IMPORTANT LOG: It will tell you if the secret is wrong
        logger.error(f"AUTH ERROR: JWT Verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Authentication failed: {str(e)}"
        )
