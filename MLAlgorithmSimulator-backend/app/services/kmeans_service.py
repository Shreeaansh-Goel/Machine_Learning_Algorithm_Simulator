from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.metrics import silhouette_score

from app.models.dataset import AlgorithmResponse, DataPoint, DatasetRequest, StepResponse


def _parse_params(params: dict[str, Any], sample_count: int) -> tuple[int, int, str]:
    """Extract and sanitize K-Means hyperparameters from request params."""
    k_value = int(params.get("k", 3))
    max_iter_value = int(params.get("max_iter", 50))
    init_value = str(params.get("init", "kmeans++")).lower()

    if sample_count < 2:
        raise ValueError("At least 2 points are required to run K-Means.")

    safe_k = max(2, min(k_value, sample_count))
    safe_max_iter = max(1, min(max_iter_value, 500))
    safe_init = init_value if init_value in {"random", "kmeans++"} else "kmeans++"
    return safe_k, safe_max_iter, safe_init


def _to_numpy(points: list[DataPoint]) -> np.ndarray:
    """Convert request points to a numeric NumPy matrix of shape (n, 2)."""
    return np.array([[point.x, point.y] for point in points], dtype=float)


def _compute_distances(samples: np.ndarray, centroids: np.ndarray) -> np.ndarray:
    """Compute pairwise Euclidean distances from each sample to each centroid."""
    return np.linalg.norm(samples[:, np.newaxis, :] - centroids[np.newaxis, :, :], axis=2)


def _initialize_random_centroids(
    samples: np.ndarray, k: int, rng: np.random.Generator
) -> np.ndarray:
    """Initialize centroids by sampling k unique data points uniformly."""
    indices = rng.choice(samples.shape[0], size=k, replace=False)
    return samples[indices].copy()


def _initialize_kmeans_plus_plus(
    samples: np.ndarray, k: int, rng: np.random.Generator
) -> np.ndarray:
    """Initialize centroids using K-Means++ spread-out seeding."""
    sample_count = samples.shape[0]
    selected_indices: list[int] = [int(rng.integers(0, sample_count))]

    while len(selected_indices) < k:
        selected = samples[selected_indices]
        squared_distances = np.min(
            np.sum((samples[:, np.newaxis, :] - selected[np.newaxis, :, :]) ** 2, axis=2),
            axis=1,
        )
        total_distance = float(np.sum(squared_distances))

        if total_distance == 0:
            remaining = [index for index in range(sample_count) if index not in selected_indices]
            selected_indices.append(int(rng.choice(remaining)))
            continue

        probabilities = squared_distances / total_distance
        next_index = int(rng.choice(sample_count, p=probabilities))

        if next_index not in selected_indices:
            selected_indices.append(next_index)

    return samples[selected_indices].copy()


def _initialize_centroids(
    samples: np.ndarray, k: int, init_method: str, rng: np.random.Generator
) -> np.ndarray:
    """Choose centroid initialization method and return seeded centroids."""
    if init_method == "random":
        return _initialize_random_centroids(samples, k, rng)
    return _initialize_kmeans_plus_plus(samples, k, rng)


def _compute_inertia(samples: np.ndarray, labels: np.ndarray, centroids: np.ndarray) -> float:
    """Compute K-Means inertia as sum of squared sample-to-centroid distances."""
    diffs = samples - centroids[labels]
    return float(np.sum(diffs ** 2))


def _compute_silhouette(samples: np.ndarray, labels: np.ndarray) -> float | None:
    """Compute silhouette score safely; return None when undefined."""
    unique_labels = np.unique(labels)
    if unique_labels.size < 2 or unique_labels.size >= samples.shape[0]:
        return None

    try:
        return float(silhouette_score(samples, labels))
    except Exception:
        return None


