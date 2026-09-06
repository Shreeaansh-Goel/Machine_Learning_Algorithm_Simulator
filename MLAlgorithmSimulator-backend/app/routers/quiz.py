from __future__ import annotations

from datetime import date
from random import Random
from typing import Any, Literal
from uuid import uuid4

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sklearn.datasets import make_blobs, make_circles, make_classification, make_moons

from app.models.dataset import DataPoint, DatasetRequest, StepResponse
from app.services.dbscan_service import build_dbscan_response
from app.services.decision_tree_service import build_decision_tree_response
from app.services.kmeans_service import build_kmeans_response

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

Difficulty = Literal["beginner", "intermediate", "advanced"]


class QuizDataset(BaseModel):
	"""Dataset payload included in quiz questions."""

	points: list[DataPoint] = Field(default_factory=list)
	name: str


class QuizQuestion(BaseModel):
	"""Quiz question returned to frontend clients."""

	question_id: str
	quiz_type: int
	difficulty: Difficulty
	algorithm: str
	dataset: QuizDataset
	params_used: dict[str, Any] = Field(default_factory=dict)
	question_text: str
	options: list[str] | None = None
	correct_answer: str | int | dict[str, Any]
	ground_truth_steps: list[StepResponse] = Field(default_factory=list)
	hint_texts: list[str] = Field(default_factory=list)
	concept_tested: str
	concept_definition: str
	explanation_after: str
	xp_reward: int
	time_limit_seconds: int | None = None


class QuizGenerateRequest(BaseModel):
	"""Request body for quiz generation endpoint."""

	quiz_type: int = Field(ge=1, le=5)
	difficulty: Difficulty = "beginner"
	algorithm: str | None = None


class EvaluateParamsRequest(BaseModel):
	"""Request payload for parameter tuning evaluation."""

	question_id: str
	student_params: dict[str, Any] = Field(default_factory=dict)
	dataset: QuizDataset | None = None


class EvaluateParamsResponse(BaseModel):
	"""Response payload for parameter tuning evaluation."""

	student_silhouette: float | None = None
	ideal_silhouette: float | None = None
	student_clusters: int
	ideal_clusters: int
	score_pct: int
	feedback_text: str


PARAM_TUNING_REGISTRY: dict[str, dict[str, Any]] = {}


CONCEPT_DEFINITIONS: dict[str, str] = {
	"DBSCAN Core Point": (
		"A point with at least MinPts neighbors inside epsilon. Core points start "
		"and expand density-connected clusters."
	),
	"DBSCAN Boundary Decision": (
		"Boundary cases in DBSCAN happen when neighbor counts are near MinPts. "
		"A one-neighbor difference can flip a point from core to noise."
	),
	"Algorithm Selection": (
		"Algorithm choice depends on data geometry and assumptions. Pick methods "
		"whose bias matches the structure in the dataset."
	),
	"Hyperparameter Tuning": (
		"Good hyperparameters balance fit quality and robustness. Metrics such as "
		"silhouette score help compare settings objectively."
	),
	"Metric Interpretation": (
		"Metrics summarize model behavior. Correct interpretation tells you whether "
		"to trust predictions and what to tune next."
	),
	"K-Means Assignment": (
		"K-Means assignment picks the nearest centroid per point. This step creates "
		"Voronoi-style cluster regions."
	),
	"Decision Tree Splits": (
		"Decision trees split features to reduce impurity. Early splits usually carry "
		"the strongest separation signal."
	),
}


def _to_points(features: np.ndarray, labels: np.ndarray | None = None) -> list[DataPoint]:
	"""Convert NumPy arrays into quiz DataPoint objects."""
	payload: list[DataPoint] = []
	for index, row in enumerate(features):
		label_value = None
		if labels is not None:
			label_value = str(labels[index])
		payload.append(DataPoint(x=float(row[0]), y=float(row[1]), label=label_value))
	return payload


def _run_dbscan(points: list[DataPoint], params: dict[str, Any]) -> list[StepResponse]:
	"""Run DBSCAN through existing service and return generated steps."""
	response = build_dbscan_response(DatasetRequest(points=points, params=params))
	return response.steps


def _run_kmeans(points: list[DataPoint], params: dict[str, Any]) -> list[StepResponse]:
	"""Run K-Means through existing service and return generated steps."""
	response = build_kmeans_response(DatasetRequest(points=points, params=params))
	return response.steps


def _run_decision_tree(points: list[DataPoint], params: dict[str, Any]) -> list[StepResponse]:
	"""Run Decision Tree through existing service and return generated steps."""
	response = build_decision_tree_response(DatasetRequest(points=points, params=params))
	return response.steps


