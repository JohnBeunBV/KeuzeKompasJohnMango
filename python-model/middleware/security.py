import os
from fastapi import Header, HTTPException, status
from dotenv import load_dotenv

load_dotenv()

def verify_api_key(x_api_key: str = Header(...)):
    expected = os.getenv("PYTHON_API_KEY")
    if not expected or x_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )
