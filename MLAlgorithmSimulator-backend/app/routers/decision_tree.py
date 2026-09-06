from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.dataset import AlgorithmResponse, DatasetRequest
from app.services.decision_tree_service import build_decision_tree_response

router = APIRouter(prefix="/api/run", tags=["decision-tree"])


@router.post("/decision-tree", response_model=AlgorithmResponse)
def run_decision_tree(request: DatasetRequest) -> AlgorithmResponse:
    """Run Decision Tree and return a step trace for visualization."""
    if len(request.points) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two points are required to run Decision Tree.",
        )

    try:
        return build_decision_tree_response(request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
