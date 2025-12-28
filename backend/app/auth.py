# backend/app/auth.py
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from app.config import settings

# Setup the Bearer token scheme
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Verifies the Supabase JWT token using the HS256 algorithm and the 
    SUPABASE_JWT_SECRET. Returns the user's UUID if valid.
    """
    token = credentials.credentials
    
    # Safety check for configuration
    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Backend Error: SUPABASE_JWT_SECRET is not configured."
        )

    try:
        # Decode and verify the signature of the Supabase token
        # Note: We disable audience verification as Supabase uses different 
        # strings like 'authenticated' or 'anon' depending on the session.
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        
        # The 'sub' claim in Supabase tokens is the User's UUID
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid Token: User ID (sub) not found in payload."
            )
            
        return user_id

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Your session has expired. Please log in again."
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Authentication failed: {str(e)}"
        )