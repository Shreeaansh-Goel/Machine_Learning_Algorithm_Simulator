import { BAR_COLOR_CLASSES, getBarColor } from "./metricColors";

/**
 * @typedef {{
 *  key: string,
 *  label: string,
 *  value: number | string | null,
 *  subtitle: string,
 *  barValue: number,
 *  barColor: string,
 *  tooltip: string,
 *  decimals?: number,
 *  suffix?: string,
 * }} MetricCardConfig
 */

/**
 * Safely converts unknown values to numbers.
 * @param {unknown} value
 * @returns {number | null}
 */
const asNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * Clamps number to [0, 1] for progress bars.
 * @param {number} value
 * @returns {number}
 */
const clamp01 = (value) => Math.max(0, Math.min(value, 1));

/**
 * Returns normalized algorithm slug.
 * @param {string} algorithm
 * @returns {string}
 */
const normalizeAlgorithm = (algorithm) => String(algorithm ?? "").toLowerCase().trim();

/**
 * Formats weighted metric for subtitle display.
 * @param {number | null} value
 * @returns {string}
 */
const weightedText = (value) => (value === null ? "-" : value.toFixed(3));

/**
 * Builds DBSCAN metric cards.
 * @param {Record<string, unknown>} metrics
 * @returns {MetricCardConfig[]}
 */
const buildDBSCANCards = (metrics) => {
  const clusters = asNumber(metrics.clusters_found) ?? 0;
  const noise = asNumber(metrics.noise_count) ?? 0;
  const processed = asNumber(metrics.points_processed) ?? 0;
  const total = asNumber(metrics.total_points) ?? 0;
  const silhouette = asNumber(metrics.silhouette_score);
  const noiseRatio = total > 0 ? (noise / total) * 100 : 0;

  return [
    {
      key: "clusters_found",
      label: "Clusters Found",
      value: clusters,
      subtitle: `${clusters} clusters + ${noise} noise points`,
      barValue: total > 0 ? clamp01(processed / total) : 0,
      barColor: BAR_COLOR_CLASSES.sky,
      tooltip: "Number of density-based groups currently discovered.",
      decimals: 0,
    },
    {
      key: "silhouette_score",
      label: "Silhouette Score",
      value: silhouette,
      subtitle:
        silhouette === null ? "cluster separation quality" : "cluster separation quality",
      barValue: silhouette === null ? 0 : clamp01(silhouette),
      barColor: getBarColor("silhouette_score", silhouette),
      tooltip:
        "Measures how clearly clusters are separated. Higher is better and appears after completion.",
      decimals: 3,
    },
    {
      key: "points_processed",
      label: "Points Processed",
      value: processed,
      subtitle: `of ${total} total`,
      barValue: total > 0 ? clamp01(processed / total) : 0,
      barColor: getBarColor("points_processed", processed),
      tooltip: "How many points DBSCAN has examined so far.",
      decimals: 0,
    },
    {
      key: "noise_ratio",
      label: "Noise Ratio",
      value: noiseRatio,
      subtitle: "outlier points",
      barValue: clamp01(noiseRatio / 100),
      barColor: getBarColor("noise_ratio", noiseRatio),
      tooltip: "Share of points marked as noise by DBSCAN.",
      decimals: 1,
      suffix: "%",
    },
  ];
};

/**
 * Builds K-Means metric cards.
 * @param {Record<string, unknown>} metrics
 * @returns {MetricCardConfig[]}
 */
const buildKMeansCards = (metrics) => {
  const iteration = asNumber(metrics.iteration) ?? 0;
  const maxIter = asNumber(metrics.max_iter) ?? 0;
  const inertia = asNumber(metrics.inertia);
  const changed = asNumber(metrics.points_changed) ?? 0;
  const total = asNumber(metrics.total_points) ?? 0;
  const silhouette = asNumber(metrics.silhouette_score);

  return [
    {
      key: "iteration",
      label: "Iteration",
      value: iteration,
      subtitle: `of ${maxIter} max`,
      barValue: maxIter > 0 ? clamp01(iteration / maxIter) : 0,
      barColor: BAR_COLOR_CLASSES.purple,
      tooltip: "Current optimization round for assignment and centroid updates.",
      decimals: 0,
    },
    {
      key: "inertia",
      label: "Inertia",
      value: inertia,
      subtitle: "within-cluster sum of squares (lower = better)",
      barValue: inertia === null ? 0 : clamp01(1 / (1 + Math.max(inertia, 0))),
      barColor: getBarColor("inertia", inertia),
      tooltip:
        "Total squared distance to centroids. Lower values indicate tighter clusters.",
      decimals: 2,
    },
    {
      key: "points_changed",
      label: "Points Changed",
      value: changed,
      subtitle: "reassigned this step",
      barValue: total > 0 ? clamp01(changed / total) : 0,
      barColor: BAR_COLOR_CLASSES.amber,
      tooltip: "How many points changed cluster assignment at this step.",
      decimals: 0,
    },
    {
      key: "silhouette_score",
      label: "Silhouette Score",
      value: silhouette,
      subtitle: "cluster separation quality",
      barValue: silhouette === null ? 0 : clamp01(silhouette),
      barColor: getBarColor("silhouette_score", silhouette),
      tooltip:
        "Only shown after convergence. Higher values indicate cleaner cluster separation.",
      decimals: 3,
    },
  ];
};

