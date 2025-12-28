# backend/app/auth.py
import requests
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from app.config import settings
import logging

logger = logging.getLogger("uvicorn.error")
security = HTTPBearer()

# Cache for the Public Key to avoid fetching it on every request
_public_key = None

def get_supabase_public_key(token: str):
    """Fetches the correct public key from Supabase's JWKS endpoint."""
    global _public_key
    if _public_key:
        return _public_key

    try:
        # Extract project reference from your DB Host (e.g., 'bvlhcjgyuetelksvryly')
        project_ref = settings.DB_HOST.split('.')[1]
        jwks_url = f"https://{project_ref}.supabase.co/auth/v1/jwks"
        
        response = requests.get(jwks_url)
        jwks = response.json()
        
        # Get the 'kid' from the token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        # Find the matching key in the JWKS
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                _public_key = key
                return _public_key
                
        raise Exception("Matching key not found in JWKS.")
    except Exception as e:
        logger.error(f"AUTH ERROR: Failed to fetch JWKS: {str(e)}")
        return None

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    token = credentials.credentials
    
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        
        # If the token is ES256, we must use the Public Key from JWKS
        if alg == "ES256":
            key = get_supabase_public_key(token)
            if not key:
                raise HTTPException(status_code=500, detail="Could not verify token identity.")
        else:
            # Fallback to HS256 using the Secret String
            key = settings.SUPABASE_JWT_SECRET

        payload = jwt.decode(
            token, 
            key, 
            algorithms=["HS256", "ES256"],
            options={"verify_aud": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid Token: sub missing.")
            
        return user_id

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired.")
    except JWTError as e:
        logger.error(f"AUTH ERROR: JWT Verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
