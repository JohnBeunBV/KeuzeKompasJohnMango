FROM python:3.11-slim

# ---- System deps (for scipy / implicit) ----
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Python deps ----
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- spaCy models ----
RUN python -m spacy download nl_core_news_sm \
    && python -m spacy download en_core_web_sm

# ---- App source ----
COPY . .

# ---- Drop root ----
RUN useradd -m appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# For SSL:
# CMD ["uvicorn", "main:app","--host", "0.0.0.0","--port", "3030",
#      "--ssl-keyfile", "/certs/server.key",
#      "--ssl-certfile", "/certs/server.crt"]