/**
 * Builds hierarchical clustering metric cards.
 * @param {Record<string, unknown>} metrics
 * @returns {MetricCardConfig[]}
 */
const buildHierarchicalCards = (metrics) => {
  const mergesDone = asNumber(metrics.merges_done) ?? 0;
  const totalMerges = asNumber(metrics.total_merges) ?? 0;
  const mergeDistance = asNumber(metrics.merge_distance);
  const clustersRemaining = asNumber(metrics.clusters_remaining);
  const silhouette = asNumber(metrics.silhouette_score);

  return [
    {
      key: "merges_done",
      label: "Merges Done",
      value: mergesDone,
      subtitle: `of ${totalMerges} total`,
      barValue: totalMerges > 0 ? clamp01(mergesDone / totalMerges) : 0,
      barColor: BAR_COLOR_CLASSES.purple,
      tooltip: "How many linkage merges have been executed.",
      decimals: 0,
    },
    {
      key: "merge_distance",
      label: "Current Distance",
      value: mergeDistance,
      subtitle: "linkage distance this merge",
      barValue:
        mergeDistance === null ? 0 : clamp01(1 / (1 + Math.max(mergeDistance, 0))),
      barColor: BAR_COLOR_CLASSES.amber,
      tooltip: "Distance between clusters chosen for the latest merge.",
      decimals: 3,
    },
    {
      key: "clusters_remaining",
      label: "Clusters Remaining",
      value: clustersRemaining,
      subtitle: "active groups not yet merged",
      barValue:
        clustersRemaining === null || totalMerges <= 0
          ? 0
          : clamp01(clustersRemaining / (totalMerges + 1)),
      barColor: BAR_COLOR_CLASSES.sky,
      tooltip: "Number of clusters still present in the dendrogram construction.",
      decimals: 0,
    },
    {
      key: "silhouette_score",
      label: "Silhouette Score",
      value: silhouette,
      subtitle: "cluster separation quality",
      barValue: silhouette === null ? 0 : clamp01(silhouette),
      barColor: getBarColor("silhouette_score", silhouette),
      tooltip: "Shown after completion to evaluate resulting cluster quality.",
      decimals: 3,
    },
  ];
};

/**
 * Builds classifier cards for Decision Tree / KNN / SVM.
 * @param {Record<string, unknown>} metrics
 * @returns {MetricCardConfig[]}
 */
const buildClassifierCards = (metrics) => {
  const accuracy = asNumber(metrics.accuracy);
  const precision = asNumber(metrics.precision);
  const recall = asNumber(metrics.recall);
  const f1 = asNumber(metrics.f1);

  const precisionWeighted = asNumber(metrics.precision_weighted);
  const recallWeighted = asNumber(metrics.recall_weighted);
  const f1Weighted = asNumber(metrics.f1_weighted);

  return [
    {
      key: "accuracy",
      label: "Accuracy",
      value: accuracy,
      subtitle:
        accuracy === null
          ? "overall correct predictions"
          : "overall correct predictions",
      barValue: accuracy === null ? 0 : clamp01(accuracy / 100),
      barColor: getBarColor("accuracy", accuracy),
      tooltip: "Percentage of all samples predicted correctly.",
      decimals: 1,
      suffix: "%",
    },
    {
      key: "precision",
      label: "Precision (Macro)",
      value: precision,
      subtitle:
        precision === null
          ? "TP / (TP + FP) per class, averaged"
          : `weighted ${weightedText(precisionWeighted)}`,
      barValue: precision === null ? 0 : clamp01(precision),
      barColor: getBarColor("precision", precision),
      tooltip:
        "How often predicted positives are correct, averaged equally across classes.",
      decimals: 3,
    },
    {
      key: "recall",
      label: "Recall (Macro)",
      value: recall,
      subtitle:
        recall === null
          ? "TP / (TP + FN) per class, averaged"
          : `weighted ${weightedText(recallWeighted)}`,
      barValue: recall === null ? 0 : clamp01(recall),
      barColor: getBarColor("recall", recall),
      tooltip:
        "How many true class members were recovered, averaged equally across classes.",
      decimals: 3,
    },
    {
      key: "f1",
      label: "F1 Score (Macro)",
      value: f1,
      subtitle:
        f1 === null
          ? "harmonic mean of precision and recall"
          : `weighted ${weightedText(f1Weighted)}`,
      barValue: f1 === null ? 0 : clamp01(f1),
      barColor: getBarColor("f1", f1),
      tooltip: "Balanced score that combines precision and recall.",
      decimals: 3,
    },
  ];
};

/**
 * Builds KNN metric cards.
 * @param {Record<string, unknown>} metrics
 * @returns {MetricCardConfig[]}
 */
