# -----------------------------------------------------
# VKM Hybrid Module Recommender – PCA + CF with TF-IDF + Evaluation
# -----------------------------------------------------

import re
import spacy
from spacy.lang.nl.stop_words import STOP_WORDS as NL_STOP
from spacy.lang.en.stop_words import STOP_WORDS as EN_STOP
from nltk.stem.snowball import SnowballStemmer
from spacy.util import is_package
from spacy.cli import download
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, normalize
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import ast
from pathlib import Path
import matplotlib.pyplot as plt
import random
from IPython.display import display
from implicit.als import AlternatingLeastSquares
from scipy.sparse import csr_matrix

# -----------------------------------------------------
# 1. Load dataset
# -----------------------------------------------------
DATA_PATH = Path("Uitgebreide_VKM_dataset_cleaned3.csv")
df = pd.read_csv(DATA_PATH)
print("\n=== DATA LOADED === Rows:", df.shape[0], "Columns:", df.shape[1])
if "id" not in df.columns:
    raise ValueError("Dataset MUST contain a real 'id' column.")

# -----------------------------------------------------
# 2. Parse tags
# -----------------------------------------------------
TAG_CANDIDATES = ["tags_list", "module_tags_str", "tags"]
tag_col = next((c for c in TAG_CANDIDATES if c in df.columns), None)

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
    except:
        pass
    if "," in s:
        return [p.strip() for p in s.split(",") if p.strip()]
    if ";" in s:
        return [p.strip() for p in s.split(";") if p.strip()]
    return [s]

df["tags_list"] = df[tag_col].apply(parse_tags) if tag_col else [[] for _ in range(len(df))]

# -----------------------------------------------------
# 3. NLP + stopwords + stemmers
# -----------------------------------------------------

def load_spacy_model(name: str):
    if not is_package(name):
        download(name)
    return spacy.load(name)

nlp_nl = load_spacy_model("nl_core_news_sm")
nlp_en = load_spacy_model("en_core_web_sm")

STOPWORDS = NL_STOP.union(EN_STOP)
stemmer_nl = SnowballStemmer("dutch")
stemmer_en = SnowballStemmer("english")




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

df["tags_list_nlp"] = df["tags_list"].apply(preprocess_tags)

# -----------------------------------------------------
# 4. Build module text
# -----------------------------------------------------
def preprocess_text(text):
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

def build_module_text(row):
    combined_text = " ".join([
        str(row.get("shortdescription","")),
        str(row.get("description","")),
        " ".join(row.get("tags_list",[]))
    ]).strip()
    return preprocess_text(combined_text)

df["module_text"] = df.apply(build_module_text, axis=1)

# -----------------------------------------------------
# 5. Module TF-IDF embeddings
# -----------------------------------------------------
print("\n=== Building TF-IDF embeddings for modules ===")
vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1,2), min_df=2)

module_tfidf = vectorizer.fit_transform(df["module_text"])
module_tfidf_dense = module_tfidf.toarray()

# -----------------------------------------------------
# 5B. User profile TF-IDF embeddings
# -----------------------------------------------------
users_demo = pd.DataFrame({
    "user_id": [101, 102, 103],
    "name": ["Alice", "Bob", "Charlie"],
    "favorite_id": [[275,371,250], [160,350,395], []],
    "profile_text": [
        "",
        "Ik hou van bedrijfsanalyse en datavisualisatie.",
        "Ik ben geïnteresseerd in AI en machine learning"
    ]
})

user_profile_tfidf = vectorizer.transform(users_demo["profile_text"].fillna("").tolist()).toarray()

# -----------------------------------------------------
# 6. Numeric features
# -----------------------------------------------------
NUM_COLS = [c for c in ["studycredit","estimated_difficulty","interests_match_score","popularity_score"] if c in df.columns]
scaler = StandardScaler()
if NUM_COLS:
    numeric_scaled = scaler.fit_transform(df[NUM_COLS])
else:
    numeric_scaled = np.zeros((len(df),0))

# -----------------------------------------------------
# 7. Combine vectors + PCA
# -----------------------------------------------------
module_vectors = np.hstack([module_tfidf_dense, numeric_scaled])
pca = PCA(n_components=min(50, module_vectors.shape[1]), random_state=42)
module_vectors_pca = pca.fit_transform(module_vectors)
print("PCA shape:", module_vectors_pca.shape)

# -----------------------------------------------------
# 8. CF training set (IMPLICIT ALS)
# -----------------------------------------------------

# ---- build synthetic interactions ----
all_ids = df["id"].tolist()
ratings = []

NUM_DUMMY_USERS = 50

