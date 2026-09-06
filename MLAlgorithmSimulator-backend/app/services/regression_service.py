from __future__ import annotations

from typing import Any

import numpy as np

from app.models.dataset import AlgorithmResponse, DataPoint, DatasetRequest, StepResponse


def _parse_params(params: dict[str, Any]) -> tuple[float, int]:
    """Extract and sanitize linear regression parameters."""
    learning_rate_value = float(params.get("learning_rate", 0.01))
    iterations_value = int(params.get("iterations", 500))

    if not np.isfinite(learning_rate_value) or learning_rate_value <= 0:
        raise ValueError("Parameter 'learning_rate' must be a positive number.")

    safe_learning_rate = float(max(1e-5, min(learning_rate_value, 1.0)))
    safe_iterations = int(max(10, min(iterations_value, 5000)))
    return safe_learning_rate, safe_iterations


def _to_xy(points: list[DataPoint]) -> tuple[np.ndarray, np.ndarray]:
    """Convert points into X and y NumPy arrays."""
    x_values = np.array([point.x for point in points], dtype=float)
    y_values = np.array([point.y for point in points], dtype=float)
    return x_values, y_values


def _standardize_vector(values: np.ndarray) -> tuple[np.ndarray, float, float]:
    """Standardize values to zero mean and unit variance for stable optimization."""
    mean_value = float(np.mean(values))
    std_value = float(np.std(values))

    if std_value <= 1e-12:
        std_value = 1.0

    scaled_values = (values - mean_value) / std_value
    return scaled_values, mean_value, std_value


def _scaled_to_original_params(
    scaled_weight: float,
    scaled_bias: float,
    x_mean: float,
    x_std: float,
    y_mean: float,
    y_std: float,
) -> tuple[float, float]:
    """Convert normalized-space parameters back to original data scale."""
    original_weight = (y_std * scaled_weight) / x_std
    original_bias = y_mean + (y_std * scaled_bias) - (original_weight * x_mean)
    return float(original_weight), float(original_bias)


def _format_compact(value: float) -> str:
    """Format a numeric value compactly to avoid very long text in UI panels."""
    if not np.isfinite(value):
        return "nan"

    abs_value = abs(value)
    if abs_value >= 1e4 or (abs_value > 0 and abs_value < 1e-3):
        return f"{value:.3e}"
    return f"{value:.4f}"


def _predict(x_values: np.ndarray, weight: float, bias: float) -> np.ndarray:
    """Predict y values using y = wx + b."""
    return (weight * x_values) + bias


