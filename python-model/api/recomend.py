# api_recommend.py
@router.post("/recommend", dependencies=[Depends(verify_api_key)])
def recommend(payload: dict):
    model = load_model()

    user = payload["user"]
    top_n = payload.get("top_n", 5)

    recs = recommend_hybrid(model, user, top_n)
    return {"recommendations": recs}