for user_id in range(NUM_DUMMY_USERS):
    low_credit = (
        df[df.get("studycredit", 0) == 15]
        .sample(min(2, len(df)), replace=True)["id"].tolist()
        if "studycredit" in df.columns else []
    )

    hard_modules = df[
        df["estimated_difficulty"] >= df["estimated_difficulty"].quantile(0.75)
    ].sample(min(2, len(df)), replace=True)["id"].tolist()

    popular_modules = df[
        df["popularity_score"] >= df["popularity_score"].quantile(0.75)
    ].sample(min(2, len(df)), replace=True)["id"].tolist()

    favs = list(set(low_credit + hard_modules + popular_modules))

    if len(favs) < 3:
        favs += random.sample(all_ids, 3 - len(favs))

    for mid in favs:
        ratings.append((user_id, mid, 1.0))

# ---- index mapping ----
user_ids = sorted({r[0] for r in ratings})
item_ids = sorted({r[1] for r in ratings})

user_map = {u: i for i, u in enumerate(user_ids)}
item_map = {m: i for i, m in enumerate(item_ids)}

# ---- sparse matrix (items x users REQUIRED by implicit) ----
rows, cols, data = [], [], []
for u, m, score in ratings:
    rows.append(item_map[m])
    cols.append(user_map[u])
    data.append(score)

interaction_matrix = csr_matrix(
    (data, (rows, cols)),
    shape=(len(item_ids), len(user_ids))
)

# ---- train ALS model ----
als_model = AlternatingLeastSquares(
    factors=32,
    regularization=0.05,
    iterations=25,
    random_state=42
)

als_model.fit(interaction_matrix)



# -----------------------------------------------------
# 9. Hybrid recommender (TF-IDF only)
# -----------------------------------------------------
def recommend_hybrid(user_row, top_n=5, w_content=0.45, w_pop=0.05, w_cf=0.0, w_profile=0.5):

    # Get fave modules
    fav_ids = [fid for fid in user_row["favorite_id"] if fid in df["id"].values]
    fav_indices = df[df["id"].isin(fav_ids)].index.tolist()

    # ------------------------------
    # CONTENT SIM = ONLY FAVORITES
    # ------------------------------

    if fav_indices:
        # Favorites already in PCA space
        fav_vectors = module_vectors_pca[fav_indices]
        user_vec = fav_vectors.mean(axis=0).reshape(1, -1)
    else:
        # Default: global mean PCA vector
        user_vec = module_vectors_pca.mean(axis=0).reshape(1, -1)

    # Content similarity
    sims = cosine_similarity(normalize(user_vec), normalize(module_vectors_pca))[0]
    content_sim_scaled = (sims - sims.min()) / max(1e-9, sims.max() - sims.min())

    # ------------------------------
    # PROFILE SIM = ONLY PROFILE TEXT
    # ------------------------------

    if user_row["profile_text"].strip():
        uidx = users_demo[users_demo["user_id"] == user_row["user_id"]].index[0]
        profile_vec = user_profile_tfidf[uidx].reshape(1, -1)
        profile_sims = cosine_similarity(profile_vec, module_tfidf_dense)[0]
        profile_scaled = (profile_sims - profile_sims.min()) / max(1e-9, profile_sims.max() - profile_sims.min())
    else:
        profile_scaled = np.zeros(len(df))

    # ------------------------------
    # POPULARITY
    # ------------------------------

    popularity_norm = df["popularity_score"] / (df["popularity_score"].max() + 1e-9)

    # ------------------------------
    # COLLABORATIVE FILTERING (implicit ALS)
    # ------------------------------
    if user_row["user_id"] in user_map:
        uidx = user_map[user_row["user_id"]]
        
        # recommend() returns top N, but we want scores for all items
        rec_ids, rec_scores = als_model.recommend(
            userid=uidx,
            user_items=interaction_matrix.T,  # implicit expects items x users
            N=len(item_map),
            filter_already_liked_items=False
        )
        
        # map back to module IDs
        score_map = {item_map_inv[i]: s for i, s in zip(rec_ids, rec_scores)}
        cf_raw = np.array([score_map.get(mid, 0.0) for mid in df["id"]])
    else:
        # new/unknown user -> zero scores
        cf_raw = np.zeros(len(df))

    # normalize
    cf_scaled = (cf_raw - cf_raw.min()) / max(1e-9, cf_raw.max() - cf_raw.min())

    # ------------------------------
    # FINAL SCORE
    # ------------------------------

    hybrid_final = (
        w_content * content_sim_scaled +
        w_pop * popularity_norm.values +
        w_cf * cf_scaled +
        w_profile * profile_scaled
    )

    # Build result table
    rows = []
    for idx, row in df.iterrows():
        if row["id"] in fav_ids:
            continue

        rows.append({
            "id": row["id"],
            "name": row["name"],
            "shortdescription": row["shortdescription"],
            "content_sim_scaled": float(content_sim_scaled[idx]),
            "profile_sim_scaled": float(profile_scaled[idx]),
            "popularity_norm": float(popularity_norm.iloc[idx]),
            "cf_score_scaled": float(cf_scaled[idx]),
            "final_score": float(hybrid_final[idx])
        })

    rec_df = pd.DataFrame(rows).sort_values("final_score", ascending=False).head(top_n)
    fav_table = df.loc[fav_indices][["id", "name", "shortdescription", "tags_list"]]

    return fav_table, rec_df


