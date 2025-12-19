# security/http.py
import os
import requests

class AuthenticatedSession:
    def __init__(self):
        self.api_key = os.getenv("PYTHON_API_KEY")
        if not self.api_key:
            raise RuntimeError("PYTHON_API_KEY is not set")

        self.session = requests.Session()
        self.session.headers.update({
            "X-API-Key": f"{self.api_key}",
            "Accept": "application/json"
        })

    def get(self, url: str, **kwargs):
        return self.session.get(url, **kwargs)
