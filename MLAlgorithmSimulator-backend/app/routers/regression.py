from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.dataset import AlgorithmResponse, DatasetRequest
from app.services.regression_service import build_linear_regression_response

router = APIRouter(prefix="/api/run", tags=["regression"])


@router.post("/linear-regression", response_model=AlgorithmResponse)
def run_linear_regression(request: DatasetRequest) -> AlgorithmResponse:
    """Run linear regression gradient descent and return a step trace."""
    if len(request.points) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two points are required to run Linear Regression.",
        )

    try:
        return build_linear_regression_response(request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error