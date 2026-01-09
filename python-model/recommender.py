"""Lightweight recommender helpers used by FastAPI endpoints.
These helpers are import-safe: they do not run heavy training on import.
"""
from typing import Optional, Dict, Any, Tuple
import os
import requests
import pandas as pd
import numpy as np
import re
import ast
import random
from spacy.util import is_package
from spacy.cli import download
import spacy
from spacy.lang.nl.stop_words import STOP_WORDS as NL_STOP
from spacy.lang.en.stop_words import STOP_WORDS as EN_STOP
from nltk.stem.snowball import SnowballStemmer
from sklearn.preprocessing import StandardScaler, normalize
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from implicit.als import AlternatingLeastSquares
from scipy.sparse import csr_matrix

STOPWORDS = NL_STOP.union(EN_STOP)
stemmer_nl = SnowballStemmer("dutch")
stemmer_en = SnowballStemmer("english")

_nlp_nl = None
_nlp_en = None

def _load_spacy_model(name: str):
    if not is_package(name):
        download(name)
    return spacy.load(name)


def _get_spacy_models():
    global _nlp_nl, _nlp_en
    if _nlp_nl is None:
        _nlp_nl = _load_spacy_model("nl_core_news_sm")
    if _nlp_en is None:
        _nlp_en = _load_spacy_model("en_core_web_sm")
    return _nlp_nl, _nlp_en


def parse_tags(val):
    if isinstance(val, list):
        return [str(x).strip() for x in val if str(x).strip()]
    if pd.isna(val):
        return []
    s = str(val).strip()
    if not s:
        return []
    try:
        parsed = ast.literal_eval(s)
        if isinstance(parsed, (list, tuple)):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    if "," in s:
        return [p.strip() for p in s.split(",") if p.strip()]
    if ";" in s:
        return [p.strip() for p in s.split(";") if p.strip()]
    return [s]


def preprocess_tags(tags):
    processed = []
    for t in tags:
        t = t.lower().strip()
        if t and t not in STOPWORDS:
            if t.isascii():
                processed.append(stemmer_en.stem(t))
            else:
                processed.append(stemmer_nl.stem(t))
    return processed


