from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.dataset import AlgorithmResponse, DatasetRequest
from app.services.svm_service import build_svm_response

router = APIRouter(prefix="/api/run", tags=["svm"])


@router.post("/svm", response_model=AlgorithmResponse)
def run_svm(request: DatasetRequest) -> AlgorithmResponse:
    """Run SVM and return fit, margin, and support-vector steps."""
    if len(request.points) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two points are required to run SVM.",
        )

    try:
        return build_svm_response(request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