def _count_clusters(step: StepResponse) -> int:
	"""Count discovered non-noise cluster ids from a step payload."""
	metric_count = step.metrics.get("clusters_found")
	if isinstance(metric_count, int):
		return metric_count

	cluster_ids: set[int] = set()
	for point in step.points:
		cluster_value = point.get("cluster")
		if cluster_value is None:
			continue
		if isinstance(cluster_value, (int, float)) and int(cluster_value) >= 0:
			cluster_ids.add(int(cluster_value))
	return len(cluster_ids)


def _silhouette_from_step(step: StepResponse) -> float | None:
	"""Extract silhouette score from a step metrics payload."""
	value = step.metrics.get("silhouette_score")
	if isinstance(value, (float, int)):
		return float(value)
	return None


def _difficulty_xp(difficulty: Difficulty, beginner: int, intermediate: int, advanced: int) -> int:
	"""Resolve xp reward by difficulty."""
	if difficulty == "beginner":
		return beginner
	if difficulty == "intermediate":
		return intermediate
	return advanced


def _random_noise_dataset(rng: Random) -> tuple[list[DataPoint], str]:
	"""Generate broad uniform random-noise dataset."""
	np_rng = np.random.default_rng(rng.randint(1, 10_000_000))
	features = np_rng.uniform(low=-5.0, high=5.0, size=(220, 2))
	return _to_points(features), "random_noise"


def _blobs_dataset(rng: Random, centers: int = 3, std: float = 0.8) -> tuple[list[DataPoint], str]:
	"""Generate isotropic blob dataset."""
	features, labels = make_blobs(
		n_samples=220,
		centers=centers,
		cluster_std=std,
		random_state=rng.randint(1, 10_000_000),
	)
	return _to_points(features, labels), "blobs"


def _moons_dataset(rng: Random, noise: float = 0.08) -> tuple[list[DataPoint], str]:
	"""Generate moon-shaped dataset."""
	features, labels = make_moons(
		n_samples=220,
		noise=noise,
		random_state=rng.randint(1, 10_000_000),
	)
	return _to_points(features, labels), "moons"


def _circles_dataset(rng: Random, noise: float = 0.04) -> tuple[list[DataPoint], str]:
	"""Generate concentric circles dataset."""
	features, labels = make_circles(
		n_samples=220,
		noise=noise,
		factor=0.5,
		random_state=rng.randint(1, 10_000_000),
	)
	return _to_points(features, labels), "circles"


def _anisotropic_dataset(rng: Random) -> tuple[list[DataPoint], str]:
	"""Generate anisotropic dataset for harder clustering tasks."""
	features, labels = make_blobs(
		n_samples=220,
		centers=3,
		cluster_std=1.0,
		random_state=rng.randint(1, 10_000_000),
	)
	transform = np.array([[0.6, -0.7], [-0.35, 0.8]], dtype=float)
	transformed = features @ transform
	return _to_points(transformed, labels), "anisotropic"


def _linearly_separable_dataset(rng: Random) -> tuple[list[DataPoint], str]:
	"""Generate linearly separable labeled dataset for classification selection quiz."""
	features, labels = make_classification(
		n_samples=220,
		n_features=2,
		n_redundant=0,
		n_informative=2,
		n_clusters_per_class=1,
		class_sep=2.0,
		random_state=rng.randint(1, 10_000_000),
	)
	return _to_points(features, labels), "linear_separable"


def _shuffle_options(
	correct_option: str,
	distractors: list[str],
	rng: Random,
) -> tuple[list[str], int]:
	"""Shuffle options and return shuffled list with correct index."""
	options = [correct_option, *distractors]
	rng.shuffle(options)
	return options, options.index(correct_option)


