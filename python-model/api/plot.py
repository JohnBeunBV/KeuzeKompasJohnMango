from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from middleware.security import verify_api_key
from modelstore import load_model
import matplotlib.pyplot as plt
import io

router = APIRouter()

@router.post("/pca", dependencies=[Depends(verify_api_key)])
def plot_pca(payload: dict):
    model = load_model()

    fig = plt.figure(figsize=(8,6))
    plt.scatter([0,1], [0,1])
    plt.title("PCA placeholder")

    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)

    return StreamingResponse(buf, media_type="image/png")
