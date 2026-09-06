from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.datasets import router as datasets_router
from app.routers.decision_tree import router as decision_tree_router
from app.routers.dbscan import router as dbscan_router
from app.routers.knn import router as knn_router
from app.routers.kmeans import router as kmeans_router
from app.routers.pca import router as pca_router
from app.routers.quiz import router as quiz_router
from app.routers.regression import router as regression_router
from app.routers.svm import router as svm_router

app = FastAPI(title="ML Algorithm Simulator Backend", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Placeholder API router for future task-specific endpoints.
api_router = APIRouter(prefix="/api", tags=["placeholder"])
app.include_router(api_router)
app.include_router(datasets_router)
app.include_router(kmeans_router)
app.include_router(dbscan_router)
app.include_router(decision_tree_router)
app.include_router(knn_router)
app.include_router(regression_router)
app.include_router(pca_router)
app.include_router(svm_router)
app.include_router(quiz_router)


@app.get("/health")
def get_health() -> dict[str, str]:
    """Return backend health status."""
    return {"status": "ok", "version": "1.0"}
