# api_recommend.py
from fastapi import APIRouter, Depends
from middleware.security import verify_api_key
from recommender import recommend_from_model, build_explanation
from modelstore import load_model
import numpy as np
from typing import Dict, Any


router = APIRouter()

# api_recommend.py

@router.post("/recommend-explain", dependencies=[Depends(verify_api_key)])
def recommend_explain(payload: Dict[str, Any]):
    model = load_model()
    user = payload.get("user", {})
    top_n = payload.get("top_n", 5)

    favs, rec_df = recommend_from_model(model, user, top_n=top_n)

    weights = {
        "content": 0.45,
        "profile": 0.50,
        "popularity": 0.05,
        "collaborative": 0.0
    }

    recommendations = []
    for _, row in rec_df.iterrows():
        explanation = build_explanation(row, weights)

        recommendations.append({
            "_id": row._id,
            "name": row.get("name", ""),
            "score": explanation["final_score"],
            "explanation": explanation["summary"],
            "details": {
                "signals": explanation["signals"],
                "weights": explanation["weights_used"]
            }
        })

    return {
        "user_context": {
            "favorite_ids": user.get("favorite_id", []),
            "used_profile": bool(user.get("profile_text"))
        },
        "recommendations": recommendations
    }

@router.post("/recommend", dependencies=[Depends(verify_api_key)])
def recommend(payload: Dict[str, Any]):
    model = load_model()
    user = payload.get("user", {})
    top_n = payload.get("top_n", 5)

    fav_table, rec_df = recommend_from_model(model, user, top_n)
    # return simple list
    return {"recommendations": rec_df[["_id","final_score"]].rename(columns={"final_score":"score"}).to_dict(orient="records")}
