import os
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

# PROTOTYPE MODE: We accept unverified tokens to extract the user ID.
# In production, you would verify the signature using CLERK_PEM_PUBLIC_KEY.
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    token = credentials.credentials
    try:
        # Decode without signature verification for local prototype speed
        payload = jwt.get_unverified_claims(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid Token Subject")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid Token")