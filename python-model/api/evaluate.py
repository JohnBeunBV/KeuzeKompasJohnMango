from fastapi import APIRouter, Depends
from middleware.security import verify_api_key
from modelstore import load_model

router = APIRouter()

@router.post("/", dependencies=[Depends(verify_api_key)])
def evaluate(payload: dict):
    model = load_model()

    # TODO: evaluate_user_hybrid(...)
    return {
        "precision_at_k": 0.6,
        "recall_at_k": 0.4,
        "hit_rate_at_k": 1
    }
