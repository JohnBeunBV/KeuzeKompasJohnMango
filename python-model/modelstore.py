# modelstore.py
import joblib
from pathlib import Path
from threading import Lock
from datetime import datetime

MODELS_DIR = Path("/models")
MODELS_DIR.mkdir(exist_ok=True)

_current_model_path = MODELS_DIR / "current.joblib"
_lock = Lock()

def save_model(model_bundle: dict):
    """
    Save the hybrid model bundle with a versioned file and overwrite current.joblib.
    Expected keys in model_bundle:
    - df: pd.DataFrame with modules
    - module_vectors_pca: np.ndarray PCA-reduced module vectors
    - vectorizer: fitted TfidfVectorizer
    - pca: fitted PCA object
    - scaler: fitted StandardScaler for numeric features
    - als_model: trained implicit.als.AlternatingLeastSquares model
    - user_map / item_map / item_map_inv: mapping dicts for ALS
    """
    version = datetime.utcnow().isoformat(timespec="seconds").replace(":", "-")
    model_bundle["version"] = version

    version_path = MODELS_DIR / f"model_{version}.joblib"

    with _lock:
        # Save versioned model
        joblib.dump(model_bundle, version_path)
        # Overwrite current model
        joblib.dump(model_bundle, _current_model_path)
    print(f"[MODELSTORE] Model saved as {version_path}")

def load_model() -> dict:
    """
    Load the current model bundle.
    Returns:
        dict with keys as stored in save_model()
    """
    if not _current_model_path.exists():
        raise RuntimeError("No trained model available")
    with _lock:
        model_bundle = joblib.load(_current_model_path)
    print(f"[MODELSTORE] Model loaded (version {model_bundle.get('version','unknown')})")
    return model_bundle