def _generate_type_one(difficulty: Difficulty, rng: Random) -> QuizQuestion:
	"""Generate quiz type 1: count discovered clusters."""
	if difficulty == "beginner":
		points, dataset_name = _blobs_dataset(rng, centers=3, std=0.55)
	elif difficulty == "intermediate":
		builder = rng.choice([_moons_dataset, _circles_dataset])
		points, dataset_name = builder(rng)
	else:
		builder = rng.choice([_anisotropic_dataset, _random_noise_dataset])
		points, dataset_name = builder(rng)

	algorithm = rng.choice(["dbscan", "kmeans"])
	if algorithm == "dbscan":
		params = {
			"eps": round(rng.uniform(0.18, 0.55), 2),
			"min_samples": rng.randint(4, 8),
			"metric": "euclidean",
		}
		steps = _run_dbscan(points, params)
		final_step = steps[-1]
		cluster_count = _count_clusters(final_step)
		question_text = (
			f"DBSCAN was run on this dataset with eps={params['eps']} and "
			f"min_samples={params['min_samples']}. How many clusters did it find? "
			"(Noise points do not count as clusters.)"
		)
	else:
		k_value = rng.randint(2, 5 if difficulty == "beginner" else 6)
		params = {
			"k": k_value,
			"max_iter": 80,
			"init": rng.choice(["random", "kmeans++"]),
		}
		steps = _run_kmeans(points, params)
		final_step = steps[-1]
		cluster_count = _count_clusters(final_step)
		question_text = (
			f"K-Means was run with K={k_value}. How many clusters are shown "
			"in the final result?"
		)

	lower_hint = max(cluster_count - 1, 1)
	upper_hint = cluster_count + 1
	return QuizQuestion(
		question_id=str(uuid4()),
		quiz_type=1,
		difficulty=difficulty,
		algorithm=algorithm,
		dataset=QuizDataset(points=points, name=dataset_name),
		params_used=params,
		question_text=question_text,
		options=None,
		correct_answer=cluster_count,
		ground_truth_steps=steps,
		hint_texts=[
			"Look for point groups that are clearly separated in space.",
			f"There are between {lower_hint} and {upper_hint} clusters.",
			f"The answer is {cluster_count}.",
		],
		concept_tested="DBSCAN Core Point",
		concept_definition=CONCEPT_DEFINITIONS["DBSCAN Core Point"],
		explanation_after=(
			"Cluster counting depends on density connectivity (DBSCAN) or centroid "
			"partitioning (K-Means). Noise points are excluded from DBSCAN counts."
		),
		xp_reward=_difficulty_xp(difficulty, 10, 20, 35),
		time_limit_seconds=30 if difficulty == "advanced" else None,
	)


