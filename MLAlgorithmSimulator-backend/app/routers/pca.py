from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.dataset import AlgorithmResponse, DatasetRequest
from app.services.pca_service import build_pca_response

router = APIRouter(prefix="/api/run", tags=["pca"])


@router.post("/pca", response_model=AlgorithmResponse)
def run_pca(request: DatasetRequest) -> AlgorithmResponse:
    """Run PCA and return covariance, eigenvector, and projection steps."""
    if len(request.points) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two points are required to run PCA.",
        )

    try:
        return build_pca_response(request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
