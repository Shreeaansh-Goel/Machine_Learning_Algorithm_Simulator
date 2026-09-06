from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.dataset import AlgorithmResponse, DatasetRequest
from app.services.kmeans_service import build_kmeans_response

router = APIRouter(prefix="/api/run", tags=["kmeans"])


@router.post("/kmeans", response_model=AlgorithmResponse)
def run_kmeans(request: DatasetRequest) -> AlgorithmResponse:
    """Run manual K-Means and return full step trace for animation."""
    if len(request.points) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two points are required to run K-Means.",
        )

    try:
        return build_kmeans_response(request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