# -----------------------------------------------------
# 11. Evaluation metrics
# -----------------------------------------------------
def precision_at_k(recommended_ids, relevant_ids, k):
    recommended_k = recommended_ids[:k]
    hits = len(set(recommended_k) & set(relevant_ids))
    return hits / k

def recall_at_k(recommended_ids, relevant_ids, k):
    recommended_k = recommended_ids[:k]
    hits = len(set(recommended_k) & set(relevant_ids))
    return hits / max(1, len(relevant_ids))

def hit_rate_at_k(recommended_ids, relevant_ids, k):
    return 1 if len(set(recommended_ids[:k]) & set(relevant_ids)) > 0 else 0

def evaluate_user_hybrid(user_id, k=5, sim_threshold=0.35):
    user_row = users_demo[users_demo["user_id"]==user_id].iloc[0]
    fav_ids = user_row["favorite_id"] or []

    # --- NEW: Adaptive Thresholds ---
    # sim_threshold (0.35) remains for PCA-based (Favorites) relevance
    # Use a much lower threshold for TF-IDF (Profile) relevance
    sim_profile_threshold = 0.05 
    
    # Top-k recommendations
    fav_table, rec_df = recommend_hybrid(user_row, top_n=k)
    recommended_ids = rec_df["id"].tolist()

    # --- RELEVANT MODULES CALCULATION ---

    # 1. Favorites Relevance (Content-based via PCA)
    sims_fav = None
    if fav_ids:
        fav_indices = df[df["id"].isin(fav_ids)].index.tolist()
        fav_vec = module_vectors_pca[fav_indices].mean(axis=0).reshape(1,-1)
        sims_fav = cosine_similarity(normalize(fav_vec), normalize(module_vectors_pca))[0]

    # 2. Profile Relevance (Direct TF-IDF Similarity)
    sims_profile_tfidf = None
    if user_row["profile_text"].strip():
        uidx = users_demo[users_demo["user_id"]==user_row["user_id"]].index[0]
        profile_vec_tfidf = user_profile_tfidf[uidx].reshape(1,-1)
        sims_profile_tfidf = cosine_similarity(profile_vec_tfidf, module_tfidf_dense)[0]

    # Define relevant modules using OR
    if sims_fav is not None and sims_profile_tfidf is not None:
        # Use sim_threshold (0.35) for favorites, sim_profile_threshold (0.05) for profile
        relevant_mask = (sims_fav >= sim_threshold) | (sims_profile_tfidf >= sim_profile_threshold)
    elif sims_fav is not None:
        # Only use favorites relevance (Alice)
        relevant_mask = sims_fav >= sim_threshold
    elif sims_profile_tfidf is not None:
        # Only use profile relevance (Charlie)
        relevant_mask = sims_profile_tfidf >= sim_profile_threshold # <-- CRITICAL CHANGE HERE
    else:
        relevant_mask = np.zeros(len(df), dtype=bool)

    # Exclude true favorites
    if fav_ids:
        relevant_mask[df["id"].isin(fav_ids)] = False
    relevant_ids = df.loc[relevant_mask, "id"].tolist()

    # Metrics
    hits = len(set(recommended_ids[:k]) & set(relevant_ids))
    precision = hits / k
    recall = hits / max(1, len(relevant_ids))
    hit_rate = 1 if hits > 0 else 0

    print(f"\n=== Evaluation for user {user_id} ({user_row['name']}) ===")
    print(f"Total Relevant Modules: {len(relevant_ids)}")
    print(f"Precision@{k}: {precision:.3f}")
    print(f"Recall@{k}: {recall:.3f}")
    print(f"Hit Rate@{k}: {hit_rate}")

    return {
        "precision_at_k": precision,
        "recall_at_k": recall,
        "hit_rate_at_k": hit_rate
    }

