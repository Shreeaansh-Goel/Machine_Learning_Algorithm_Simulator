from __future__ import annotations

from collections import Counter
from typing import Any

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.neighbors import KNeighborsClassifier

from app.models.dataset import AlgorithmResponse, DataPoint, DatasetRequest, StepResponse

SUPPORTED_METRICS = {"euclidean", "manhattan"}


def _parse_params(params: dict[str, Any], sample_count: int) -> tuple[int, str]:
    """Extract and sanitize KNN parameters from request payload."""
    k_value = int(params.get("k", 5))
    metric_value = str(params.get("metric", "euclidean")).lower()

    safe_k = max(1, min(k_value, sample_count))
    if metric_value not in SUPPORTED_METRICS:
        raise ValueError("Parameter 'metric' must be either 'euclidean' or 'manhattan'.")

    return safe_k, metric_value


def _to_samples_and_labels(points: list[DataPoint]) -> tuple[np.ndarray, np.ndarray]:
    """Convert payload points into sample matrix and class-label vector."""
    samples: list[list[float]] = []
    labels: list[str] = []

    for point in points:
        if point.label is None or str(point.label).strip() == "":
            raise ValueError("KNN requires a class label for every point.")
        samples.append([point.x, point.y])
        labels.append(str(point.label))

    return np.array(samples, dtype=float), np.array(labels, dtype=object)


def _resolve_query_point(query_point: DataPoint | None, samples: np.ndarray) -> np.ndarray:
    """Resolve query point from request or use sample mean as a deterministic fallback."""
    if query_point is not None:
        return np.array([query_point.x, query_point.y], dtype=float)

    return np.mean(samples, axis=0)


def _compute_distances(
    samples: np.ndarray,
    query: np.ndarray,
    metric: str,
) -> np.ndarray:
    """Compute distances from all samples to the query point."""
    deltas = samples - query[np.newaxis, :]
    if metric == "manhattan":
        return np.sum(np.abs(deltas), axis=1)
    return np.linalg.norm(deltas, axis=1)


def _choose_predicted_label(
    labels: np.ndarray,
    neighbor_indices: np.ndarray,
    distances: np.ndarray,
) -> tuple[str, int, dict[str, int]]:
    """Select predicted class by majority vote with distance-based tie breaking."""
    neighbor_labels = [str(labels[index]) for index in neighbor_indices.tolist()]
    vote_counts = Counter(neighbor_labels)
    highest_vote = max(vote_counts.values())
    tied_labels = [label for label, count in vote_counts.items() if count == highest_vote]

    if len(tied_labels) == 1:
        return tied_labels[0], highest_vote, dict(vote_counts)

    def mean_distance(class_label: str) -> float:
        class_indices = [index for index in neighbor_indices.tolist() if str(labels[index]) == class_label]
        return float(np.mean(distances[class_indices]))

    predicted = min(tied_labels, key=mean_distance)
    return predicted, highest_vote, dict(vote_counts)


def _build_step_points(
    samples: np.ndarray,
    labels: np.ndarray,
    query: np.ndarray,
    distances: np.ndarray,
    neighbor_indices: set[int],
    query_label: str | None,
) -> list[dict[str, Any]]:
    """Build point payload for frontend rendering, including query state."""
    payload: list[dict[str, Any]] = []

    for index, sample in enumerate(samples):
        payload.append(
            {
                "point_index": int(index),
                "x": float(sample[0]),
                "y": float(sample[1]),
                "label": str(labels[index]),
                "state": "neighbor" if index in neighbor_indices else "data",
                "distance_to_query": round(float(distances[index]), 6),
            }
        )

    payload.append(
        {
            "point_index": "query",
            "x": float(query[0]),
            "y": float(query[1]),
            "label": query_label,
            "state": "query",
            "distance_to_query": None,
        }
    )

    return payload


def _to_native(value: Any) -> Any:
    """Recursively convert NumPy scalars to JSON-safe Python native values."""
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


def _append_step(
    steps: list[StepResponse],
    step_type: str,
    description: str,
    highlight: str,
    points: list[dict[str, Any]],
    metrics: dict[str, Any],
) -> None:
    """Append one formatted KNN step to the response trace."""
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


