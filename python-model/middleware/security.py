import os
from fastapi import Header, HTTPException, status
from dotenv import load_dotenv

load_dotenv()

def verify_api_key(x_api_key: str = Header(...)):
    expected = os.getenv("API_KEY", "default-key")
    print(f"Expected API Key: {expected}")
    print(f"Received API Key: {x_api_key}")
    if not expected or x_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )
