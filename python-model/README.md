# Python model API

This service provides endpoints for training, recommending and evaluating the VKM hybrid recommender.

Important environment variables:
- MODULES_API_URL: optional URL to fetch modules JSON (fallback to local CSV)
- USERS_API_URL: optional URL to fetch users JSON

Endpoints:
- GET /health
- GET /model/status
- POST /train  (no modules required; service will fetch modules if not provided)
- POST /recommend (expects {"user": {...}, "top_n": N})
- POST /recommend/recommend-explain (same payload; returns explanations)
- POST /evaluate (expects {"user_id": <int>, "k": <int>})

Notes:
- Training is run in a background task and will save a model bundle to the models directory via the existing `modelstore.save_model`.
- The implementation moved the model pipeline into `recommender.py` and ensured endpoints are import-safe (no heavy training on import).