def _build_step_points(
    samples: np.ndarray,
    labels: np.ndarray,
    centroids: np.ndarray,
    distances: np.ndarray | None,
    point_state: str,
) -> list[dict[str, Any]]:
    """Build frontend-friendly point payloads, including centroid markers."""
    payload: list[dict[str, Any]] = []

    for index, sample in enumerate(samples):
        cluster = int(labels[index]) if labels[index] >= 0 else None
        distances_row = (
            [float(value) for value in distances[index].tolist()] if distances is not None else []
        )
        nearest_distance = (
            float(distances[index, cluster])
            if distances is not None and cluster is not None
            else None
        )
        centroid_x = float(centroids[cluster, 0]) if cluster is not None else None
        centroid_y = float(centroids[cluster, 1]) if cluster is not None else None

        payload.append(
            {
                "point_index": index,
                "x": float(sample[0]),
                "y": float(sample[1]),
                "cluster": cluster,
                "state": point_state if cluster is not None else "unassigned",
                "assigned_centroid": cluster,
                "distance_to_centroid": nearest_distance,
                "distances": distances_row,
                "centroid_x": centroid_x,
                "centroid_y": centroid_y,
            }
        )

    for centroid_index, centroid in enumerate(centroids):
        payload.append(
            {
                "point_index": f"centroid-{centroid_index}",
                "x": float(centroid[0]),
                "y": float(centroid[1]),
                "cluster": int(centroid_index),
                "state": "centroid",
                "assigned_centroid": None,
                "distance_to_centroid": None,
                "distances": [],
                "centroid_x": None,
                "centroid_y": None,
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
    """Append a new formatted step to the algorithm trace list."""
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


def build_kmeans_response(request: DatasetRequest) -> AlgorithmResponse:
    """Run manual K-Means and return step-by-step trace for visualization."""
    if not request.points:
        raise ValueError("The request must include at least one point.")

    samples = _to_numpy(request.points)
    k, max_iter, init_method = _parse_params(request.params, samples.shape[0])
    total_points = int(samples.shape[0])
    rng = np.random.default_rng(42)
    centroids = _initialize_centroids(samples, k, init_method, rng)

    labels = np.full(samples.shape[0], -1, dtype=int)
    steps: list[StepResponse] = []

    init_points = _build_step_points(samples, labels, centroids, None, "unassigned")
    _append_step(
        steps,
        step_type="init",
        description=f"Initialized {k} centroids using {init_method} seeding.",
        highlight="Centroids are placed. Next, each sample will be assigned to the nearest centroid.",
        points=init_points,
        metrics={
            "k": k,
            "max_iter": max_iter,
            "total_points": total_points,
            "iteration": 0,
            "points_changed": 0,
            "inertia": None,
            "silhouette_score": None,
        },
    )

    last_iteration = 0
    last_points_changed = 0
    converged = False

    for iteration in range(1, max_iter + 1):
        last_iteration = iteration
        distances = _compute_distances(samples, centroids)
        new_labels = np.argmin(distances, axis=1)
        points_changed = int(np.sum(new_labels != labels))
        last_points_changed = points_changed
        inertia = _compute_inertia(samples, new_labels, centroids)

        assign_points = _build_step_points(samples, new_labels, centroids, distances, "assigned")
        _append_step(
            steps,
            step_type="assign",
            description=f"Iteration {iteration}: assigned each point to its nearest centroid.",
            highlight=(
                f"{points_changed} points changed clusters. Distances to all centroids were evaluated."
            ),
            points=assign_points,
            metrics={
                "k": k,
                "max_iter": max_iter,
                "total_points": total_points,
                "iteration": iteration,
                "points_changed": points_changed,
                "inertia": round(inertia, 6),
                "silhouette_score": None,
            },
        )

        previous_centroids = centroids.copy()
        updated_centroids = previous_centroids.copy()

        for centroid_index in range(k):
            members = samples[new_labels == centroid_index]
            if members.size == 0:
                farthest_index = int(np.argmax(np.min(distances, axis=1)))
                updated_centroids[centroid_index] = samples[farthest_index]
            else:
                updated_centroids[centroid_index] = np.mean(members, axis=0)

        centroid_shift = float(np.sum(np.linalg.norm(updated_centroids - previous_centroids, axis=1)))
        updated_inertia = _compute_inertia(samples, new_labels, updated_centroids)

        update_points = _build_step_points(
            samples, new_labels, updated_centroids, distances, "assigned"
        )
        _append_step(
            steps,
            step_type="update",
            description=f"Iteration {iteration}: moved centroids to the mean of assigned points.",
            highlight=f"Total centroid movement this iteration: {centroid_shift:.4f}.",
            points=update_points,
            metrics={
                "k": k,
                "max_iter": max_iter,
                "total_points": total_points,
                "iteration": iteration,
                "points_changed": points_changed,
                "inertia": round(updated_inertia, 6),
                "silhouette_score": None,
            },
        )

        labels = new_labels
        centroids = updated_centroids

        if points_changed == 0 or centroid_shift < 1e-9:
            converged = True
            break

    final_distances = _compute_distances(samples, centroids)
    final_inertia = _compute_inertia(samples, labels, centroids)
    silhouette = _compute_silhouette(samples, labels)
    final_points = _build_step_points(samples, labels, centroids, final_distances, "assigned")

    convergence_reason = (
        "Cluster assignments stabilized and no points changed clusters."
        if converged
        else "Maximum iterations reached before complete stabilization."
    )

    _append_step(
        steps,
        step_type="converged",
        description="K-Means finished. Final clusters and centroids are ready.",
        highlight=convergence_reason,
        points=final_points,
        metrics={
            "k": k,
            "max_iter": max_iter,
            "total_points": total_points,
            "iteration": last_iteration,
            "points_changed": 0 if converged else last_points_changed,
            "inertia": round(final_inertia, 6),
            "silhouette_score": None if silhouette is None else round(silhouette, 6),
        },
    )

    return AlgorithmResponse(algorithm="kmeans", total_steps=len(steps), steps=steps)
