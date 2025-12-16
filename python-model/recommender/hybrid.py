# recommender/hybrid.py
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def build_user_vector(model: dict, user: dict):
    """
    Build hybrid user vector from:
    - favorite module IDs
    - optional profile text
    """

    df = model["df"]
    module_vectors = model["module_vectors_pca"]
    vectorizer = model["vectorizer"]
    pca = model["pca"]

    # ---- favorites ----
    fav_ids = user.get("favorite_id", [])
    fav_indices = df.index[df["id"].isin(fav_ids)].tolist()

    if fav_indices:
        fav_vec = np.mean(module_vectors[fav_indices], axis=0)
    else:
        fav_vec = np.zeros(module_vectors.shape[1])

    # ---- profile text ----
    profile_text = user.get("profile_text", "")
    if profile_text.strip():
        tfidf = vectorizer.transform([profile_text]).toarray()
        profile_vec = pca.transform(
            np.hstack([tfidf, np.zeros((1, model["scaler"].n_features_in_))])
        )[0]
    else:
        profile_vec = np.zeros_like(fav_vec)

    # ---- weighted fusion ----
    user_vector = 0.7 * fav_vec + 0.3 * profile_vec
    return user_vector


def recommend_hybrid(model: dict, user: dict, top_n: int = 5):
    df = model["df"]
    module_vectors = model["module_vectors_pca"]
    svd = model["svd"]

    user_id = user.get("user_id", -1)
    user_vector = build_user_vector(model, user)

    # ---- content similarity ----
    content_scores = cosine_similarity(
        user_vector.reshape(1, -1),
        module_vectors
    )[0]

    # ---- collaborative filtering ----
    cf_scores = np.array([
        svd.predict(user_id, mid).est
        for mid in df["id"]
    ])

    # ---- normalize ----
    def norm(x):
        return (x - x.min()) / (x.max() - x.min() + 1e-8)

    content_scores = norm(content_scores)
    cf_scores = norm(cf_scores)

    # ---- hybrid fusion ----
    final_scores = 0.6 * content_scores + 0.4 * cf_scores

    # ---- remove already liked ----
    fav_ids = set(user.get("favorite_id", []))
    mask = ~df["id"].isin(fav_ids)
    df_scored = df[mask].copy()
    df_scored["score"] = final_scores[mask.values]

    # ---- top-N ----
    top = df_scored.sort_values("score", ascending=False).head(top_n)

    return [
        {
            "id": int(row["id"]),
            "score": float(row["score"])
        }
        for _, row in top.iterrows()
    ]

def build_explanation(module_row, user, model, content_score):
    reasons = []

    # ---- favorites similarity ----
    fav_ids = set(user.get("favorite_id", []))
    if fav_ids:
        reasons.append("Similar to modules you liked")

    # ---- profile text ----
    profile_text = user.get("profile_text", "")
    if profile_text:
        reasons.append("Matches your stated interests")

    # ---- tag overlap ----
    user_words = set(profile_text.lower().split())
    module_tags = set(map(str.lower, module_row.get("tags_list", [])))
    overlap = user_words & module_tags
    if overlap:
        reasons.append(f"Related topics: {', '.join(list(overlap)[:3])}")

    # ---- fallback ----
    if not reasons:
        reasons.append("Relevant based on content similarity")

    return reasons
