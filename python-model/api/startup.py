# api/startup.py
from recommender import fetch_remote_modules_users, build_model_from_dataframe
from modelstore import save_model
import logging

logger = logging.getLogger(__name__)

def retrain_on_startup():
    try:
        modules, users = fetch_remote_modules_users()
        print(f"Fetched {len(modules)} modules and {len(users)} users for retraining.")
        model = build_model_from_dataframe(modules, users_demo=users)
        save_model(model)
        logger.info("Model retrained successfully on startup")
    except Exception as e:
        logger.exception("Startup retraining failed")