# -----------------------------------------------------
# 12. Plot & user-friendly wrapper
# -----------------------------------------------------
def plot_recommendations_pca(user_id, rec_df, fav_table, module_vectors_local, df_local):
    fav_indices = df_local[df_local["id"].isin(fav_table["id"])].index.tolist()
    rec_indices = df_local[df_local["id"].isin(rec_df["id"])].index.tolist()
    pca_2d = PCA(n_components=2).fit_transform(module_vectors_local)

    plt.figure(figsize=(12,8))
    plt.scatter(pca_2d[:,0], pca_2d[:,1], c='lightgray', alpha=0.3, label='All modules')
    if len(fav_indices)>0:
        plt.scatter(pca_2d[fav_indices,0], pca_2d[fav_indices,1], c='red', s=100, marker='*', label='Favorites')
    if len(rec_indices)>0:
        plt.scatter(pca_2d[rec_indices,0], pca_2d[rec_indices,1], c='blue', s=100, marker='o', edgecolor='k', label='Top Recommendations')
    plt.colorbar(plt.scatter(pca_2d[:,0], pca_2d[:,1], c=df_local["popularity_score"], cmap='viridis', alpha=0.4), label='popularity_score')
    user_name = users_demo[users_demo["user_id"]==user_id]["name"].iloc[0]
    plt.title(f"PCA 2D: Modules with Favorites & Recommendations for {user_name}")
    plt.xlabel("PC1"); plt.ylabel("PC2")
    plt.grid(True)
    plt.legend()
    plt.show()

def recommend_modules_user_friendly_hybrid(user_id, top_n=5):
    user_row = users_demo[users_demo["user_id"]==user_id].iloc[0]
    fav_table, rec_df = recommend_hybrid(user_row, top_n=top_n)
    user_name = user_row["name"]

    print(f"\n===== GEBRUIKERSVRIENDELIJKE AANBEVELINGEN VOOR {user_name} =====")
    print("\n=== USER PROFILE ===")
    print(user_row['profile_text'] if user_row['profile_text'].strip() else "(geen profieltekst)")

    print("\n=== FAVORIETE MODULES ===")
    display(fav_table.style.set_properties(**{'text-align':'left'}))

    print("\n=== TECHNISCHE TABEL ===")
    display(rec_df[[
        "id","name","content_sim_scaled","popularity_norm","cf_score_scaled","profile_sim_scaled","final_score"
    ]].style.set_properties(**{'text-align':'left'}))

    def interpret_hybrid(row):
        # Content similarity uitleg
        if row['content_sim_scaled'] == 0.0:
            sim_text = "Voeg favorieten toe voor een duidelijkere match."
        elif row['content_sim_scaled'] >= 0.7:
            sim_text = "Deze module lijkt erg op jouw favoriete modules."
        elif row['content_sim_scaled'] >= 0.4:
            sim_text = "Deze module lijkt redelijk op jouw favoriete modules."
        elif row['content_sim_scaled'] >= 0.01:
            sim_text = "Deze module lijkt enigszins op jouw favoriete modules."
        else:
            sim_text = "Voeg favorieten toe voor een duidelijkere match."

        # Popularity uitleg
        pop_text = "Populair en gewaardeerd." if row['popularity_norm'] > 0.5 else "Niet zo populair, maar wel relevant."

        # Collaborative filtering uitleg
        if row['cf_score_scaled'] > 0.7:
            cf_text = "Gebruikers die op jou lijken waarderen deze module sterk."
        elif row['cf_score_scaled'] > 0.4:
            cf_text = "Gebruikers zoals jij vinden deze module meestal redelijk goed."
        else:
            cf_text = "Gebruikers die op jou lijken vinden deze module minder relevant."

        # Profile similarity uitleg
        if row["profile_sim_scaled"] == 0:
            profile_text = "Voer interesses in op je profiel voor een duidelijkere match."
        elif row["profile_sim_scaled"] > 0.65:
            profile_text = "Deze VKM lijkt sterk op je profielinteresses."
        elif row["profile_sim_scaled"] > 0.40:
            profile_text = "Deze VKM lijkt redelijk op je profielinteresses."
        elif row["profile_sim_scaled"] > 0.01:
            profile_text = "Deze VKM lijkt weinig op je profielinteresses."

        return f"{sim_text} {pop_text} {cf_text} {profile_text}"


    friendly = rec_df.copy()
    friendly["interpretatie"] = friendly.apply(interpret_hybrid, axis=1)

    print("\n=== GEBRUIKERSVRIENDELIJKE UITLEG ===")
    display(friendly[["name","shortdescription","interpretatie"]].style.set_properties(**{'text-align':'left'}))

    plot_recommendations_pca(user_id, rec_df, fav_table, module_vectors, df)
    return friendly

# -----------------------------------------------------
# 13. Run demo + evaluation for all users
# -----------------------------------------------------
print("\n\n=== RUNNING DEMO: HYBRID (PCA + CF) recommendations + evaluation ===")
for uid in users_demo["user_id"]:
    recommend_modules_user_friendly_hybrid(uid, top_n=5)
    evaluate_user_hybrid(uid, k=5)