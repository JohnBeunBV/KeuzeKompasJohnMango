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

router = APIRouter()

# Note: training pipeline moved to `recommender.build_model_from_dataframe`.
# This file only exposes the background task that orchestrates fetching data and saving the model.

# ---------------------------------------------
# Training pipeline
# ---------------------------------------------

def train_model(payload: TrainRequest):
    """Runs full cleanup + training pipeline.
    Safe to run in background. If the payload contains modules we use them,
    otherwise we attempt to fetch modules/users from configured external APIs.
    """
    from recommender import fetch_remote_modules_users, build_model_from_dataframe

    # Load modules/users from payload or remote
    if payload.modules and isinstance(payload.modules, list) and len(payload.modules):
        modules_df = pd.DataFrame(payload.modules)
        users_df = pd.DataFrame(payload.users) if payload.users else pd.DataFrame()
    else:
        modules_df, users_df = fetch_remote_modules_users()

    # build model bundle using the shared pipeline
    model_bundle = build_model_from_dataframe(modules_df, users_demo=users_df, num_dummy_users=payload.num_dummy_users or 50)

    save_model(model_bundle)

# ---------------------------------------------
# API endpoint
# ---------------------------------------------

@router.post("/", dependencies=[Depends(verify_api_key)])
def train(request: TrainRequest, bg: BackgroundTasks):
    bg.add_task(train_model, request)
    return {"status": "training_started"}
