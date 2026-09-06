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
from sklearn.tree import DecisionTreeClassifier

from app.models.dataset import AlgorithmResponse, DataPoint, DatasetRequest, StepResponse


def _parse_params(params: dict[str, Any]) -> tuple[int | None, str, int]:
    """Extract and sanitize Decision Tree hyperparameters from request params."""
    max_depth_value = int(params.get("max_depth", 5))
    criterion_value = str(params.get("criterion", "gini")).lower()
    min_samples_split_value = int(params.get("min_samples_split", 2))

    safe_depth = None if max_depth_value <= 0 else max(1, min(max_depth_value, 40))
    safe_criterion = criterion_value if criterion_value in {"gini", "entropy"} else "gini"
    safe_min_samples_split = max(2, min(min_samples_split_value, 50))
    return safe_depth, safe_criterion, safe_min_samples_split


def _to_numpy_with_labels(points: list[DataPoint]) -> tuple[np.ndarray, np.ndarray]:
    """Convert request points into numeric samples and class labels."""
    samples: list[list[float]] = []
    labels: list[str] = []

    for point in points:
        if point.label is None or str(point.label).strip() == "":
            raise ValueError("Decision Tree requires a class label for every point.")
        samples.append([point.x, point.y])
        labels.append(str(point.label))

    return np.array(samples, dtype=float), np.array(labels, dtype=object)


def _is_leaf(tree_model: Any, node_id: int) -> bool:
    """Return True when a tree node has no children."""
    return bool(tree_model.children_left[node_id] == tree_model.children_right[node_id])


def _node_majority_class(tree_model: Any, classes: list[str], node_id: int) -> str:
    """Return majority class label at the given node."""
    class_index = int(np.argmax(tree_model.value[node_id][0]))
    return classes[class_index]


def _build_tree_structure(
    tree_model: Any,
    classes: list[str],
    node_id: int,
    visible_nodes: set[int],
) -> dict[str, Any] | None:
    """Build a nested tree dict for currently visible nodes."""
    if node_id not in visible_nodes:
        return None

    leaf_node = _is_leaf(tree_model, node_id)
    feature_index = int(tree_model.feature[node_id]) if not leaf_node else -1
    feature_name = "x" if feature_index == 0 else "y" if feature_index == 1 else None
    left_id = int(tree_model.children_left[node_id])
    right_id = int(tree_model.children_right[node_id])

    return {
        "node_id": int(node_id),
        "feature": feature_name,
        "threshold": None if leaf_node else float(tree_model.threshold[node_id]),
        "gini": float(tree_model.impurity[node_id]),
        "samples": int(tree_model.n_node_samples[node_id]),
        "left": (
            None
            if left_id < 0
            else _build_tree_structure(tree_model, classes, left_id, visible_nodes)
        ),
        "right": (
            None
            if right_id < 0
            else _build_tree_structure(tree_model, classes, right_id, visible_nodes)
        ),
        "is_leaf": leaf_node,
        "class": _node_majority_class(tree_model, classes, node_id),
    }


def _collect_preorder(tree_model: Any, node_id: int = 0) -> list[int]:
    """Collect nodes in preorder traversal for educational build order."""
    order = [int(node_id)]
    left_id = int(tree_model.children_left[node_id])
    right_id = int(tree_model.children_right[node_id])

    if left_id >= 0:
        order.extend(_collect_preorder(tree_model, left_id))
    if right_id >= 0:
        order.extend(_collect_preorder(tree_model, right_id))
    return order


def _compute_node_depths(tree_model: Any) -> dict[int, int]:
    """Compute depth for every tree node."""
    depths: dict[int, int] = {0: 0}
    stack: list[int] = [0]

    while stack:
        node_id = stack.pop()
        next_depth = depths[node_id] + 1
        left_id = int(tree_model.children_left[node_id])
        right_id = int(tree_model.children_right[node_id])

        if left_id >= 0:
            depths[left_id] = next_depth
            stack.append(left_id)
        if right_id >= 0:
            depths[right_id] = next_depth
            stack.append(right_id)

    return depths


