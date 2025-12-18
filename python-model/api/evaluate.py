from fastapi import APIRouter, Depends
from middleware.security import verify_api_key
from modelstore import load_model
from recommender import evaluate_user_from_model

router = APIRouter()

@router.post("/", dependencies=[Depends(verify_api_key)])
def evaluate(payload: dict):
    model = load_model()
    user_id = payload.get("user_id")
    if user_id is None:
        return {"error": "user_id required"}

    metrics = evaluate_user_from_model(model, int(user_id), k=payload.get("k", 5))
    return metrics