def _compute_gradients(
    x_values: np.ndarray,
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> tuple[float, float]:
    """Compute MSE gradients for weight and bias."""
    sample_count = float(x_values.shape[0])
    errors = y_pred - y_true
    gradient_w = float((2.0 / sample_count) * np.dot(errors, x_values))
    gradient_b = float((2.0 / sample_count) * np.sum(errors))
    return gradient_w, gradient_b


def _compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> tuple[float, float, float]:
    """Compute MSE, RMSE, and R2 for current predictions."""
    residuals = y_true - y_pred
    mse = float(np.mean(residuals**2))
    rmse = float(np.sqrt(mse))

    total_var = float(np.sum((y_true - np.mean(y_true)) ** 2))
    if total_var <= 1e-12:
        r2 = 1.0
    else:
        r2 = float(1.0 - (np.sum(residuals**2) / total_var))

    return mse, rmse, r2


def _line_points(
    x_values: np.ndarray,
    weight: float,
    bias: float,
) -> list[dict[str, float]]:
    """Return two points defining the current regression line for rendering."""
    x_min = float(np.min(x_values))
    x_max = float(np.max(x_values))
    x_start = min(x_min, 0.0)
    x_end = max(x_max, 0.0)

    if abs(x_end - x_start) < 1e-12:
        x_start -= 1.0
        x_end += 1.0

    return [
        {"x": x_start, "y": float((weight * x_start) + bias)},
        {"x": x_end, "y": float((weight * x_end) + bias)},
    ]


def _build_step_points(
    x_values: np.ndarray,
    y_values: np.ndarray,
    predictions: np.ndarray,
) -> list[dict[str, Any]]:
    """Build scatter payload with residual information for each point."""
    payload: list[dict[str, Any]] = []

    for index, x_value in enumerate(x_values):
        y_value = float(y_values[index])
        predicted_y = float(predictions[index])
        payload.append(
            {
                "point_index": int(index),
                "x": float(x_value),
                "y": y_value,
                "state": "data",
                "predicted_y": predicted_y,
                "residual": float(y_value - predicted_y),
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
    """Append one linear regression trace step."""
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


def build_linear_regression_response(request: DatasetRequest) -> AlgorithmResponse:
    """Run manual gradient descent and return a step-by-step regression trace."""
    if not request.points:
        raise ValueError("The request must include at least one point.")

    x_values, y_values = _to_xy(request.points)
    learning_rate, iterations = _parse_params(request.params)
    x_scaled, x_mean, x_std = _standardize_vector(x_values)
    y_scaled, y_mean, y_std = _standardize_vector(y_values)

    rng = np.random.default_rng(42)
    scaled_weight = float(rng.normal(loc=0.0, scale=0.5))
    scaled_bias = float(rng.normal(loc=0.0, scale=0.5))
    steps: list[StepResponse] = []

    initial_predictions_scaled = _predict(x_scaled, scaled_weight, scaled_bias)
    gradient_w, gradient_b = _compute_gradients(
        x_scaled,
        y_scaled,
        initial_predictions_scaled,
    )
    weight, bias = _scaled_to_original_params(
        scaled_weight,
        scaled_bias,
        x_mean,
        x_std,
        y_mean,
        y_std,
    )
    initial_predictions = _predict(x_values, weight, bias)
    mse, rmse, r2 = _compute_metrics(y_values, initial_predictions)

    _append_step(
        steps=steps,
        step_type="init",
        description="Initialized linear model parameters before gradient descent.",
        highlight="Starting with random weight and bias values, then iteratively minimizing loss.",
        points=_build_step_points(x_values, y_values, initial_predictions),
        metrics={
            "learning_rate": learning_rate,
            "iterations": iterations,
            "iteration": 0,
            "weight": round(weight, 6),
            "bias": round(bias, 6),
            "loss": round(mse, 6),
            "gradient_w": round(gradient_w, 6),
            "gradient_b": round(gradient_b, 6),
            "mse": round(mse, 6),
            "rmse": round(rmse, 6),
            "r2": round(r2, 6),
            "line_points": _line_points(x_values, weight, bias),
        },
    )

    final_iteration = 0
    for iteration in range(1, iterations + 1):
        predictions_scaled = _predict(x_scaled, scaled_weight, scaled_bias)
        gradient_w, gradient_b = _compute_gradients(
            x_scaled,
            y_scaled,
            predictions_scaled,
        )

        scaled_weight -= learning_rate * gradient_w
        scaled_bias -= learning_rate * gradient_b

        weight, bias = _scaled_to_original_params(
            scaled_weight,
            scaled_bias,
            x_mean,
            x_std,
            y_mean,
            y_std,
        )
        updated_predictions = _predict(x_values, weight, bias)
        mse, rmse, r2 = _compute_metrics(y_values, updated_predictions)
        final_iteration = iteration

        if not np.isfinite(mse):
            break

        _append_step(
            steps=steps,
            step_type="gradient_step",
            description=f"Applied gradient descent update at iteration {iteration}.",
            highlight=(
                f"Gradients moved the line by dW={gradient_w:.4f}, dB={gradient_b:.4f} "
                f"with learning rate {learning_rate}."
            ),
            points=_build_step_points(x_values, y_values, updated_predictions),
            metrics={
                "learning_rate": learning_rate,
                "iterations": iterations,
                "iteration": iteration,
                "weight": round(weight, 6),
                "bias": round(bias, 6),
                "loss": round(mse, 6),
                "gradient_w": round(gradient_w, 6),
                "gradient_b": round(gradient_b, 6),
                "mse": round(mse, 6),
                "rmse": round(rmse, 6),
                "r2": round(r2, 6),
                "line_points": _line_points(x_values, weight, bias),
            },
        )

    final_predictions = _predict(x_values, weight, bias)
    mse, rmse, r2 = _compute_metrics(y_values, final_predictions)

    _append_step(
        steps=steps,
        step_type="converged",
        description="Gradient descent completed. Final regression line is ready.",
        highlight=(
            f"Final model: y = {_format_compact(weight)}x + {_format_compact(bias)}. "
            f"R2={_format_compact(r2)}, RMSE={_format_compact(rmse)}."
        ),
        points=_build_step_points(x_values, y_values, final_predictions),
        metrics={
            "learning_rate": learning_rate,
            "iterations": iterations,
            "iteration": final_iteration,
            "weight": round(weight, 6),
            "bias": round(bias, 6),
            "loss": round(mse, 6),
            "gradient_w": 0.0,
            "gradient_b": 0.0,
            "mse": round(mse, 6),
            "rmse": round(rmse, 6),
            "r2": round(r2, 6),
            "line_points": _line_points(x_values, weight, bias),
        },
    )

    return AlgorithmResponse(
        algorithm="linear-regression",
        total_steps=len(steps),
        steps=steps,
    )