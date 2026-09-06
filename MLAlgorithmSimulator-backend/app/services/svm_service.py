from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.svm import SVC

from app.models.dataset import AlgorithmResponse, DataPoint, DatasetRequest, StepResponse

SUPPORTED_KERNELS = {"linear", "rbf"}


def _parse_params(params: dict[str, Any]) -> tuple[str, float]:
    """Extract and validate SVM kernel and regularization strength."""
    kernel = str(params.get("kernel", "linear")).lower()
    c_value = float(params.get("C", 1.0))

    safe_kernel = kernel if kernel in SUPPORTED_KERNELS else "linear"
    safe_c = float(max(0.01, min(c_value, 100.0)))
    return safe_kernel, safe_c


def _to_samples_and_labels(points: list[DataPoint]) -> tuple[np.ndarray, np.ndarray]:
    """Convert request points into SVM feature matrix and label vector."""
    samples: list[list[float]] = []
    labels: list[str] = []

    for point in points:
        if point.label is None or str(point.label).strip() == "":
            raise ValueError("SVM requires a class label for every point.")
        samples.append([float(point.x), float(point.y)])
        labels.append(str(point.label))

    return np.array(samples, dtype=float), np.array(labels, dtype=object)


def _to_native(value: Any) -> Any:
    """Recursively convert NumPy scalar values to Python primitives."""
    if isinstance(value, dict):
        return {str(key): _to_native(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_to_native(item) for item in value]
    if isinstance(value, tuple):
        return tuple(_to_native(item) for item in value)
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.bool_):
        return bool(value)
    return value


def _line_from_weights(
    weight_x: float,
    weight_y: float,
    intercept: float,
    x_min: float,
    x_max: float,
) -> list[dict[str, float]]:
    """Build two line points for a linear decision boundary or margin line."""
    if abs(weight_y) > 1e-10:
        y_start = -((weight_x * x_min) + intercept) / weight_y
        y_end = -((weight_x * x_max) + intercept) / weight_y
        return [
            {"x": float(x_min), "y": float(y_start)},
            {"x": float(x_max), "y": float(y_end)},
        ]

    if abs(weight_x) <= 1e-10:
        return []

    x_value = -intercept / weight_x
    return [
        {"x": float(x_value), "y": float(-1e6)},
        {"x": float(x_value), "y": float(1e6)},
    ]


def _build_decision_grid(model: SVC, samples: np.ndarray) -> dict[str, Any]:
    """Compute dense decision-function grid for curved RBF boundary rendering."""
    margin = 0.6
    x_min = float(np.min(samples[:, 0]) - margin)
    x_max = float(np.max(samples[:, 0]) + margin)
    y_min = float(np.min(samples[:, 1]) - margin)
    y_max = float(np.max(samples[:, 1]) + margin)

    cols = 80
    rows = 80
    x_values = np.linspace(x_min, x_max, cols)
    y_values = np.linspace(y_min, y_max, rows)
    grid_x, grid_y = np.meshgrid(x_values, y_values)
    stacked = np.c_[grid_x.ravel(), grid_y.ravel()]
    decision_values = model.decision_function(stacked)

    return {
        "x_min": x_min,
        "x_max": x_max,
        "y_min": y_min,
        "y_max": y_max,
        "rows": rows,
        "cols": cols,
        "values": [float(value) for value in decision_values.tolist()],
        "thresholds": [-1.0, 0.0, 1.0],
    }