def build_knn_response(request: DatasetRequest) -> AlgorithmResponse:
    """Run KNN query classification and produce a visualization-friendly step trace."""
    if not request.points:
        raise ValueError("The request must include at least one point.")

    samples, labels = _to_samples_and_labels(request.points)
    k, metric = _parse_params(request.params, samples.shape[0])
    query = _resolve_query_point(request.query_point, samples)
    distances = _compute_distances(samples, query, metric)

    sorted_indices = np.argsort(distances, kind="stable")
    selected_indices = sorted_indices[:k]
    selected_set = {int(index) for index in selected_indices.tolist()}
    predicted_label, winner_votes, vote_counts = _choose_predicted_label(
        labels=labels,
        neighbor_indices=selected_indices,
        distances=distances,
    )
    confidence = (winner_votes / max(k, 1)) * 100.0

    sorted_neighbors = [
        {
            "point_index": int(index),
            "label": str(labels[index]),
            "distance": round(float(distances[index]), 6),
        }
        for index in sorted_indices.tolist()
    ]
    selected_neighbors = sorted_neighbors[:k]

    steps: list[StepResponse] = []
    base_metrics = {
        "k": k,
        "metric": metric,
        "total_points": int(samples.shape[0]),
        "accuracy": None,
        "precision": None,
        "recall": None,
        "f1": None,
        "precision_weighted": None,
        "recall_weighted": None,
        "f1_weighted": None,
        "per_class_report": None,
        "predicted_class": None,
        "votes_for_winner": None,
        "prediction_confidence": None,
    }

    _append_step(
        steps=steps,
        step_type="compute_distances",
        description="Computed distance from the query point to every training sample.",
        highlight=(
            f"Closest sample is {float(np.min(distances)):.4f} units away using {metric} distance."
        ),
        points=_build_step_points(
            samples=samples,
            labels=labels,
            query=query,
            distances=distances,
            neighbor_indices=set(),
            query_label=None,
        ),
        metrics={
            **base_metrics,
            "closest_distance": round(float(np.min(distances)), 6),
            "farthest_distance": round(float(np.max(distances)), 6),
            "mean_distance": round(float(np.mean(distances)), 6),
        },
    )

    _append_step(
        steps=steps,
        step_type="sort_distances",
        description="Sorted all samples by distance from nearest to farthest.",
        highlight="KNN always considers the nearest samples first after sorting distances.",
        points=_build_step_points(
            samples=samples,
            labels=labels,
            query=query,
            distances=distances,
            neighbor_indices=set(),
            query_label=None,
        ),
        metrics={
            **base_metrics,
            "sorted_neighbors": sorted_neighbors,
        },
    )

    _append_step(
        steps=steps,
        step_type="select_k",
        description=f"Selected the {k} nearest neighbors around the query point.",
        highlight="Only the nearest neighbors vote; distant samples are ignored.",
        points=_build_step_points(
            samples=samples,
            labels=labels,
            query=query,
            distances=distances,
            neighbor_indices=selected_set,
            query_label=None,
        ),
        metrics={
            **base_metrics,
            "selected_neighbors": selected_neighbors,
            "votes_by_class": vote_counts,
        },
    )

    classifier = KNeighborsClassifier(n_neighbors=k, metric=metric)
    classifier.fit(samples, labels)
    training_predictions = classifier.predict(samples)

    accuracy = round(float(accuracy_score(labels, training_predictions) * 100.0), 1)
    precision_macro = round(
        float(
            precision_score(
                labels,
                training_predictions,
                average="macro",
                zero_division=0,
            )
        ),
        3,
    )
    recall_macro = round(
        float(
            recall_score(
                labels,
                training_predictions,
                average="macro",
                zero_division=0,
            )
        ),
        3,
    )
    f1_macro = round(
        float(
            f1_score(
                labels,
                training_predictions,
                average="macro",
                zero_division=0,
            )
        ),
        3,
    )
    precision_weighted = round(
        float(
            precision_score(
                labels,
                training_predictions,
                average="weighted",
                zero_division=0,
            )
        ),
        3,
    )
    recall_weighted = round(
        float(
            recall_score(
                labels,
                training_predictions,
                average="weighted",
                zero_division=0,
            )
        ),
        3,
    )
    f1_weighted = round(
        float(
            f1_score(
                labels,
                training_predictions,
                average="weighted",
                zero_division=0,
            )
        ),
        3,
    )
    per_class_report = _to_native(
        classification_report(
            labels,
            training_predictions,
            output_dict=True,
            zero_division=0,
        )
    )

    _append_step(
        steps=steps,
        step_type="predict",
        description=f"Predicted class for query point: {predicted_label}.",
        highlight=(
            f"Winning class {predicted_label} received {winner_votes}/{k} votes "
            f"({confidence:.0f}% confidence)."
        ),
        points=_build_step_points(
            samples=samples,
            labels=labels,
            query=query,
            distances=distances,
            neighbor_indices=selected_set,
            query_label=predicted_label,
        ),
        metrics={
            **base_metrics,
            "predicted_class": predicted_label,
            "votes_for_winner": winner_votes,
            "prediction_confidence": round(confidence, 1),
            "votes_by_class": vote_counts,
            "selected_neighbors": selected_neighbors,
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

    return AlgorithmResponse(algorithm="knn", total_steps=len(steps), steps=steps)