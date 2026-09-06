from __future__ import annotations

import warnings
from typing import Any

import numpy as np
from sklearn.decomposition import PCA

from app.models.dataset import AlgorithmResponse, DataPoint, DatasetRequest, StepResponse


def _to_float(value: Any) -> float | None:
    """Safely cast supported scalar values to float."""
    if isinstance(value, (float, int, np.floating, np.integer)):
        cast_value = float(value)
        if np.isfinite(cast_value):
            return cast_value
    return None


def _safe_float(value: Any, fallback: float = 0.0) -> float:
    """Convert numeric values to finite floats with a fallback for NaN/inf."""
    cast_value = _to_float(value)
    return fallback if cast_value is None else float(cast_value)


def _parse_params(params: dict[str, Any]) -> int:
    """Extract and validate PCA component count from request params."""
    requested = int(params.get("n_components", 2))
    return max(2, min(requested, 2))


def _collect_feature_names(points: list[DataPoint]) -> list[str]:
    """Collect numeric feature keys shared across all points for PCA input."""
    feature_names = ["x", "y"]
    if not points:
        return feature_names

    extras_by_point: list[set[str]] = []
    for point in points:
        extras = point.model_extra or {}
        numeric_keys = {
            str(key)
            for key, value in extras.items()
            if key not in {"label"} and _to_float(value) is not None
        }
        extras_by_point.append(numeric_keys)

    if not extras_by_point:
        return feature_names

    shared_keys = set.intersection(*extras_by_point) if extras_by_point else set()
    for key in sorted(shared_keys):
        if key not in feature_names:
            feature_names.append(key)

    return feature_names


def _to_feature_matrix(points: list[DataPoint]) -> tuple[np.ndarray, list[str]]:
    """Convert points into a dense feature matrix using shared numeric columns."""
    feature_names = _collect_feature_names(points)
    rows: list[list[float]] = []

    for point in points:
        extras = point.model_extra or {}
        row: list[float] = []

        for feature_name in feature_names:
            if feature_name == "x":
                value = float(point.x)
            elif feature_name == "y":
                value = float(point.y)
            else:
                numeric = _to_float(extras.get(feature_name))
                value = float(numeric) if numeric is not None else 0.0
            row.append(value)

        rows.append(row)

    matrix = np.array(rows, dtype=float)
    return matrix, feature_names


def _build_points_payload(
    request_points: list[DataPoint],
    original_xy: np.ndarray,
    projected_xy: np.ndarray,
    state: str,
) -> list[dict[str, Any]]:
    """Create frontend point payload containing both original and PCA-projected coords."""
    payload: list[dict[str, Any]] = []

    for index, point in enumerate(request_points):
        payload.append(
            {
                "point_index": int(index),
                "x": float(original_xy[index, 0]),
                "y": float(original_xy[index, 1]),
                "projected_x": float(projected_xy[index, 0]),
                "projected_y": float(projected_xy[index, 1]),
                "label": None if point.label is None else str(point.label),
                "state": state,
            }
        )

    return payload


def _append_step(
    steps: list[StepResponse],
    step_type: str,
    description: str,
    highlight: str,
    points: list[dict[str, Any]],
    metrics: dict[str, Any],
) -> None:
    """Append one PCA step to the response trace."""
    steps.append(
        StepResponse(
            step_index=len(steps),
            step_type=step_type,
            description=description,
            points=points,
            metrics=metrics,
            highlight=highlight,
        )
    )


