# api_recommend.py
from fastapi import APIRouter, Depends
from middleware.security import verify_api_key
from recommender import recommend_from_model
from modelstore import load_model
import numpy as np
from typing import Dict, Any


router = APIRouter()

@router.post("/recommend-explain", dependencies=[Depends(verify_api_key)])
def recommend_explain(payload: Dict[str, Any]):
    """Hybrid recommendation with simple explanations."""
    model = load_model()
    user = payload.get("user", {})
    top_n = payload.get("top_n", 5)

    fav_table, rec_df = recommend_from_model(model, user, top_n=top_n)

    # build simple explanation from returned scores
    recs_with_explanation = []
    for _, row in rec_df.iterrows():
        explanation = []
        if row.content_sim_scaled >= 0.7:
            explanation.append("Sterke content-match met favorieten")
        elif row.content_sim_scaled >= 0.4:
            explanation.append("Redelijke content-match")
        if row.profile_sim_scaled > 0:
            explanation.append("Matches profielinteresses")
        if row.popularity_norm > 0.5:
            explanation.append("Populair")
        recs_with_explanation.append({
            "id": int(row.id),
            "score": float(row.final_score),
            "explanation": ", ".join(explanation) if explanation else "Geen specifieke verklaring"
        })

    return {"recommendations": recs_with_explanation}
@router.post("/recommend", dependencies=[Depends(verify_api_key)])
def recommend(payload: Dict[str, Any]):
    model = load_model()
    user = payload.get("user", {})
    top_n = payload.get("top_n", 5)

    fav_table, rec_df = recommend_from_model(model, user, top_n)
    # return simple list
    return {"recommendations": rec_df[["id","final_score"]].rename(columns={"final_score":"score"}).to_dict(orient="records")}
