from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.dataset import AlgorithmResponse, DatasetRequest
from app.services.knn_service import build_knn_response

router = APIRouter(prefix="/api/run", tags=["knn"])


@router.post("/knn", response_model=AlgorithmResponse)
def run_knn(request: DatasetRequest) -> AlgorithmResponse:
    """Run KNN query classification and return a step trace."""
    if len(request.points) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two points are required to run KNN.",
        )

    try:
        return build_knn_response(request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error