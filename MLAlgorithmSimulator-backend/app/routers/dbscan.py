from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.dataset import AlgorithmResponse, DatasetRequest
from app.services.dbscan_service import build_dbscan_response

router = APIRouter(prefix="/api/run", tags=["dbscan"])


@router.post("/dbscan", response_model=AlgorithmResponse)
def run_dbscan(request: DatasetRequest) -> AlgorithmResponse:
    """Run manual DBSCAN and return full step trace for animation."""
    if len(request.points) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two points are required to run DBSCAN.",
        )

    try:
        return build_dbscan_response(request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
