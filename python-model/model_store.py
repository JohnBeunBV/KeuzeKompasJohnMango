import joblib
from pathlib import Path
from threading import Lock

MODEL_PATH = Path("/models/hybrid_model.joblib")
_model_lock = Lock()

def save_model(model_bundle: dict):
    with _model_lock:
        joblib.dump(model_bundle, MODEL_PATH)

def load_model() -> dict:
    if not MODEL_PATH.exists():
        raise RuntimeError("Model not trained yet")
    with _model_lock:
        return joblib.load(MODEL_PATH)


# Example saved model bundle structure
# model_bundle = {
#     "vectorizer": vectorizer,
#     "pca": pca,
#     "svd": svd_model,
#     "scaler": scaler,
#     "module_vectors_pca": module_vectors_pca,
#     "module_tfidf": module_tfidf_dense,
#     "df": df
# }
