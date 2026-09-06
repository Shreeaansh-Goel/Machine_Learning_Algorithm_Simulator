from __future__ import annotations

from collections import deque
from typing import Any

import numpy as np
from sklearn.metrics import silhouette_score

from app.models.dataset import AlgorithmResponse, DataPoint, DatasetRequest, StepResponse

SUPPORTED_METRICS = {"euclidean", "manhattan"}


def _parse_params(params: dict[str, Any], sample_count: int) -> tuple[float, int, str]:
    """Extract and validate DBSCAN hyperparameters from request params."""
    eps_value = float(params.get("eps", 0.25))
    min_samples_value = int(params.get("min_samples", 8))
    metric_value = str(params.get("metric", "euclidean")).lower()

    if not np.isfinite(eps_value) or eps_value <= 0:
        raise ValueError("Parameter 'eps' must be a positive number.")
    if metric_value not in SUPPORTED_METRICS:
        raise ValueError("Parameter 'metric' must be either 'euclidean' or 'manhattan'.")

    safe_eps = float(max(0.05, min(eps_value, 5.0)))
    safe_min_samples = int(max(2, min(min_samples_value, sample_count)))
    return safe_eps, safe_min_samples, metric_value


def _to_numpy(points: list[DataPoint]) -> np.ndarray:
    """Convert request points into a numeric array with shape (n_samples, 2)."""
    return np.array([[point.x, point.y] for point in points], dtype=float)


def _compute_distance_matrix(samples: np.ndarray, metric: str) -> np.ndarray:
    """Compute pairwise distance matrix for either Euclidean or Manhattan metrics."""
    pairwise_diffs = samples[:, np.newaxis, :] - samples[np.newaxis, :, :]
    if metric == "manhattan":
        return np.sum(np.abs(pairwise_diffs), axis=2)
    return np.linalg.norm(pairwise_diffs, axis=2)


def _sorted_neighbors(distance_matrix: np.ndarray, point_index: int, eps: float) -> list[int]:
    """Return sorted neighbor indices that fall within epsilon radius."""
    neighbor_indices = np.where(distance_matrix[point_index] <= eps)[0]
    return [int(index) for index in np.sort(neighbor_indices)]


def _base_state(
    point_index: int,
    labels: np.ndarray,
    is_core: np.ndarray,
    visited: np.ndarray,
) -> str:
    """Resolve DBSCAN role state for a point before temporary highlights."""
    if not visited[point_index]:
        return "unvisited"
    if is_core[point_index]:
        return "core"
    if labels[point_index] >= 0:
        return "border"
    return "noise"


def _build_step_points(
    samples: np.ndarray,
    labels: np.ndarray,
    is_core: np.ndarray,
    visited: np.ndarray,
    current_index: int | None = None,
    neighbor_indices: set[int] | None = None,
) -> list[dict[str, Any]]:
    """Build frontend point payload with DBSCAN state and cluster assignment."""
    neighbor_lookup = neighbor_indices or set()
    payload: list[dict[str, Any]] = []

    for index, sample in enumerate(samples):
        state = _base_state(index, labels, is_core, visited)
        if index in neighbor_lookup and index != current_index:
            state = "neighbor"
        if current_index is not None and index == current_index:
            state = "current"

        cluster = int(labels[index]) if labels[index] >= 0 else None
        payload.append(
            {
                "point_index": index,
                "x": float(sample[0]),
                "y": float(sample[1]),
                "cluster": cluster,
                "state": state,
            }
        )

    return payload


def _build_metrics(
    labels: np.ndarray,
    is_core: np.ndarray,
    visited: np.ndarray,
    points_processed: int,
) -> dict[str, Any]:
    """Compute DBSCAN progress metrics for the current animation step."""
    assigned_labels = labels[labels >= 0]
    clusters_found = int(np.unique(assigned_labels).size) if assigned_labels.size else 0
    core_count = int(np.sum(is_core))
    border_count = int(np.sum((labels >= 0) & ~is_core))
    noise_count = int(np.sum(visited & (labels < 0) & ~is_core))
    total_points = int(labels.shape[0])

    return {
        "clusters_found": clusters_found,
        "points_processed": int(points_processed),
        "noise_count": noise_count,
        "core_count": core_count,
        "border_count": border_count,
        "total_points": total_points,
    }


