from fastapi import APIRouter, BackgroundTasks, Depends
from middleware.security import verify_api_key
from middleware.validation import TrainRequest
from modelstore import save_model

router = APIRouter()

def train_model(payload: TrainRequest):
    """
    Heavy training logic extracted from your notebook.
    This is where TF-IDF, PCA, SVD etc. happen.
    """
    # TODO: paste your full training logic here
    model_bundle = {
        "vectorizer": "...",
        "pca": "...",
        "svd": "...",
        "df": payload.modules
    }
    save_model(model_bundle)

@router.post("/", dependencies=[Depends(verify_api_key)])
def train(request: TrainRequest, bg: BackgroundTasks):
    bg.add_task(train_model, request)
    return {"status": "training_started"}
