# api_recommend.py
from fastapi import APIRouter, Depends
from middleware.security import verify_api_key
from recommender.hybrid import recommend_hybrid, build_user_vector, build_explanation
from modelstore import load_model
import numpy as np

router = APIRouter()

@router.post("/recommend-explain", dependencies=[Depends(verify_api_key)])
def recommend(payload: dict):
    """
    Hybrid recommendation API
    Expects:
    {
        "user": {
            "user_id": int,
            "favorite_id": [module_id, ...],
            "profile_text": str
        },
        "top_n": int
    }
    """
    model = load_model()
    user = payload.get("user", {})
    top_n = payload.get("top_n", 5)

    # ---- get recommendations ----
    recs_raw = recommend_hybrid(model, user, top_n=top_n)

    # ---- build explanations ----
    df = model["df"]
    recs_with_explanation = []
    for r in recs_raw:
        module_row = df[df["id"] == r["id"]].iloc[0]
        user_vector = build_user_vector(model, user)
        content_score = np.dot(user_vector, model["module_vectors_pca"][module_row.name])
        explanation = build_explanation(module_row, user, model, content_score)
        recs_with_explanation.append({
            "id": r["id"],
            "score": r["score"],
            "explanation": explanation
        })

    return {"recommendations": recs_with_explanation}
@router.post("/recommend", dependencies=[Depends(verify_api_key)])
def recommend(payload: dict):
    model = load_model()

    user = payload["user"]
    top_n = payload.get("top_n", 5)

    recs = recommend_hybrid(model, user, top_n)
    return {"recommendations": recs}