def _generate_type_two(difficulty: Difficulty, algorithm_hint: str | None, rng: Random) -> QuizQuestion:
	"""Generate quiz type 2: predict what happens next."""
	selectable_algorithms = ["dbscan", "kmeans", "decision-tree"]
	algorithm = (
		algorithm_hint.lower() if algorithm_hint and algorithm_hint.lower() in selectable_algorithms else rng.choice(selectable_algorithms)
	)

	if algorithm == "dbscan":
		points, dataset_name = _moons_dataset(rng, noise=0.1 if difficulty == "advanced" else 0.08)
		params = {
			"eps": round(rng.uniform(0.18, 0.36), 2),
			"min_samples": rng.randint(4, 7),
			"metric": "euclidean",
		}
		steps = _run_dbscan(points, params)
		candidates = [step for step in steps if step.step_type == "count_neighbors"]
		if not candidates:
			raise ValueError("Unable to generate DBSCAN boundary step for quiz type 2.")

		chosen_step = min(
			candidates,
			key=lambda step: abs(
				int(step.metrics.get("neighbor_count", 0)) - int(params["min_samples"])
			),
		)
		chosen_index = int(chosen_step.step_index)
		neighbor_count = int(chosen_step.metrics.get("neighbor_count", 0))

		if neighbor_count >= int(params["min_samples"]):
			correct = "The point becomes a core point and cluster expansion begins"
			resolution = "core"
		else:
			correct = "The point is labeled as noise because it lacks neighbors"
			resolution = "noise"

		options, correct_index = _shuffle_options(
			correct_option=correct,
			distractors=[
				"The point becomes a border point immediately",
				"No state changes happen for this point",
				"The algorithm skips directly to completion",
			],
			rng=rng,
		)

		return QuizQuestion(
			question_id=str(uuid4()),
			quiz_type=2,
			difficulty=difficulty,
			algorithm="dbscan",
			dataset=QuizDataset(points=points, name=dataset_name),
			params_used={**params, "paused_step_index": chosen_index},
			question_text=(
				"The algorithm is paused at the highlighted point (white border). "
				"What happens next?"
			),
			options=options,
			correct_answer=correct_index,
			ground_truth_steps=steps,
			hint_texts=[
				"Use DBSCAN's rule: core status depends on epsilon-neighborhood size.",
				"Count neighbors inside epsilon and compare with MinPts.",
				(
					f"There are {neighbor_count} neighbors and MinPts is {params['min_samples']}. "
					f"So this resolves as a {resolution} point."
				),
			],
			concept_tested="DBSCAN Boundary Decision",
			concept_definition=CONCEPT_DEFINITIONS["DBSCAN Boundary Decision"],
			explanation_after=(
				"In DBSCAN, this boundary decision determines whether the region can "
				"expand as a cluster or gets rejected as noise."
			),
			xp_reward=_difficulty_xp(difficulty, 15, 25, 40),
			time_limit_seconds=45 if difficulty == "advanced" else None,
		)

	if algorithm == "kmeans":
		points, dataset_name = _blobs_dataset(rng, centers=3, std=0.75)
		k_value = rng.randint(3, 5)
		params = {"k": k_value, "max_iter": 60, "init": "kmeans++"}
		steps = _run_kmeans(points, params)
		assign_steps = [step for step in steps if step.step_type == "assign"]
		if not assign_steps:
			raise ValueError("Unable to generate assignment step for K-Means quiz type 2.")

		chosen_step = assign_steps[min(len(assign_steps) - 1, 1)]
		chosen_index = int(chosen_step.step_index)

		candidate_points = [
			point
			for point in chosen_step.points
			if point.get("state") != "centroid" and point.get("assigned_centroid") is not None
		]
		highlighted = rng.choice(candidate_points)
		highlighted_index = int(highlighted.get("point_index", 0))
		assigned_centroid = int(highlighted.get("assigned_centroid", 0))
		correct = f"Centroid {assigned_centroid + 1}"

		centroid_options = [f"Centroid {index + 1}" for index in range(k_value)]
		distractors = [option for option in centroid_options if option != correct][:3]
		while len(distractors) < 3:
			distractors.append(f"No centroid change {len(distractors) + 1}")
		options, correct_index = _shuffle_options(correct, distractors[:3], rng)

		return QuizQuestion(
			question_id=str(uuid4()),
			quiz_type=2,
			difficulty=difficulty,
			algorithm="kmeans",
			dataset=QuizDataset(points=points, name=dataset_name),
			params_used={
				**params,
				"paused_step_index": chosen_index,
				"highlighted_point_index": highlighted_index,
			},
			question_text=(
				"K-Means is paused during assignment. Which centroid will the "
				"highlighted point be assigned to next?"
			),
			options=options,
			correct_answer=correct_index,
			ground_truth_steps=steps,
			hint_texts=[
				"K-Means assigns each point to its nearest centroid.",
				"Compare the highlighted point's distances to all visible centroids.",
				(
					"The minimum distance is to "
					f"{correct}."
				),
			],
			concept_tested="K-Means Assignment",
			concept_definition=CONCEPT_DEFINITIONS["K-Means Assignment"],
			explanation_after=(
				"The assignment step is equivalent to selecting the nearest Voronoi "
				"cell center for each point."
			),
			xp_reward=_difficulty_xp(difficulty, 15, 25, 40),
			time_limit_seconds=45 if difficulty == "advanced" else None,
		)

	points, dataset_name = _linearly_separable_dataset(rng)
	params = {
		"max_depth": 4 if difficulty == "beginner" else 6,
		"criterion": "gini",
		"min_samples_split": 2,
	}
	steps = _run_decision_tree(points, params)
	split_steps = [step for step in steps if step.step_type == "split"]
	if not split_steps:
		raise ValueError("Unable to generate split step for Decision Tree quiz type 2.")

	chosen_step = split_steps[0]
	chosen_index = int(chosen_step.step_index)
	current_feature = str(chosen_step.split_line.get("x_or_y", "x")) if chosen_step.split_line else "x"

	next_split = None
	for step in split_steps:
		if int(step.step_index) > chosen_index:
			next_split = step
			break

	if next_split and next_split.split_line:
		next_feature = str(next_split.split_line.get("x_or_y", "x"))
		correct = f"Feature {next_feature}"
	else:
		correct = "No further split; this branch becomes a leaf"

	options, correct_index = _shuffle_options(
		correct,
		[
			f"Feature {current_feature}",
			"Random feature is selected",
			"The tree prunes this branch immediately",
		],
		rng,
	)

	return QuizQuestion(
		question_id=str(uuid4()),
		quiz_type=2,
		difficulty=difficulty,
		algorithm="decision-tree",
		dataset=QuizDataset(points=points, name=dataset_name),
		params_used={**params, "paused_step_index": chosen_index},
		question_text="The tree is paused at the highlighted node. What happens next?",
		options=options,
		correct_answer=correct_index,
		ground_truth_steps=steps,
		hint_texts=[
			"Decision trees continue splitting while impurity reduction is useful.",
			"Look at which axis most cleanly separates remaining active samples.",
			f"The next action corresponds to: {correct}.",
		],
		concept_tested="Decision Tree Splits",
		concept_definition=CONCEPT_DEFINITIONS["Decision Tree Splits"],
		explanation_after=(
			"The next split follows impurity minimization. If no meaningful reduction "
			"is possible, the branch becomes a leaf."
		),
		xp_reward=_difficulty_xp(difficulty, 15, 25, 40),
		time_limit_seconds=45 if difficulty == "advanced" else None,
	)