def _build_points_payload(
    samples: np.ndarray,
    labels: np.ndarray,
    support_indices: set[int],
    state: str,
) -> list[dict[str, Any]]:
    """Build frontend point payload with support-vector state markers."""
    payload: list[dict[str, Any]] = []

    class_values = sorted({str(label) for label in labels.tolist()})
    class_to_index = {label: index for index, label in enumerate(class_values)}

    for index, sample in enumerate(samples):
        label = str(labels[index])
        point_state = "support_vector" if index in support_indices else state
        payload.append(
            {
                "point_index": int(index),
                "x": float(sample[0]),
                "y": float(sample[1]),
                "label": label,
                "class_index": int(class_to_index.get(label, 0)),
                "state": point_state,
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
    """Append one SVM step to the animation trace."""
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


def build_svm_response(request: DatasetRequest) -> AlgorithmResponse:
    """Train SVM classifier and return fit, margin, and support-vector visualization steps."""
    if not request.points:
        raise ValueError("The request must include at least one point.")

    samples, labels = _to_samples_and_labels(request.points)
    unique_labels = np.unique(labels)
    if unique_labels.size != 2:
        raise ValueError("SVM visualizer currently supports exactly two classes.")

    kernel, c_value = _parse_params(request.params)

    classifier = SVC(kernel=kernel, C=c_value, gamma="scale")
    classifier.fit(samples, labels)

    predictions = classifier.predict(samples)
    accuracy = round(float(accuracy_score(labels, predictions) * 100.0), 1)
    precision_macro = round(
        float(precision_score(labels, predictions, average="macro", zero_division=0)),
        3,
    )
    recall_macro = round(
        float(recall_score(labels, predictions, average="macro", zero_division=0)),
        3,
    )
    f1_macro = round(
        float(f1_score(labels, predictions, average="macro", zero_division=0)),
        3,
    )
    precision_weighted = round(
        float(precision_score(labels, predictions, average="weighted", zero_division=0)),
        3,
    )
    recall_weighted = round(
        float(recall_score(labels, predictions, average="weighted", zero_division=0)),
        3,
    )
    f1_weighted = round(
        float(f1_score(labels, predictions, average="weighted", zero_division=0)),
        3,
    )
    per_class_report = _to_native(
        classification_report(labels, predictions, output_dict=True, zero_division=0)
    )

    support_indices = {int(index) for index in classifier.support_.tolist()}
    decision_grid = _build_decision_grid(classifier, samples)

    x_min = float(np.min(samples[:, 0]))
    x_max = float(np.max(samples[:, 0]))

    weight_vector: list[float] | None = None
    margin_width: float | None = None
    hyperplane_line: list[dict[str, float]] = []
    margin_lines: list[list[dict[str, float]]] = []

    if kernel == "linear":
        weights = classifier.coef_[0]
        intercept = float(classifier.intercept_[0])
        norm = float(np.linalg.norm(weights))
        margin_width = float(2.0 / norm) if norm > 1e-12 else None
        weight_vector = [float(weights[0]), float(weights[1])]

        hyperplane_line = _line_from_weights(
            weight_x=float(weights[0]),
            weight_y=float(weights[1]),
            intercept=intercept,
            x_min=x_min,
            x_max=x_max,
        )
        margin_lines = [
            _line_from_weights(
                weight_x=float(weights[0]),
                weight_y=float(weights[1]),
                intercept=intercept + 1.0,
                x_min=x_min,
                x_max=x_max,
            ),
            _line_from_weights(
                weight_x=float(weights[0]),
                weight_y=float(weights[1]),
                intercept=intercept - 1.0,
                x_min=x_min,
                x_max=x_max,
            ),
        ]

    common_metrics = {
        "kernel": kernel,
        "C": c_value,
        "n_support_vectors": int(len(support_indices)),
        "support_vector_indices": sorted(support_indices),
        "hyperplane_weights": weight_vector,
        "margin_width": margin_width,
        "hyperplane_line": hyperplane_line,
        "margin_lines": margin_lines,
        "decision_grid": decision_grid,
        "accuracy": None,
        "precision": None,
        "recall": None,
        "f1": None,
        "precision_weighted": None,
        "recall_weighted": None,
        "f1_weighted": None,
        "per_class_report": None,
    }

    steps: list[StepResponse] = []

    _append_step(
        steps=steps,
        step_type="fit",
        description=f"Fitted {kernel.upper()} SVM model to separate the two classes.",
        highlight="SVM chooses a boundary that maximizes geometric margin under C regularization.",
        points=_build_points_payload(
            samples=samples,
            labels=labels,
            support_indices=set(),
            state="data",
        ),
        metrics=common_metrics,
    )

    _append_step(
        steps=steps,
        step_type="show_margin",
        description="Rendered decision boundary and margin lines.",
        highlight=(
            "Margin width controls confidence of separation; wider margin usually generalizes better."
            if kernel == "linear"
            else "RBF boundary bends in feature space to capture nonlinear class structure."
        ),
        points=_build_points_payload(
            samples=samples,
            labels=labels,
            support_indices=set(),
            state="data",
        ),
        metrics=common_metrics,
    )

    _append_step(
        steps=steps,
        step_type="show_support_vectors",
        description="Highlighted support vectors that define the final boundary.",
        highlight="Only support vectors directly influence the learned separating surface.",
        points=_build_points_payload(
            samples=samples,
            labels=labels,
            support_indices=support_indices,
            state="data",
        ),
        metrics={
            **common_metrics,
            "accuracy": accuracy,
            "precision": precision_macro,
            "recall": recall_macro,
            "f1": f1_macro,
            "precision_weighted": precision_weighted,
            "recall_weighted": recall_weighted,
            "f1_weighted": f1_weighted,
            "per_class_report": per_class_report,
        },
    )

    return AlgorithmResponse(algorithm="svm", total_steps=len(steps), steps=steps)
