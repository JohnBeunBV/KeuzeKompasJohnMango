# api/train.py
from fastapi import APIRouter, BackgroundTasks, Depends
from middleware.security import verify_api_key
from middleware.validation import TrainRequest
from modelstore import save_model

import pandas as pd
import numpy as np
import re, ast, random
from sklearn.preprocessing import StandardScaler, normalize
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import spacy
from spacy.lang.nl.stop_words import STOP_WORDS as NL_STOP
from spacy.lang.en.stop_words import STOP_WORDS as EN_STOP
from nltk.stem.snowball import SnowballStemmer

router = APIRouter()

# ---- NLP boot (loaded once per container) ----
nlp_nl = spacy.load("nl_core_news_sm")
nlp_en = spacy.load("en_core_web_sm")
STOPWORDS = NL_STOP.union(EN_STOP)
stemmer_nl = SnowballStemmer("dutch")
stemmer_en = SnowballStemmer("english")

# ---------------------------------------------
# Cleaning helpers
# ---------------------------------------------

def parse_tags(val):
    if isinstance(val, list):
        return [str(x).strip() for x in val if str(x).strip()]
    if pd.isna(val):
        return []
    s = str(val).strip()
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

def preprocess_text(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", str(text).lower())
    tokens = text.split()

    doc_nl = nlp_nl(" ".join(tokens))
    nl_tokens = [
        stemmer_nl.stem(t.lemma_)
        for t in doc_nl
        if t.lemma_ and t.lemma_ not in STOPWORDS
    ]

    if len(nl_tokens) < max(1, len(tokens) // 2):
        doc_en = nlp_en(" ".join(tokens))
        return " ".join(
            stemmer_en.stem(t.lemma_)
            for t in doc_en
            if t.lemma_ and t.lemma_ not in STOPWORDS
        )

    return " ".join(nl_tokens)

# ---------------------------------------------
# Training pipeline
# ---------------------------------------------

def train_model(payload: TrainRequest):
    """
    Runs full cleanup + training pipeline.
    Safe to run in background.
    """

    # 1 Load modules from Node payload
    df = pd.DataFrame(payload.modules)

    if "id" not in df.columns:
        raise ValueError("Modules must contain 'id' field")

    # 2 Parse tags
    TAG_CANDIDATES = ["tags_list", "module_tags_str", "tags"]
    tag_col = next((c for c in TAG_CANDIDATES if c in df.columns), None)

    df["tags_list"] = (
        df[tag_col].apply(parse_tags) if tag_col else [[] for _ in range(len(df))]
    )

    # 3 Build module text
    df["module_text"] = df.apply(
        lambda r: preprocess_text(
            " ".join([
                str(r.get("shortdescription", "")),
                str(r.get("description", "")),
                " ".join(r.get("tags_list", []))
            ])
        ),
        axis=1
    )

    # 4 TF-IDF
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        min_df=2
    )
    module_tfidf = vectorizer.fit_transform(df["module_text"])
    module_tfidf_dense = module_tfidf.toarray()

    # 5 Numeric features
    NUM_COLS = [
        c for c in
        ["studycredit", "estimated_difficulty", "interests_match_score", "popularity_score"]
        if c in df.columns
    ]

    scaler = StandardScaler()
    numeric_scaled = (
        scaler.fit_transform(df[NUM_COLS]) if NUM_COLS else np.zeros((len(df), 0))
    )

    # 6 PCA
    module_vectors = np.hstack([module_tfidf_dense, numeric_scaled])
    pca = PCA(n_components=min(50, module_vectors.shape[1]), random_state=42)
    module_vectors_pca = pca.fit_transform(module_vectors)

    # 7 Collaborative Filtering (synthetic users)
    ratings = []
    all_ids = df["id"].tolist()

    for user_id in range(1, 51):
        favs = random.sample(all_ids, min(5, len(all_ids)))
        for mid in favs:
            ratings.append((user_id, mid, 1.0))

    cf_df = pd.DataFrame(ratings, columns=["user_id", "module_id", "rating"])
    reader = Reader(rating_scale=(0, 1))
    data = Dataset.load_from_df(cf_df, reader)
    trainset, _ = train_test_split(data, test_size=0.2)

    svd_model = SVD(
        n_factors=20,
        n_epochs=30,
        lr_all=0.005,
        reg_all=0.02
    )
    svd_model.fit(trainset)

    # 8 Persist everything
    save_model({
        "df": df,
        "vectorizer": vectorizer,
        "pca": pca,
        "svd": svd_model,
        "scaler": scaler,
        "module_vectors_pca": module_vectors_pca,
        "module_tfidf_dense": module_tfidf_dense,
        "numeric_cols": NUM_COLS
    })

# ---------------------------------------------
# API endpoint
# ---------------------------------------------

@router.post("/", dependencies=[Depends(verify_api_key)])
def train(request: TrainRequest, bg: BackgroundTasks):
    bg.add_task(train_model, request)
    return {"status": "training_started"}