def _generate_type_three(difficulty: Difficulty, rng: Random) -> QuizQuestion:
	"""Generate quiz type 3: pick best algorithm for a dataset shape."""
	scenarios = [
		{
			"dataset": lambda: _moons_dataset(rng, noise=0.1),
			"correct": "DBSCAN",
			"explanation": (
				"Moon-shaped clusters are non-convex. DBSCAN handles arbitrary shapes "
				"while K-Means tends to split moons incorrectly."
			),
			"algorithm_key": "dbscan",
			"params": {"eps": 0.22, "min_samples": 5, "metric": "euclidean"},
		},
		{
			"dataset": lambda: _blobs_dataset(rng, centers=3, std=0.55),
			"correct": "K-Means",
			"explanation": (
				"Well-separated blob clusters align with K-Means assumptions of compact, "
				"centroid-centered groups."
			),
			"algorithm_key": "kmeans",
			"params": {"k": 3, "max_iter": 80, "init": "kmeans++"},
		},
		{
			"dataset": lambda: _circles_dataset(rng, noise=0.05),
			"correct": "DBSCAN",
			"explanation": (
				"Concentric circles violate linear and spherical assumptions. DBSCAN can "
				"recover both rings via density connectivity."
			),
			"algorithm_key": "dbscan",
			"params": {"eps": 0.16, "min_samples": 5, "metric": "euclidean"},
		},
		{
			"dataset": lambda: _linearly_separable_dataset(rng),
			"correct": "Decision Tree",
			"explanation": (
				"For separable labeled classes, a classifier such as Decision Tree can "
				"create interpretable class boundaries."
			),
			"algorithm_key": "decision-tree",
			"params": {"max_depth": 4, "criterion": "gini", "min_samples_split": 2},
		},
	]
	scenario = rng.choice(scenarios)
	points, dataset_name = scenario["dataset"]()

	if scenario["algorithm_key"] == "dbscan":
		steps = _run_dbscan(points, scenario["params"])
	elif scenario["algorithm_key"] == "kmeans":
		steps = _run_kmeans(points, scenario["params"])
	else:
		steps = _run_decision_tree(points, scenario["params"])

	base_options = ["K-Means", "DBSCAN", "Linear Regression", "Decision Tree"]
	rng.shuffle(base_options)

	return QuizQuestion(
		question_id=str(uuid4()),
		quiz_type=3,
		difficulty=difficulty,
		algorithm=scenario["algorithm_key"],
		dataset=QuizDataset(points=points, name=dataset_name),
		params_used=scenario["params"],
		question_text=(
			"Looking at the shape of this data, which algorithm would produce the "
			"best clustering or classification result?"
		),
		options=base_options,
		correct_answer=scenario["correct"],
		ground_truth_steps=steps,
		hint_texts=[
			"Inspect geometry first: curved, circular, or compact blob-like groups?",
			"K-Means assumes roughly spherical regions. DBSCAN does not.",
			f"This dataset favors {scenario['correct']} because of its shape assumptions.",
		],
		concept_tested="Algorithm Selection",
		concept_definition=CONCEPT_DEFINITIONS["Algorithm Selection"],
		explanation_after=scenario["explanation"],
		xp_reward=_difficulty_xp(difficulty, 15, 20, 30),
		time_limit_seconds=40 if difficulty == "advanced" else None,
	)


def _clusters_and_silhouette(algorithm: str, steps: list[StepResponse]) -> tuple[int, float | None]:
	"""Extract clusters and silhouette from final step based on algorithm."""
	final_step = steps[-1]
	if algorithm == "dbscan":
		return _count_clusters(final_step), _silhouette_from_step(final_step)

	if algorithm == "kmeans":
		clusters = _count_clusters(final_step)
		silhouette = _silhouette_from_step(final_step)
		return clusters, silhouette

	return 0, None