def build_pca_response(request: DatasetRequest) -> AlgorithmResponse:
    """Run PCA and build educational step trace for covariance, eigenvectors, and projection."""
    if not request.points:
        raise ValueError("The request must include at least one point.")

    n_components = _parse_params(request.params)
    feature_matrix, feature_names = _to_feature_matrix(request.points)
    if feature_matrix.shape[0] < 2:
        raise ValueError("At least two points are required to run PCA.")

    centered = feature_matrix - np.mean(feature_matrix, axis=0, keepdims=True)
    covariance_matrix = np.cov(centered, rowvar=False)

    eigenvalues_all, eigenvectors_all = np.linalg.eigh(covariance_matrix)
    order = np.argsort(eigenvalues_all)[::-1]
    eigenvalues = eigenvalues_all[order]
    eigenvectors = eigenvectors_all[:, order]

    total_variance = float(np.sum(eigenvalues))
    if total_variance <= 1e-12:
        explained_ratio = np.zeros_like(eigenvalues)
    else:
        explained_ratio = eigenvalues / total_variance

    pca = PCA(n_components=n_components, random_state=42)
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message="invalid value encountered in divide",
            category=RuntimeWarning,
        )
        projected = pca.fit_transform(feature_matrix)
    explained_variance = pca.explained_variance_
    explained_variance_ratio = pca.explained_variance_ratio_

    original_xy = feature_matrix[:, :2]
    projected_xy = projected[:, :2]

    mean_x = float(np.mean(original_xy[:, 0]))
    mean_y = float(np.mean(original_xy[:, 1]))
    scale = float(max(np.std(original_xy[:, 0]), np.std(original_xy[:, 1]), 1.0))

    arrows: list[dict[str, Any]] = []
    x_idx = feature_names.index("x") if "x" in feature_names else 0
    y_idx = feature_names.index("y") if "y" in feature_names else min(1, len(feature_names) - 1)

    for component_index in range(min(2, eigenvectors.shape[1])):
        direction_x = float(eigenvectors[x_idx, component_index])
        direction_y = float(eigenvectors[y_idx, component_index])
        arrows.append(
            {
                "component": int(component_index + 1),
                "start": {"x": mean_x, "y": mean_y},
                "end": {
                    "x": mean_x + (direction_x * scale),
                    "y": mean_y + (direction_y * scale),
                },
            }
        )

    common_metrics = {
        "n_components": int(n_components),
        "feature_names": feature_names,
        "eigenvalues": [_safe_float(value) for value in explained_variance.tolist()],
        "explained_variance_ratio": [
            _safe_float(value) for value in explained_variance_ratio.tolist()
        ],
        "covariance_matrix": covariance_matrix.tolist(),
        "projected_bounds": {
            "x_min": float(np.min(projected_xy[:, 0])),
            "x_max": float(np.max(projected_xy[:, 0])),
            "y_min": float(np.min(projected_xy[:, 1])),
            "y_max": float(np.max(projected_xy[:, 1])),
        },
    }

    steps: list[StepResponse] = []

    _append_step(
        steps=steps,
        step_type="compute_covariance",
        description="Computed covariance matrix of centered features to measure shared variance.",
        highlight="Large off-diagonal magnitude means features move together.",
        points=_build_points_payload(
            request_points=request.points,
            original_xy=original_xy,
            projected_xy=original_xy,
            state="original",
        ),
        metrics=common_metrics,
    )

    _append_step(
        steps=steps,
        step_type="compute_eigenvectors",
        description="Computed eigenvectors and eigenvalues to identify principal directions.",
        highlight="Principal components point toward directions with maximum variance.",
        points=_build_points_payload(
            request_points=request.points,
            original_xy=original_xy,
            projected_xy=original_xy,
            state="original",
        ),
        metrics={
            **common_metrics,
            "eigenvalues_full": [float(value) for value in eigenvalues.tolist()],
            "eigenvectors_full": eigenvectors.tolist(),
            "eigenvector_arrows": arrows,
        },
    )

    _append_step(
        steps=steps,
        step_type="project",
        description="Projected each sample onto the top principal components.",
        highlight="Projection keeps the most informative variance while reducing dimensions.",
        points=_build_points_payload(
            request_points=request.points,
            original_xy=original_xy,
            projected_xy=projected_xy,
            state="projecting",
        ),
        metrics=common_metrics,
    )

    _append_step(
        steps=steps,
        step_type="done",
        description="PCA finished. Final 2D projection is ready.",
        highlight="Use explained variance ratio to judge how much information was preserved.",
        points=_build_points_payload(
            request_points=request.points,
            original_xy=original_xy,
            projected_xy=projected_xy,
            state="projected",
        ),
        metrics=common_metrics,
    )

    return AlgorithmResponse(algorithm="pca", total_steps=len(steps), steps=steps)
