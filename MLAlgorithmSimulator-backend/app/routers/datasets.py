from __future__ import annotations

from typing import Any

import numpy as np
from fastapi import APIRouter
from sklearn.datasets import load_iris, make_blobs, make_circles, make_moons

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


def _to_point_list(
    features: np.ndarray, labels: np.ndarray | None
) -> list[dict[str, Any]]:
    """Convert feature and label arrays into point dictionaries."""
    points: list[dict[str, Any]] = []
    for index, values in enumerate(features):
        label_value = None if labels is None else str(int(labels[index]))
        points.append({"x": float(values[0]), "y": float(values[1]), "label": label_value})
    return points


def _get_blobs_dataset() -> list[dict[str, Any]]:
    """Create isotropic Gaussian blobs for clustering demos."""
    features, labels = make_blobs(
        n_samples=200, centers=3, cluster_std=1.2, random_state=42
    )
    return _to_point_list(features, labels)


def _get_moons_dataset() -> list[dict[str, Any]]:
    """Create two interleaving moons to show non-linear separability."""
    features, labels = make_moons(n_samples=200, noise=0.1, random_state=42)
    return _to_point_list(features, labels)


def _get_circles_dataset() -> list[dict[str, Any]]:
    """Create concentric circles to test cluster boundaries."""
    features, labels = make_circles(
        n_samples=200, noise=0.05, factor=0.5, random_state=42
    )
    return _to_point_list(features, labels)


def _get_iris_dataset() -> list[dict[str, Any]]:
    """Load Iris and project to first two features for 2D visualization."""
    iris = load_iris()
    features = iris.data[:, :2]
    labels = iris.target
    return _to_point_list(features, labels)


def _get_anisotropic_dataset() -> list[dict[str, Any]]:
    """Create anisotropically distributed blobs via linear transformation."""
    features, labels = make_blobs(n_samples=200, centers=3, random_state=42)
    transformation = np.array([[0.6, -0.6], [-0.4, 0.8]])
    transformed_features = np.dot(features, transformation)
    return _to_point_list(transformed_features, labels)


@router.get("/sample")
def get_sample_datasets() -> dict[str, list[dict[str, Any]]]:
    """Return built-in sample datasets keyed by dataset slug."""
    return {
        "blobs": _get_blobs_dataset(),
        "moons": _get_moons_dataset(),
        "circles": _get_circles_dataset(),
        "iris": _get_iris_dataset(),
        "anisotropic": _get_anisotropic_dataset(),
    }