def _generate_type_four(difficulty: Difficulty, rng: Random) -> QuizQuestion:
	"""Generate quiz type 4: parameter tuning challenge."""
	cases = ["dbscan_small_eps", "dbscan_large_eps", "kmeans_small_k", "kmeans_large_k"]
	case_key = rng.choice(cases)

	if case_key == "dbscan_small_eps":
		points, dataset_name = _moons_dataset(rng, noise=0.09)
		bad_params = {"eps": 0.08, "min_samples": 6, "metric": "euclidean"}
		ideal_params = {"eps": 0.24, "min_samples": 5, "metric": "euclidean"}
		algorithm = "dbscan"
		issue_text = "most points are marked as noise"
		hint_direction = "small"
		hint_range = "0.18 and 0.32"
	elif case_key == "dbscan_large_eps":
		points, dataset_name = _blobs_dataset(rng, centers=3, std=0.8)
		bad_params = {"eps": 1.9, "min_samples": 2, "metric": "euclidean"}
		ideal_params = {"eps": 0.52, "min_samples": 4, "metric": "euclidean"}
		algorithm = "dbscan"
		issue_text = "nearly everything merges into one giant cluster"
		hint_direction = "large"
		hint_range = "0.35 and 0.75"
	elif case_key == "kmeans_small_k":
		points, dataset_name = _blobs_dataset(rng, centers=4, std=0.75)
		bad_params = {"k": 2, "max_iter": 70, "init": "kmeans++"}
		ideal_params = {"k": 4, "max_iter": 70, "init": "kmeans++"}
		algorithm = "kmeans"
		issue_text = "distinct groups are merged together"
		hint_direction = "small"
		hint_range = "3 and 5"
	else:
		points, dataset_name = _blobs_dataset(rng, centers=3, std=0.75)
		bad_params = {"k": 6, "max_iter": 70, "init": "kmeans++"}
		ideal_params = {"k": 3, "max_iter": 70, "init": "kmeans++"}
		algorithm = "kmeans"
		issue_text = "clusters are over-split"
		hint_direction = "large"
		hint_range = "2 and 4"

	if algorithm == "dbscan":
		bad_steps = _run_dbscan(points, bad_params)
		ideal_steps = _run_dbscan(points, ideal_params)
	else:
		bad_steps = _run_kmeans(points, bad_params)
		ideal_steps = _run_kmeans(points, ideal_params)

	baseline_clusters, baseline_silhouette = _clusters_and_silhouette(algorithm, bad_steps)
	ideal_clusters, ideal_silhouette = _clusters_and_silhouette(algorithm, ideal_steps)

	question_id = str(uuid4())
	PARAM_TUNING_REGISTRY[question_id] = {
		"algorithm": algorithm,
		"dataset": points,
		"ideal_params": ideal_params,
		"bad_params": bad_params,
		"baseline_clusters": baseline_clusters,
		"baseline_silhouette": baseline_silhouette,
		"ideal_clusters": ideal_clusters,
		"ideal_silhouette": ideal_silhouette,
	}

	if algorithm == "dbscan":
		noise_count = int(bad_steps[-1].metrics.get("noise_count", 0))
		total_points = max(int(bad_steps[-1].metrics.get("total_points", len(points))), 1)
		noise_ratio = round((noise_count / total_points) * 100.0, 1)
		question_text = (
			"This DBSCAN result is poor. "
			f"{noise_ratio}% of points are noise and {issue_text}. "
			f"Adjust epsilon and min_samples to find {ideal_clusters} clusters."
		)
	else:
		question_text = (
			"This K-Means result is poor because "
			f"{issue_text}. Tune K and max_iter to recover the best cluster structure."
		)

	return QuizQuestion(
		question_id=question_id,
		quiz_type=4,
		difficulty=difficulty,
		algorithm=algorithm,
		dataset=QuizDataset(points=points, name=dataset_name),
		params_used=bad_params,
		question_text=question_text,
		options=None,
		correct_answer=ideal_params,
		ground_truth_steps=bad_steps,
		hint_texts=[
			f"Current main parameter is too {hint_direction}; adjust toward a middle value.",
			f"Try values between {hint_range}.",
			f"A strong setting is close to {ideal_params}.",
		],
		concept_tested="Hyperparameter Tuning",
		concept_definition=CONCEPT_DEFINITIONS["Hyperparameter Tuning"],
		explanation_after=(
			"Good tuning aligns model assumptions with dataset geometry. Compare cluster "
			"count and silhouette score against a known-good reference."
		),
		xp_reward=50,
		time_limit_seconds=70 if difficulty == "advanced" else None,
	)


