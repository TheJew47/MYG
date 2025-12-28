# backend/app/auth.py
import httpx
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from app.config import settings
import logging

logger = logging.getLogger("uvicorn.error")
security = HTTPBearer()

# Cache for keys to avoid repeated network calls
_jwks_cache = {}

async def get_supabase_keys(token: str):
    """Fetches all active public keys from Supabase and finds the one matching the token."""
    global _jwks_cache
    
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        # If the key is already in cache, return it immediately
        if kid in _jwks_cache:
            return _jwks_cache[kid]

        # Extract project ref from DB_HOST (e.g., 'bvlhcjgyuetelksvryly')
        project_ref = settings.DB_HOST.split('.')[1]
        jwks_url = f"https://{project_ref}.supabase.co/auth/v1/jwks"
        
        logger.info(f"AUTH: Fetching JWKS from {jwks_url}")
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url)
            jwks = response.json()
        
        # Store all keys in the cache
        for key in jwks.get("keys", []):
            _jwks_cache[key["kid"]] = key
            
        if kid not in _jwks_cache:
            logger.error(f"AUTH ERROR: Key ID {kid} not found in Supabase JWKS.")
            return None
            
        return _jwks_cache[kid]
    except Exception as e:
        logger.error(f"AUTH ERROR: Failed to retrieve keys: {str(e)}")
        return None

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    token = credentials.credentials
    
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        
        # 1. Handle ECC (P-256 / ES256) keys - The 'Current' key in your screenshot
        if alg == "ES256":
            key = await get_supabase_keys(token)
            if not key:
                raise HTTPException(status_code=401, detail="Could not verify token identity.")
        
        # 2. Handle Legacy HS256 keys - The 'Previous' key in your screenshot
        else:
            # For HS256, use the secret string from your .env file
            key = settings.SUPABASE_JWT_SECRET

        payload = jwt.decode(
            token, 
            key, 
            algorithms=["HS256", "ES256"],
            options={"verify_aud": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: sub missing.")
            
        return user_id

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired.")
    except JWTError as e:
        logger.error(f"AUTH ERROR: JWT Verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
