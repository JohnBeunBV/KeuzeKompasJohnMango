import os
from fastapi import Header, HTTPException, status
from dotenv import load_dotenv

load_dotenv()

def verify_api_key(x_api_key: str | None = Header(None)):
    expected = os.getenv("PYTHON_API_KEY")

    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key"
        )

    if not expected or x_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