def preprocess_text(text, nlp_nl, nlp_en):
    text = str(text).lower()
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    tokens = text.split()

    doc_nl = nlp_nl(" ".join(tokens))
    tokens_nl = [
        stemmer_nl.stem(token.lemma_)
        for token in doc_nl
        if token.lemma_ and token.lemma_ not in STOPWORDS
    ]

    if len(tokens_nl) < max(1, len(tokens)//2):
        doc_en = nlp_en(" ".join(tokens))
        tokens_en = [
            stemmer_en.stem(token.lemma_)
            for token in doc_en
            if token.lemma_ and token.lemma_ not in STOPWORDS
        ]
        return " ".join(tokens_en)
    return " ".join(tokens_nl)


from security.http import AuthenticatedSession

def fetch_remote_modules_users() -> Tuple[pd.DataFrame, pd.DataFrame]:
    modules_url = os.getenv("MODULES_API_URL")
    users_url = os.getenv("USERS_API_URL")

    session = AuthenticatedSession()

    modules = None
    users = pd.DataFrame()

    if modules_url:
        r = session.get(modules_url, timeout=15)
        r.raise_for_status()
        modules = pd.DataFrame(r.json()["vkms"])

    if users_url:
        try:
            r = session.get(users_url, timeout=15)
            r.raise_for_status()
            users = pd.DataFrame(r.json())
        except Exception:
            users = pd.DataFrame()

    if modules is None:
        local = os.path.join(
            os.path.dirname(__file__),
            os.getenv("MODULES_LOCAL_CSV", "Uitgebreide_VKM_dataset_cleaned.csv")
        )
        if not os.path.exists(local):
            raise RuntimeError("No module source available")
        modules = pd.read_csv(local)

    return modules, users

def build_explanation(row, weights):
    reasons = []
    signals = {}

    # --- Content similarity (favorites) ---
    if row.content_sim_scaled == 0.0:
        content_text = "Je hebt (nog) geen of te weinig favorieten opgegeven om een sterke inhoudelijke vergelijking te maken."
    elif row.content_sim_scaled >= 0.7:
        content_text = "Deze module lijkt sterk op jouw favoriete modules."
        signals["content_match"] = row.content_sim_scaled
    elif row.content_sim_scaled >= 0.4:
        content_text = "Deze module vertoont duidelijke overeenkomsten met jouw favoriete modules."
        signals["content_match"] = row.content_sim_scaled
    elif row.content_sim_scaled >= 0.01:
        content_text = "Deze module heeft enkele inhoudelijke overeenkomsten met jouw favoriete modules."
        signals["content_match"] = row.content_sim_scaled
    else:
        content_text = "Op basis van je favorieten is er weinig inhoudelijke overeenkomst."

    if row.content_sim_scaled > 0:
        reasons.append(content_text)

    # --- Profile similarity ---
    if row.profile_sim_scaled == 0.0:
        profile_text = "Je profiel bevat weinig of geen interesses, waardoor de profielmatch beperkt is."
    elif row.profile_sim_scaled >= 0.65:
        profile_text = "Deze module sluit zeer goed aan bij de interesses die je in je profiel hebt opgegeven."
        signals["profile_match"] = row.profile_sim_scaled
    elif row.profile_sim_scaled >= 0.40:
        profile_text = "Deze module sluit redelijk aan bij je profielinteresses."
        signals["profile_match"] = row.profile_sim_scaled
    elif row.profile_sim_scaled >= 0.01:
        profile_text = "Deze module sluit beperkt aan bij je profielinteresses."
        signals["profile_match"] = row.profile_sim_scaled

    if row.profile_sim_scaled > 0:
        reasons.append(profile_text)

    # --- Popularity ---
    if row.popularity_norm > 0.6:
        pop_text = "Deze module wordt vaak gekozen door andere gebruikers."
        signals["popularity"] = row.popularity_norm
    elif row.popularity_norm > 0.3:
        pop_text = "Deze module heeft een gemiddelde populariteit onder gebruikers."
    else:
        pop_text = "Deze module wordt minder vaak gekozen, maar kan inhoudelijk alsnog goed passen."

    reasons.append(pop_text)

    # --- Collaborative filtering ---
    if row.cf_score_scaled > 0.7:
        cf_text = "Gebruikers met vergelijkbare interesses waarderen deze module sterk."
        signals["collaborative"] = row.cf_score_scaled
        reasons.append(cf_text)
    elif row.cf_score_scaled > 0.4:
        cf_text = "Gebruikers met vergelijkbare interesses vinden deze module doorgaans interessant."
        signals["collaborative"] = row.cf_score_scaled
        reasons.append(cf_text)
    elif row.cf_score_scaled > 0.0:
        cf_text = "Gebruikers met vergelijkbare interesses kiezen deze module af en toe."
        reasons.append(cf_text)

    # --- Fallback ---
    if not reasons:
        reasons.append("Deze aanbeveling is gebaseerd op een combinatie van algemene inhoudelijke kenmerken.")

    return {
        "summary": " • ".join(reasons),
        "signals": signals,
        "weights_used": weights,
        "final_score": float(row.final_score),
        "score_breakdown": {
            "content_similarity": float(row.content_sim_scaled),
            "profile_similarity": float(row.profile_sim_scaled),
            "popularity": float(row.popularity_norm),
            "collaborative": float(row.cf_score_scaled),
        }
    }



def build_model_from_dataframe(
    df: pd.DataFrame,
    users_demo: Optional[pd.DataFrame] = None,
    num_dummy_users: int = 50,
    tfidf_max_features: int = 5000,
    pca_components: int = 50,
    als_params: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    nlp_nl, nlp_en = _get_spacy_models()

    df = df.copy()
    if "id" not in df.columns:
        raise ValueError("Dataset MUST contain a real 'id' column.")

    TAG_CANDIDATES = ["tags_list", "module_tags_str", "tags"]
    tag_col = next((c for c in TAG_CANDIDATES if c in df.columns), None)
    df["tags_list"] = df[tag_col].apply(parse_tags) if tag_col else [[] for _ in range(len(df))]
    df["tags_list_nlp"] = df["tags_list"].apply(preprocess_tags)

    def _build_text(r):
        combined = " ".join([str(r.get("shortdescription", "")), str(r.get("description", "")), " ".join(r.get("tags_list", []))]).strip()
        return preprocess_text(combined, nlp_nl, nlp_en)

    df["module_text"] = df.apply(_build_text, axis=1)

    vectorizer = TfidfVectorizer(max_features=tfidf_max_features, ngram_range=(1,2), min_df=2)
    module_tfidf = vectorizer.fit_transform(df["module_text"])
    module_tfidf_dense = module_tfidf.toarray()

    if users_demo is None:
        users_demo = pd.DataFrame({"user_id": [], "name": [], "favorite_id": [], "profile_text": []})
    user_profile_tfidf = vectorizer.transform(users_demo["profile_text"].fillna("").tolist()).toarray() if len(users_demo) else np.zeros((0, module_tfidf.shape[1]))

    NUM_COLS = [c for c in ["studycredit","estimated_difficulty","interests_match_score","popularity_score"] if c in df.columns]
    scaler = StandardScaler()
    if NUM_COLS:
        numeric_scaled = scaler.fit_transform(df[NUM_COLS])
    else:
        numeric_scaled = np.zeros((len(df),0))

    module_vectors = np.hstack([module_tfidf_dense, numeric_scaled])
    pca = PCA(n_components=min(pca_components, module_vectors.shape[1]), random_state=42)
    module_vectors_pca = pca.fit_transform(module_vectors)

    # synthetic interactions
    all_ids = df["id"].tolist()
    ratings = []
    for user_id in range(num_dummy_users):
        low_credit = (
            df[df.get("studycredit", 0) == 15].sample(min(2, len(df)), replace=True)["id"].tolist()
            if "studycredit" in df.columns else []
        )
        hard_modules = df[df.get("estimated_difficulty", 0) >= df.get("estimated_difficulty", 0).quantile(0.75)].sample(min(2, len(df)), replace=True)["id"].tolist() if "estimated_difficulty" in df.columns else []
        popular_modules = df[df.get("popularity_score", 0) >= df.get("popularity_score", 0).quantile(0.75)].sample(min(2, len(df)), replace=True)["id"].tolist() if "popularity_score" in df.columns else []
        favs = list(set(low_credit + hard_modules + popular_modules))
        if len(favs) < 3:
            favs += random.sample(all_ids, 3 - len(favs))
        for mid in favs:
            ratings.append((user_id, mid, 1.0))

    user_ids = sorted({r[0] for r in ratings})
    item_ids = sorted({r[1] for r in ratings})
    user_map = {u: i for i, u in enumerate(user_ids)}
    item_map = {m: i for i, m in enumerate(item_ids)}
    item_map_inv = {v: k for k, v in item_map.items()}

    rows, cols, data = [], [], []
    for u, m, score in ratings:
        rows.append(item_map[m])
        cols.append(user_map[u])
        data.append(score)
    interaction_matrix = csr_matrix((data, (rows, cols)), shape=(len(item_ids), len(user_ids)))

    als_defaults = dict(factors=32, regularization=0.05, iterations=25, random_state=42)
    if als_params:
        als_defaults.update(als_params)
    als_model = AlternatingLeastSquares(**als_defaults)
    if interaction_matrix.shape[0] > 0 and interaction_matrix.shape[1] > 0:
        als_model.fit(interaction_matrix)

    model_bundle = {
        "df": df,
        "module_vectors_pca": module_vectors_pca,
        "vectorizer": vectorizer,
        "pca": pca,
        "scaler": scaler,
        "als_model": als_model,
        "user_map": user_map,
        "item_map": item_map,
        "item_map_inv": item_map_inv,
        "interaction_matrix": interaction_matrix,
        "module_tfidf_dense": module_tfidf_dense,
        "user_profile_tfidf": user_profile_tfidf,
        "users_demo": users_demo,
    }
    return model_bundle


def recommend_from_model(
    model_bundle: Dict[str, Any],
    user_row: Dict[str, Any],
    top_n: int = 5,
    w_content: float = 0.45,
    w_pop: float = 0.05,
    w_cf: float = 0.0,
    w_profile: float = 0.5,
):
    df = model_bundle["df"]
    module_vectors_pca = model_bundle["module_vectors_pca"]
    module_tfidf_dense = model_bundle["module_tfidf_dense"]
    als_model = model_bundle.get("als_model")
    user_map = model_bundle.get("user_map", {})
    item_map_inv = model_bundle.get("item_map_inv", {})
    interaction_matrix = model_bundle.get("interaction_matrix")

    # Favorites
    fav_ids = [fid for fid in user_row.get("favorite_id", []) if fid in df["id"].values]
    fav_indices = df[df["id"].isin(fav_ids)].index.tolist()

    # Profile tekst
    has_profile = bool(user_row.get("profile_text", "").strip())

    # Als geen favorites en geen profieltekst → return lege recommendations
    if not fav_indices and not has_profile:
        return pd.DataFrame(columns=["id", "name", "shortdescription", "tags_list"]), pd.DataFrame()

    # --- Content similarity (optioneel, alleen als favorites aanwezig zijn) ---
    if fav_indices:
        fav_vectors = module_vectors_pca[fav_indices]
        user_vec = fav_vectors.mean(axis=0).reshape(1, -1)
        sims = cosine_similarity(normalize(user_vec), normalize(module_vectors_pca))[0]
        content_sim_scaled = (sims - sims.min()) / max(1e-9, sims.max() - sims.min())
    else:
        content_sim_scaled = np.zeros(len(df))

    # --- Profile similarity (optioneel, alleen als profieltekst aanwezig is) ---
    profile_scaled = np.zeros(len(df))
    if has_profile:
        vectorizer = model_bundle["vectorizer"]
        nlp_nl, nlp_en = _get_spacy_models()
        profile_text_clean = preprocess_text(user_row["profile_text"], nlp_nl, nlp_en)
        profile_vec = vectorizer.transform([profile_text_clean]).toarray()
        profile_sims = cosine_similarity(profile_vec, module_tfidf_dense)[0]
        profile_scaled = (profile_sims - profile_sims.min()) / max(1e-9, profile_sims.max() - profile_sims.min())

    # --- Popularity ---
    popularity_norm = df["popularity_score"] / (df["popularity_score"].max() + 1e-9) if "popularity_score" in df.columns else np.zeros(len(df))

    # --- Collaborative filtering (optioneel, alleen als favorites aanwezig zijn) ---
    cf_raw = np.zeros(len(df))
    if fav_indices and user_row.get("user_id") in user_map and als_model is not None and interaction_matrix is not None:
        uidx = user_map[user_row["user_id"]]
        rec_ids, rec_scores = als_model.recommend(
            userid=uidx, user_items=interaction_matrix.T, N=len(item_map_inv), filter_already_liked_items=False
        )
        score_map = {item_map_inv[i]: s for i, s in zip(rec_ids, rec_scores)}
        cf_raw = np.array([score_map.get(mid, 0.0) for mid in df["id"]])

    cf_scaled = (cf_raw - cf_raw.min()) / max(1e-9, cf_raw.max() - cf_raw.min())

    # --- Dynamische weging afhankelijk van aanwezige signalen ---
    active_weights = {
        "content": w_content if fav_indices else 0,
        "profile": w_profile if has_profile else 0,
        "popularity": w_pop if "popularity_score" in df.columns else 0,
        "collaborative": w_cf if fav_indices else 0
    }
    weight_sum = sum(active_weights.values())
    if weight_sum == 0:  # edge-case safeguard
        weight_sum = 1

    hybrid_final = (
        active_weights["content"] * content_sim_scaled +
        active_weights["profile"] * profile_scaled +
        active_weights["popularity"] * popularity_norm +
        active_weights["collaborative"] * cf_scaled
    ) / weight_sum

    # --- Bouw recommendation rows ---
    rows = []
    for idx, row in df.iterrows():
        if row["id"] in fav_ids:
            continue
        rows.append({
            "id": row["id"],
            "name": row.get("name", ""),
            "shortdescription": row.get("shortdescription", ""),
            "content_sim_scaled": float(content_sim_scaled[idx]),
            "profile_sim_scaled": float(profile_scaled[idx]),
            "popularity_norm": float(popularity_norm[idx]) if hasattr(popularity_norm, "__len__") else float(popularity_norm[idx]),
            "cf_score_scaled": float(cf_scaled[idx]),
            "final_score": float(hybrid_final[idx])
        })

    rec_df = pd.DataFrame(rows).sort_values("final_score", ascending=False).head(top_n)
    fav_table = df.loc[fav_indices][["id", "name", "shortdescription", "tags_list"]]

    # 🔹 DEBUG PER TOP-N RECOMMENDATION
    print(
        "PROFILE DEBUG:",
        "has_profile_text=", has_profile,
        "fav_present=", bool(fav_indices),
        "profile_mean=", float(profile_scaled.mean()),
        "profile_max=", float(profile_scaled.max()),
        "final_mean=", float(hybrid_final.mean())
    )
    print("\nTOP RECOMMENDATIONS SCORES:")
    for idx, row in rec_df.iterrows():
        print(f"Module: {row['name']} | "
              f"fav_indices: {fav_indices} | "
              f"Content/Fav: {row['content_sim_scaled']:.3f} | "
              f"Profile: {row['profile_sim_scaled']:.3f} | "
              f"Pop: {row['popularity_norm']:.3f} | "
              f"CF: {row['cf_score_scaled']:.3f} | "
              f"Final: {row['final_score']:.3f}")

    return fav_table, rec_df




def evaluate_user_from_model(model_bundle: Dict[str, Any], user_id: int, k: int =5, sim_threshold: float =0.35):
    users_demo = model_bundle.get("users_demo")
    df = model_bundle.get("df")
    module_vectors_pca = model_bundle.get("module_vectors_pca")

    if users_demo is None or len(users_demo) == 0:
        raise ValueError("No user profiles available for evaluation")

    user_row = users_demo[users_demo["user_id"]==user_id].iloc[0]
    fav_ids = user_row["favorite_id"] or []
    fav_ids = [fid for fid in fav_ids if fid in df["id"].values]
    fav_indices = df[df["id"].isin(fav_ids)].index.tolist()

    sim_profile_threshold = 0.05

    fav_table, rec_df = recommend_from_model(model_bundle, user_row, top_n=k)
    recommended_ids = rec_df["id"].tolist()

    sims_fav = None
    if fav_ids:
        fav_indices = df[df["id"].isin(fav_ids)].index.tolist()
        fav_vec = module_vectors_pca[fav_indices].mean(axis=0).reshape(1, -1)
        sims_fav = cosine_similarity(normalize(fav_vec), normalize(module_vectors_pca))[0]

    sims_profile_tfidf = None
    if user_row.get("profile_text", "").strip():
        uid = users_demo[users_demo["user_id"]==user_id].index[0]
        profile_vec_tfidf = model_bundle.get("user_profile_tfidf")[uid].reshape(1,-1)
        sims_profile_tfidf = cosine_similarity(profile_vec_tfidf, model_bundle.get("module_tfidf_dense"))[0]

    if sims_fav is not None and sims_profile_tfidf is not None:
        relevant_mask = (sims_fav >= sim_threshold) | (sims_profile_tfidf >= sim_profile_threshold)
    elif sims_fav is not None:
        relevant_mask = sims_fav >= sim_threshold
    elif sims_profile_tfidf is not None:
        relevant_mask = sims_profile_tfidf >= sim_profile_threshold
    else:
        relevant_mask = np.zeros(len(df), dtype=bool)

    if fav_ids:
        relevant_mask[df["id"].isin(fav_ids)] = False
    relevant_ids = df.loc[relevant_mask, "id"].tolist()

    hits = len(set(recommended_ids[:k]) & set(relevant_ids))
    precision = hits / k
    recall = hits / max(1, len(relevant_ids))
    hit_rate = 1 if hits > 0 else 0

    return {"precision_at_k": precision, "recall_at_k": recall, "hit_rate_at_k": hit_rate}