def _metric_question_bank() -> list[dict[str, Any]]:
	"""Return static metric-interpretation question bank."""
	return [
		{
			"question": "Silhouette score is 0.18. What does this mean?",
			"correct": "Clusters overlap significantly; points are almost as close to other clusters as their own",
			"wrong": [
				"Clusters are well-separated",
				"Too many noise points guarantees this score",
				"The algorithm did not converge",
			],
			"algorithm": "dbscan",
			"concept": "Metric Interpretation",
		},
		{
			"question": "K-Means ran for 50 iterations before stopping. What likely happened?",
			"correct": "It hit max_iterations without stable convergence; try better initialization",
			"wrong": [
				"It converged perfectly",
				"The dataset is too small to cluster",
				"K must always be too large",
			],
			"algorithm": "kmeans",
			"concept": "Metric Interpretation",
		},
		{
			"question": "DBSCAN found 0 clusters (all noise). What should you try?",
			"correct": "Increase epsilon because neighborhoods are currently too small",
			"wrong": [
				"Decrease min_samples to 1 and stop",
				"Add duplicate points to force clusters",
				"Switch to linear regression",
			],
			"algorithm": "dbscan",
			"concept": "Metric Interpretation",
		},
		{
			"question": "Decision Tree training accuracy is 99%, but you expect poor generalization. Why?",
			"correct": "The tree is likely overfitting; constrain depth or apply pruning",
			"wrong": [
				"The dataset is guaranteed perfect",
				"Increase max_depth to improve robustness",
				"Overfitting is impossible for trees",
			],
			"algorithm": "decision-tree",
			"concept": "Metric Interpretation",
		},
		{
			"question": "Precision=0.95 and Recall=0.31 for class 'cancer'. What is the clinical risk?",
			"correct": "High false negatives; many true cancer cases are being missed",
			"wrong": [
				"Too many false alarms only",
				"The model is perfectly calibrated",
				"High precision makes recall irrelevant",
			],
			"algorithm": "decision-tree",
			"concept": "Metric Interpretation",
		},
		{
			"question": (
				"Macro F1 is 0.88 but Class A F1=0.95 and Class B F1=0.61. "
				"What does this imply?"
			),
			"correct": "Performance is much weaker on Class B; investigate class imbalance or features",
			"wrong": [
				"Performance is even across classes",
				"0.88 is automatically the worst-case class score",
				"Macro averaging ignores minority classes completely",
			],
			"algorithm": "decision-tree",
			"concept": "Metric Interpretation",
		},
	]


def _generate_type_five(difficulty: Difficulty, rng: Random) -> QuizQuestion:
	"""Generate quiz type 5: interpret metrics and diagnose behavior."""
	bank_item = rng.choice(_metric_question_bank())
	algorithm = str(bank_item["algorithm"])

	if algorithm == "dbscan":
		points, dataset_name = _moons_dataset(rng, noise=0.12)
		params = {"eps": 0.16, "min_samples": 6, "metric": "euclidean"}
		steps = _run_dbscan(points, params)
	elif algorithm == "kmeans":
		points, dataset_name = _blobs_dataset(rng, centers=3, std=1.1)
		params = {"k": 3, "max_iter": 50, "init": "random"}
		steps = _run_kmeans(points, params)
	else:
		points, dataset_name = _linearly_separable_dataset(rng)
		params = {"max_depth": 12, "criterion": "gini", "min_samples_split": 2}
		steps = _run_decision_tree(points, params)

	options, correct_index = _shuffle_options(
		correct_option=str(bank_item["correct"]),
		distractors=[str(choice) for choice in bank_item["wrong"]],
		rng=rng,
	)

	return QuizQuestion(
		question_id=str(uuid4()),
		quiz_type=5,
		difficulty=difficulty,
		algorithm=algorithm,
		dataset=QuizDataset(points=points, name=dataset_name),
		params_used=params,
		question_text=str(bank_item["question"]),
		options=options,
		correct_answer=correct_index,
		ground_truth_steps=steps,
		hint_texts=[
			"Focus on what the metric mathematically measures.",
			"Ask what failure mode this metric pattern implies in practice.",
			f"The strongest interpretation is: {bank_item['correct']}",
		],
		concept_tested=str(bank_item["concept"]),
		concept_definition=CONCEPT_DEFINITIONS["Metric Interpretation"],
		explanation_after=(
			"Metric interpretation is a diagnosis task: numbers are useful only when "
			"translated into behavior, risk, and next actions."
		),
		xp_reward=_difficulty_xp(difficulty, 10, 20, 30),
		time_limit_seconds=40 if difficulty == "advanced" else None,
	)


def _generate_question(
	quiz_type: int,
	difficulty: Difficulty,
	algorithm_hint: str | None,
	rng: Random,
) -> QuizQuestion:
	"""Dispatch quiz generation by quiz type."""
	if quiz_type == 1:
		return _generate_type_one(difficulty, rng)
	if quiz_type == 2:
		return _generate_type_two(difficulty, algorithm_hint, rng)
	if quiz_type == 3:
		return _generate_type_three(difficulty, rng)
	if quiz_type == 4:
		return _generate_type_four(difficulty, rng)
	if quiz_type == 5:
		return _generate_type_five(difficulty, rng)
	raise ValueError("Unsupported quiz_type. Must be in range 1..5.")


