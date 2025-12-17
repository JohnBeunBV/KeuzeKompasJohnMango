from fastapi import FastAPI
from api import train, recommend, evaluate, plot, health, startup

app = FastAPI(
    title="Hybrid Recommender Model API",
    version="1.0.0"
)

    
app.include_router(health.router)
app.include_router(train.router, prefix="/train")
app.include_router(recommend.router, prefix="/recommend")
app.include_router(evaluate.router, prefix="/evaluate")
app.include_router(plot.router, prefix="/plot")
@app.on_event("startup")
def startup_event():
    startup.retrain_on_startup()