def _compute_silhouette(samples: np.ndarray, labels: np.ndarray) -> float | None:
    """Compute silhouette score on non-noise samples when valid."""
    non_noise_mask = labels >= 0
    if int(np.sum(non_noise_mask)) < 2:
        return None

    filtered_samples = samples[non_noise_mask]
    filtered_labels = labels[non_noise_mask]
    unique_labels = np.unique(filtered_labels)

    if unique_labels.size < 2 or unique_labels.size >= filtered_samples.shape[0]:
        return None

    try:
        return float(silhouette_score(filtered_samples, filtered_labels))
    except Exception:
        return None


def _append_step(
    steps: list[StepResponse],
    step_type: str,
    description: str,
    highlight: str,
    points: list[dict[str, Any]],
    metrics: dict[str, Any],
) -> None:
    """Append one formatted DBSCAN step to the trace."""
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


def build_dbscan_response(request: DatasetRequest) -> AlgorithmResponse:
    """Run DBSCAN manually and return an animation-friendly step trace.

    DBSCAN groups points by density reachability:
    - Core points have at least min_samples points in their epsilon neighborhood.
    - Border points are reachable from core points but are not dense enough to be core.
    - Noise points are not density-reachable from any discovered core point.
    """
    if not request.points:
        raise ValueError("The request must include at least one point.")

    samples = _to_numpy(request.points)
    sample_count = samples.shape[0]
    eps, min_samples, metric = _parse_params(request.params, sample_count)
    distance_matrix = _compute_distance_matrix(samples, metric)

    visited = np.zeros(sample_count, dtype=bool)
    labels = np.full(sample_count, -1, dtype=int)
    is_core = np.zeros(sample_count, dtype=bool)

    steps: list[StepResponse] = []
    points_processed = 0
    next_cluster_id = 0

    def add_step(
        step_type: str,
        description: str,
        highlight: str,
        current_index: int | None = None,
        neighbor_indices: set[int] | None = None,
        neighbor_count: int | None = None,
        extra_metrics: dict[str, Any] | None = None,
    ) -> None:
        """Create and append a DBSCAN step snapshot."""
        metrics = _build_metrics(
            labels=labels,
            is_core=is_core,
            visited=visited,
            points_processed=points_processed,
        )
        if neighbor_count is not None:
            metrics["neighbor_count"] = int(neighbor_count)
        if extra_metrics is not None:
            metrics.update(extra_metrics)

        _append_step(
            steps=steps,
            step_type=step_type,
            description=description,
            highlight=highlight,
            points=_build_step_points(
                samples=samples,
                labels=labels,
                is_core=is_core,
                visited=visited,
                current_index=current_index,
                neighbor_indices=neighbor_indices,
            ),
            metrics=metrics,
        )

    for point_index in range(sample_count):
        if visited[point_index]:
            continue

        add_step(
            step_type="check_point",
            description=(
                f"Checking point {point_index} as a new DBSCAN seed candidate."
            ),
            highlight=(
                "Draw epsilon neighborhood and count how many points are density-reachable."
            ),
            current_index=point_index,
        )

        neighbors = _sorted_neighbors(distance_matrix, point_index, eps)
        add_step(
            step_type="count_neighbors",
            description=(
                f"Point {point_index} has {len(neighbors)} points in its epsilon neighborhood."
            ),
            highlight=(
                f"Need at least MinPts={min_samples} to mark this point as a core point."
            ),
            current_index=point_index,
            neighbor_indices=set(neighbors),
            neighbor_count=len(neighbors),
        )

        visited[point_index] = True
        points_processed += 1

        if len(neighbors) < min_samples:
            labels[point_index] = -1
            add_step(
                step_type="noise_point",
                description=(
                    f"Point {point_index} is noise because it has fewer than MinPts neighbors."
                ),
                highlight="Noise points are not assigned to any cluster in DBSCAN.",
                current_index=point_index,
            )
            continue

        cluster_id = next_cluster_id
        next_cluster_id += 1
        labels[point_index] = cluster_id
        is_core[point_index] = True

        add_step(
            step_type="core_point",
            description=(
                f"Point {point_index} is a core point. Starting cluster {cluster_id + 1}."
            ),
            highlight=(
                "Core points anchor clusters and trigger recursive neighborhood expansion."
            ),
            current_index=point_index,
            neighbor_indices=set(neighbors),
        )

        # Breadth-first expansion visits density-reachable neighbors in index order.
        queue: deque[int] = deque(index for index in neighbors if index != point_index)
        queued = set(queue)

        while queue:
            neighbor_index = queue.popleft()
            queued.discard(neighbor_index)

            add_step(
                step_type="expand_cluster",
                description=(
                    f"Expanding cluster {cluster_id + 1}: visiting neighbor {neighbor_index}."
                ),
                highlight=(
                    "If this neighbor is also core, its own neighbors will be expanded too."
                ),
                current_index=neighbor_index,
            )

            if not visited[neighbor_index]:
                add_step(
                    step_type="check_point",
                    description=(
                        f"Checking neighbor {neighbor_index} while expanding cluster {cluster_id + 1}."
                    ),
                    highlight=(
                        "Expansion reuses the same DBSCAN core-point test on each new neighbor."
                    ),
                    current_index=neighbor_index,
                )

                neighbor_neighbors = _sorted_neighbors(
                    distance_matrix,
                    neighbor_index,
                    eps,
                )
                add_step(
                    step_type="count_neighbors",
                    description=(
                        f"Neighbor {neighbor_index} has {len(neighbor_neighbors)} points within epsilon."
                    ),
                    highlight=(
                        f"Compare neighborhood size with MinPts={min_samples} to classify this point."
                    ),
                    current_index=neighbor_index,
                    neighbor_indices=set(neighbor_neighbors),
                    neighbor_count=len(neighbor_neighbors),
                )

                visited[neighbor_index] = True
                points_processed += 1

                if len(neighbor_neighbors) >= min_samples:
                    is_core[neighbor_index] = True
                    labels[neighbor_index] = cluster_id
                    add_step(
                        step_type="core_point",
                        description=(
                            f"Neighbor {neighbor_index} is core and reinforces cluster {cluster_id + 1}."
                        ),
                        highlight=(
                            "Core neighbors unlock deeper density-reachable regions in arbitrary shapes."
                        ),
                        current_index=neighbor_index,
                        neighbor_indices=set(neighbor_neighbors),
                    )

                    for candidate in neighbor_neighbors:
                        if candidate in queued:
                            continue
                        if visited[candidate] and labels[candidate] >= 0:
                            continue
                        queue.append(candidate)
                        queued.add(candidate)
                else:
                    labels[neighbor_index] = cluster_id
                    add_step(
                        step_type="border_point",
                        description=(
                            f"Neighbor {neighbor_index} is border: attached to cluster {cluster_id + 1}."
                        ),
                        highlight=(
                            "Border points extend the cluster boundary but do not trigger further expansion."
                        ),
                        current_index=neighbor_index,
                    )

            if labels[neighbor_index] < 0:
                labels[neighbor_index] = cluster_id
                if not is_core[neighbor_index]:
                    add_step(
                        step_type="border_point",
                        description=(
                            f"Point {neighbor_index} is reassigned from noise to border in cluster {cluster_id + 1}."
                        ),
                        highlight=(
                            "Previously isolated points can become border when reached from a core point."
                        ),
                        current_index=neighbor_index,
                    )

    final_silhouette = _compute_silhouette(samples, labels)
    add_step(
        step_type="done",
        description="DBSCAN finished. Final core, border, and noise assignments are ready.",
        highlight="Clusters are complete based on epsilon connectivity and MinPts density.",
        extra_metrics={
            "silhouette_score": (
                None if final_silhouette is None else round(final_silhouette, 6)
            )
        },
    )

    return AlgorithmResponse(algorithm="dbscan", total_steps=len(steps), steps=steps)