def _evaluate_student_params(
	algorithm: str,
	points: list[DataPoint],
	student_params: dict[str, Any],
) -> tuple[int, float | None]:
	"""Evaluate student parameters and return resulting clusters + silhouette."""
	if algorithm == "dbscan":
		student_steps = _run_dbscan(points, student_params)
	elif algorithm == "kmeans":
		student_steps = _run_kmeans(points, student_params)
	else:
		raise ValueError("Unsupported algorithm for parameter tuning evaluation.")

	return _clusters_and_silhouette(algorithm, student_steps)


def _score_tuning_attempt(
	student_clusters: int,
	ideal_clusters: int,
	student_silhouette: float | None,
	ideal_silhouette: float | None,
	baseline_clusters: int,
	baseline_silhouette: float | None,
) -> tuple[int, str]:
	"""Score tuning attempt based on cluster and silhouette proximity."""
	silhouette_close = False
	if student_silhouette is not None and ideal_silhouette is not None:
		silhouette_close = abs(student_silhouette - ideal_silhouette) <= 0.05

	if student_clusters == ideal_clusters and silhouette_close:
		return 100, "Excellent tuning. You matched the target cluster structure and quality."

	if student_clusters == ideal_clusters:
		return 75, "Great cluster count. Now fine-tune parameters to improve silhouette quality."

	if abs(student_clusters - ideal_clusters) <= 1:
		return 50, "Close. Your cluster count is near target, but separation can be improved."

	baseline_gap = abs(baseline_clusters - ideal_clusters)
	student_gap = abs(student_clusters - ideal_clusters)
	improved = student_gap < baseline_gap

	if (
		not improved
		and student_silhouette is not None
		and baseline_silhouette is not None
		and student_silhouette > baseline_silhouette
	):
		improved = True

	if improved:
		return 25, "Nice try. This attempt improved over baseline; continue refining parameters."

	return 25, "Thanks for trying. Adjust parameters further to move cluster count toward target."


@router.post("/generate", response_model=QuizQuestion)
def generate_quiz_question(request: QuizGenerateRequest) -> QuizQuestion:
	"""Generate a quiz question based on selected type, difficulty, and optional algorithm."""
	rng = Random()
	try:
		return _generate_question(
			quiz_type=request.quiz_type,
			difficulty=request.difficulty,
			algorithm_hint=request.algorithm,
			rng=rng,
		)
	except ValueError as error:
		raise HTTPException(status_code=400, detail=str(error)) from error
	except Exception as error:  # pragma: no cover - safety fallback
		raise HTTPException(
			status_code=500,
			detail="Unable to generate quiz question.",
		) from error


@router.post("/evaluate-params", response_model=EvaluateParamsResponse)
def evaluate_quiz_params(request: EvaluateParamsRequest) -> EvaluateParamsResponse:
	"""Evaluate user-submitted parameters for type-4 tuning questions."""
	snapshot = PARAM_TUNING_REGISTRY.get(request.question_id)
	if snapshot is None:
		raise HTTPException(
			status_code=404,
			detail="Question session expired or was not found.",
		)

	algorithm = str(snapshot["algorithm"])
	points = request.dataset.points if request.dataset is not None else snapshot["dataset"]

	try:
		student_clusters, student_silhouette = _evaluate_student_params(
			algorithm=algorithm,
			points=points,
			student_params=request.student_params,
		)
	except ValueError as error:
		raise HTTPException(status_code=400, detail=str(error)) from error

	score_pct, feedback_text = _score_tuning_attempt(
		student_clusters=student_clusters,
		ideal_clusters=int(snapshot["ideal_clusters"]),
		student_silhouette=student_silhouette,
		ideal_silhouette=snapshot["ideal_silhouette"],
		baseline_clusters=int(snapshot["baseline_clusters"]),
		baseline_silhouette=snapshot["baseline_silhouette"],
	)

	return EvaluateParamsResponse(
		student_silhouette=student_silhouette,
		ideal_silhouette=snapshot["ideal_silhouette"],
		student_clusters=student_clusters,
		ideal_clusters=int(snapshot["ideal_clusters"]),
		score_pct=score_pct,
		feedback_text=feedback_text,
	)


@router.get("/daily-challenge", response_model=QuizQuestion)
def get_daily_challenge() -> QuizQuestion:
	"""Return deterministic daily challenge question based on current date seed."""
	seed = int(date.today().strftime("%Y%m%d"))
	rng = Random(seed)
	try:
		question = _generate_question(
			quiz_type=4,
			difficulty="intermediate",
			algorithm_hint=None,
			rng=rng,
		)
	except ValueError as error:
		raise HTTPException(status_code=400, detail=str(error)) from error

	question.xp_reward = int(question.xp_reward * 2)
	question.params_used = {**question.params_used, "daily_challenge": True}
	return question