const buildKNNCards = (metrics) => {
  const cards = buildClassifierCards(metrics);
  const votesForWinner = asNumber(metrics.votes_for_winner);
  const kValue = asNumber(metrics.k);
  const explicitConfidence = asNumber(metrics.prediction_confidence);
  const confidence =
    explicitConfidence !== null
      ? explicitConfidence
      : votesForWinner !== null && kValue && kValue > 0
        ? (votesForWinner / kValue) * 100
        : null;

  if (cards.length > 0) {
    cards[0] = {
      ...cards[0],
      subtitle:
        confidence === null
          ? "overall correct predictions"
          : `prediction confidence ${Math.round(confidence)}%`,
    };
  }

  return cards;
};

/**
 * Builds SVM metric cards.
 * @param {Record<string, unknown>} metrics
 * @returns {MetricCardConfig[]}
 */
const buildSVMCards = (metrics) => {
  const cards = buildClassifierCards(metrics);
  const supportVectors = asNumber(metrics.n_support_vectors);

  if (cards.length > 0) {
    cards[0] = {
      ...cards[0],
      subtitle:
        supportVectors === null
          ? "overall correct predictions"
          : `${Math.round(supportVectors)} support vectors define the margin`,
    };
  }

  return cards;
};

/**
 * Builds regression metric cards.
 * @param {Record<string, unknown>} metrics
 * @param {boolean} includeDegree
 * @returns {MetricCardConfig[]}
 */
const buildRegressionCards = (metrics, includeDegree = false) => {
  const r2 = asNumber(metrics.r2);
  const mse = asNumber(metrics.mse);
  const rmse = asNumber(metrics.rmse);
  const loss = asNumber(metrics.loss);
  const degree = asNumber(metrics.degree);

  /** @type {MetricCardConfig[]} */
  const cards = [
    {
      key: "r2",
      label: "R2 Score",
      value: r2,
      subtitle: "variance explained (1.0 = perfect)",
      barValue: r2 === null ? 0 : clamp01(r2),
      barColor: getBarColor("r2", r2),
      tooltip: "How much of target variance is explained by the model.",
      decimals: 3,
    },
    {
      key: "mse",
      label: "MSE",
      value: mse,
      subtitle: "mean squared error (lower = better)",
      barValue: mse === null ? 0 : clamp01(1 / (1 + Math.max(mse, 0))),
      barColor: getBarColor("mse", mse),
      tooltip: "Average squared prediction error.",
      decimals: 4,
    },
    {
      key: "rmse",
      label: "RMSE",
      value: rmse,
      subtitle: "root mean squared error (target units)",
      barValue: rmse === null ? 0 : clamp01(1 / (1 + Math.max(rmse, 0))),
      barColor: getBarColor("rmse", rmse),
      tooltip: "Square root of MSE in the same units as the target.",
      decimals: 4,
    },
    {
      key: "loss",
      label: "Current Loss",
      value: loss,
      subtitle: "gradient descent loss this step",
      barValue: loss === null ? 0 : clamp01(1 / (1 + Math.max(loss, 0))),
      barColor: getBarColor("loss", loss),
      tooltip: "Optimization objective value at this iteration.",
      decimals: 4,
    },
  ];

  if (includeDegree) {
    cards.push({
      key: "degree",
      label: "Degree",
      value: degree,
      subtitle: "current polynomial degree",
      barValue: degree === null ? 0 : clamp01(degree / 10),
      barColor: BAR_COLOR_CLASSES.sky,
      tooltip: "Polynomial feature degree used by the current model.",
      decimals: 0,
    });
  }

  return cards;
};

/**
 * Returns true for classification algorithms that require per-class metrics.
 * @param {string} algorithm
 * @returns {boolean}
 */
export const isClassifierAlgorithm = (algorithm) => {
  const normalized = normalizeAlgorithm(algorithm);
  return normalized === "decision-tree" || normalized === "knn" || normalized === "svm";
};

/**
 * Builds metric card data for the selected algorithm.
 * @param {string} algorithm
 * @param {Record<string, unknown>} metrics
 * @returns {MetricCardConfig[]}
 */
export const buildMetricCards = (algorithm, metrics) => {
  const normalized = normalizeAlgorithm(algorithm);

  if (normalized === "kmeans" || normalized === "k-means") {
    return buildKMeansCards(metrics);
  }

  if (normalized === "hierarchical" || normalized === "hierarchical-clustering") {
    return buildHierarchicalCards(metrics);
  }

  if (normalized === "knn") {
    return buildKNNCards(metrics);
  }

  if (normalized === "svm") {
    return buildSVMCards(metrics);
  }

  if (normalized === "linear-regression") {
    return buildRegressionCards(metrics, false);
  }

  if (normalized === "polynomial-regression") {
    return buildRegressionCards(metrics, true);
  }

  if (isClassifierAlgorithm(normalized)) {
    return buildClassifierCards(metrics);
  }

  return buildDBSCANCards(metrics);
};

export default buildMetricCards;