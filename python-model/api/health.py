from fastapi import APIRouter
from modelstore import load_model

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.get("/model/status")
def model_status():
    try:
        m = load_model()
        return {"model": "loaded", "version": m.get("version")}
    except Exception as e:
        return {"model": "none", "error": str(e)}
