from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DataPoint(BaseModel):
    """Single 2D data point for visualization tasks."""

    model_config = ConfigDict(extra="allow")

    x: float
    y: float
    label: str | None = None


class DatasetRequest(BaseModel):
    """Request payload containing points and algorithm parameters."""

    points: list[DataPoint] = Field(default_factory=list)
    params: dict[str, Any] = Field(default_factory=dict)
    query_point: DataPoint | None = None


class StepResponse(BaseModel):
    """Single algorithm step returned to the frontend."""

    step_index: int
    step_type: str
    description: str
    points: list[dict[str, Any]] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
    highlight: str
    tree_structure: dict[str, Any] | None = None
    current_node_id: int | None = None
    split_line: dict[str, Any] | None = None


class AlgorithmResponse(BaseModel):
    """Container for full algorithm execution trace."""

    algorithm: str
    total_steps: int
    steps: list[StepResponse] = Field(default_factory=list)