def _build_points_payload(
    samples: np.ndarray,
    labels: np.ndarray,
    predictions: np.ndarray,
    active_mask: np.ndarray,
    class_to_index: dict[str, int],
) -> list[dict[str, Any]]:
    """Build scatter payload with true/predicted class metadata."""
    payload: list[dict[str, Any]] = []

    for index, sample in enumerate(samples):
        true_label = str(labels[index])
        predicted_label = str(predictions[index])
        payload.append(
            {
                "point_index": int(index),
                "x": float(sample[0]),
                "y": float(sample[1]),
                "label": true_label,
                "predicted_label": predicted_label,
                "class_index": class_to_index.get(true_label, 0),
                "predicted_class_index": class_to_index.get(predicted_label, 0),
                "state": "active" if bool(active_mask[index]) else "data",
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
    tree_structure: dict[str, Any] | None,
    current_node_id: int | None,
    split_line: dict[str, Any] | None,
) -> None:
    """Append a formatted step to the Decision Tree trace list."""
    steps.append(
        StepResponse(
            step_index=len(steps),
            step_type=step_type,
            description=description,
            points=points,
            metrics=metrics,
            highlight=highlight,
            tree_structure=tree_structure,
            current_node_id=current_node_id,
            split_line=split_line,
        )
    )


def _to_native(value: Any) -> Any:
    """Recursively convert NumPy scalar values into JSON-safe Python natives."""
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


def build_decision_tree_response(request: DatasetRequest) -> AlgorithmResponse:
    """Fit Decision Tree and produce a step-by-step tree construction trace.

    The model is fitted once with sklearn's DecisionTreeClassifier. The step trace is
    then reconstructed by revealing nodes in preorder so learners can observe how
    each split or leaf extends the full decision structure.
    """
    if not request.points:
        raise ValueError("The request must include at least one point.")

    samples, labels = _to_numpy_with_labels(request.points)
    if np.unique(labels).size < 2:
        raise ValueError("Decision Tree requires at least two unique class labels.")

    max_depth, criterion, min_samples_split = _parse_params(request.params)
    classifier = DecisionTreeClassifier(
        max_depth=max_depth,
        criterion=criterion,
        min_samples_split=min_samples_split,
        random_state=42,
    )
    classifier.fit(samples, labels)

    tree_model = classifier.tree_
    max_depth_limit = int(max_depth) if max_depth is not None else int(tree_model.max_depth)
    classes = [str(value) for value in classifier.classes_.tolist()]
    class_to_index = {label: index for index, label in enumerate(classes)}

    traversal_order = _collect_preorder(tree_model)
    node_depths = _compute_node_depths(tree_model)
    decision_path = classifier.decision_path(samples)
    predictions = classifier.predict(samples)
    model_accuracy = round(float(accuracy_score(labels, predictions) * 100.0), 1)
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

    steps: list[StepResponse] = []
    visible_nodes: set[int] = set()

    for node_id in traversal_order:
        visible_nodes.add(node_id)
        leaf_node = _is_leaf(tree_model, node_id)
        feature_index = int(tree_model.feature[node_id])
        feature_name = "x" if feature_index == 0 else "y"
        threshold_value = float(tree_model.threshold[node_id])

        active_mask = np.asarray(decision_path[:, node_id].toarray()).ravel().astype(bool)
        visible_tree = _build_tree_structure(tree_model, classes, 0, visible_nodes)

        metrics = {
            "depth_reached": max(node_depths[item] for item in visible_nodes),
            "max_depth": max_depth_limit,
            "total_nodes": len(visible_nodes),
            "accuracy": None,
            "precision": None,
            "recall": None,
            "f1": None,
            "precision_weighted": None,
            "recall_weighted": None,
            "f1_weighted": None,
            "per_class_report": None,
            "current_gini": (
                round(float(tree_model.impurity[node_id]), 6) if not leaf_node else None
            ),
        }

        points = _build_points_payload(
            samples=samples,
            labels=labels,
            predictions=predictions,
            active_mask=active_mask,
            class_to_index=class_to_index,
        )

        if leaf_node:
            majority_class = _node_majority_class(tree_model, classes, node_id)
            _append_step(
                steps=steps,
                step_type="leaf",
                description=(
                    f"Node {node_id} becomes a leaf with class {majority_class}."
                ),
                highlight=(
                    f"Leaf purity value is {tree_model.impurity[node_id]:.4f} with "
                    f"{tree_model.n_node_samples[node_id]} samples."
                ),
                points=points,
                metrics=metrics,
                tree_structure=visible_tree,
                current_node_id=node_id,
                split_line=None,
            )
            continue

        left_id = int(tree_model.children_left[node_id])
        right_id = int(tree_model.children_right[node_id])
        split_line = {
            "x_or_y": feature_name,
            "value": threshold_value,
        }

        _append_step(
            steps=steps,
            step_type="split",
            description=(
                f"Node {node_id} splits on {feature_name} <= {threshold_value:.4f}."
            ),
            highlight=(
                f"{criterion.title()} at node: {tree_model.impurity[node_id]:.4f}. "
                f"Left samples: {tree_model.n_node_samples[left_id]}, "
                f"right samples: {tree_model.n_node_samples[right_id]}."
            ),
            points=points,
            metrics=metrics,
            tree_structure=visible_tree,
            current_node_id=node_id,
            split_line=split_line,
        )

    final_tree = _build_tree_structure(tree_model, classes, 0, set(traversal_order))
    final_points = _build_points_payload(
        samples=samples,
        labels=labels,
        predictions=predictions,
        active_mask=np.zeros(samples.shape[0], dtype=bool),
        class_to_index=class_to_index,
    )

    _append_step(
        steps=steps,
        step_type="done",
        description="Decision Tree construction is complete.",
        highlight=(
            f"Final tree depth: {max(node_depths.values())}. "
            f"Training accuracy: {model_accuracy:.1f}%."
        ),
        points=final_points,
        metrics={
            "depth_reached": max(node_depths.values()),
            "max_depth": max_depth_limit,
            "total_nodes": len(traversal_order),
            "accuracy": model_accuracy,
            "precision": precision_macro,
            "recall": recall_macro,
            "f1": f1_macro,
            "precision_weighted": precision_weighted,
            "recall_weighted": recall_weighted,
            "f1_weighted": f1_weighted,
            "per_class_report": per_class_report,
            "current_gini": None,
        },
        tree_structure=final_tree,
        current_node_id=None,
        split_line=None,
    )

    return AlgorithmResponse(algorithm="decision-tree", total_steps=len(steps), steps=steps)
