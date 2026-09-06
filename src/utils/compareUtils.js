import {
  getDBSCANColor,
  getDBSCANStrokeColor,
  getDBSCANStrokeWidth,
  getKMeansColor,
  getPointColor,
} from "./colorUtils";

/**
 * @typedef {{ value: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression", label: string, endpoint: string }} CompareAlgorithmOption
 */

/** @type {CompareAlgorithmOption[]} */
export const COMPARE_ALGORITHM_OPTIONS = [
  { value: "kmeans", label: "K-Means", endpoint: "kmeans" },
  { value: "dbscan", label: "DBSCAN", endpoint: "dbscan" },
  {
    value: "decision-tree",
    label: "Decision Tree",
    endpoint: "decision-tree",
  },
  { value: "knn", label: "KNN", endpoint: "knn" },
  {
    value: "linear-regression",
    label: "Linear Regression",
    endpoint: "linear-regression",
  },
];

const DEFAULT_PARAMS = {
  kmeans: { k: 3, max_iter: 50, init: "kmeans++" },
  dbscan: { eps: 0.25, min_samples: 8, metric: "euclidean" },
  "decision-tree": { max_depth: 5, criterion: "gini", min_samples_split: 2 },
  knn: { k: 5, metric: "euclidean" },
  "linear-regression": { learning_rate: 0.01, iterations: 600 },
};

/**
 * Safely converts unknown values to numbers.
 * @param {unknown} value
 * @returns {number | null}
 */
const asNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * Returns the configuration record for one algorithm option.
 * @param {string} algorithmName
 * @returns {CompareAlgorithmOption | undefined}
 */
export const getAlgorithmOption = (algorithmName) =>
  COMPARE_ALGORITHM_OPTIONS.find((option) => option.value === algorithmName);

/**
 * Returns display label for one compare algorithm.
 * @param {string} algorithmName
 * @returns {string}
 */
export const getAlgorithmLabel = (algorithmName) =>
  getAlgorithmOption(algorithmName)?.label || "Algorithm";

/**
 * Returns API endpoint slug for one compare algorithm.
 * @param {string} algorithmName
 * @returns {string}
 */
export const getAlgorithmEndpoint = (algorithmName) =>
  getAlgorithmOption(algorithmName)?.endpoint || "kmeans";

/**
 * Returns default params for the selected algorithm.
 * @param {string} algorithmName
 * @returns {Record<string, unknown>}
 */
export const getDefaultAlgorithmParams = (algorithmName) => {
  const params = DEFAULT_PARAMS[/** @type {keyof typeof DEFAULT_PARAMS} */ (algorithmName)] || DEFAULT_PARAMS.kmeans;
  return JSON.parse(JSON.stringify(params));
};

/**
 * Converts synced progress to a concrete step index.
 * @param {number} totalSteps
 * @param {number} progress
 * @returns {number}
 */
export const getStepIndexFromProgress = (totalSteps, progress) => {
  if (!Number.isFinite(totalSteps) || totalSteps <= 1) {
    return 0;
  }
  const clamped = Math.max(0, Math.min(1, Number(progress) || 0));
  return Math.min(totalSteps - 1, Math.round(clamped * (totalSteps - 1)));
};

/**
 * Computes one progress tick size based on max available steps.
 * @param {number} totalSteps
 * @returns {number}
 */
export const getProgressStepSize = (totalSteps) =>
  totalSteps > 1 ? 1 / (totalSteps - 1) : 1;

/**
 * Resolves the active step object for a synced progress value.
 * @param {Array<Record<string, unknown>>} steps
 * @param {number} progress
 * @returns {Record<string, unknown> | null}
 */
export const getStepAtProgress = (steps, progress) => {
  if (!Array.isArray(steps) || steps.length === 0) {
    return null;
  }
  const index = getStepIndexFromProgress(steps.length, progress);
  return steps[index] ?? null;
};

/**
 * Builds extra request payload fields for algorithms that need them.
 * @param {string} algorithmName
 * @param {Array<Record<string, unknown>>} points
 * @returns {Record<string, unknown>}
 */
export const buildAlgorithmExtraPayload = (algorithmName, points) => {
  if (algorithmName !== "knn" || points.length === 0) {
    return {};
  }

  const numericPoints = points.filter(
    (point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y))
  );
  if (numericPoints.length === 0) {
    return {};
  }

  const meanX =
    numericPoints.reduce((sum, point) => sum + Number(point.x), 0) /
    numericPoints.length;
  const meanY =
    numericPoints.reduce((sum, point) => sum + Number(point.y), 0) /
    numericPoints.length;

  return {
    query_point: {
      x: Number(meanX.toFixed(4)),
      y: Number(meanY.toFixed(4)),
    },
  };
};

/**
 * Selects a point fill color function for compare scatter panes.
 * @param {string} algorithmName
 * @returns {(point: Record<string, unknown>) => string}
 */
export const getCompareColorFn = (algorithmName) => {
  if (algorithmName === "kmeans") {
    return getKMeansColor;
  }
  if (algorithmName === "dbscan") {
    return getDBSCANColor;
  }
  if (algorithmName === "decision-tree") {
    return getPointColor;
  }
  if (algorithmName === "knn") {
    return (point) => {
      if (point?.state === "query") {
        return "#0F172A";
      }
      if (point?.state === "neighbor") {
        return "#0284C7";
      }
      return getPointColor(point);
    };
  }
  return () => "#64748B";
};

/**
 * Selects point stroke color function for compare scatter panes.
 * @param {string} algorithmName
 * @returns {(point: Record<string, unknown>) => string | undefined}
 */
export const getCompareStrokeFn = (algorithmName) =>
  algorithmName === "dbscan" ? getDBSCANStrokeColor : () => "none";

/**
 * Selects point stroke width function for compare scatter panes.
 * @param {string} algorithmName
 * @returns {(point: Record<string, unknown>) => number | undefined}
 */
export const getCompareStrokeWidthFn = (algorithmName) =>
  algorithmName === "dbscan" ? getDBSCANStrokeWidth : () => 0;

/**
 * Builds DBSCAN epsilon overlay data for compare scatter pane.
 * @param {Record<string, unknown> | null} currentStep
 * @param {Record<string, unknown>} params
 * @returns {{
 *  showNeighborhoodOverlay: boolean,
 *  neighborhoodOverlay: {
 *    center: { x: number, y: number },
 *    eps: number,
 *    metric: "euclidean" | "manhattan",
 *  } | null,
 * }}
 */
export const getCompareNeighborhoodOverlay = (currentStep, params) => {
  const stepType = String(currentStep?.step_type || "");
  const showNeighborhoodOverlay =
    stepType === "check_point" || stepType === "count_neighbors";

  if (!showNeighborhoodOverlay || !Array.isArray(currentStep?.points)) {
    return { showNeighborhoodOverlay, neighborhoodOverlay: null };
  }

  const centerPoint = currentStep.points.find((point) => point?.state === "current");
  if (!centerPoint) {
    return { showNeighborhoodOverlay, neighborhoodOverlay: null };
  }

  return {
    showNeighborhoodOverlay,
    neighborhoodOverlay: {
      center: {
        x: Number(centerPoint.x),
        y: Number(centerPoint.y),
      },
      eps: Number(params.eps ?? 0.25),
      metric: params.metric === "manhattan" ? "manhattan" : "euclidean",
    },
  };
};

/**
 * Builds rows for the final compare metrics table.
 * @param {Record<string, unknown>} metricsA
 * @param {Record<string, unknown>} metricsB
 * @returns {Array<{
 *  key: string,
 *  label: string,
 *  valueA: string,
 *  valueB: string,
 *  scoreA: number | null,
 *  scoreB: number | null,
 *  direction: "higher" | "lower" | "none",
 * }>}
 */
export const buildComparisonRows = (metricsA, metricsB) => {
  const accuracyA = asNumber(metricsA.accuracy);
  const accuracyB = asNumber(metricsB.accuracy);
  const clusterA = asNumber(metricsA.clusters_found);
  const clusterB = asNumber(metricsB.clusters_found);
  const silhouetteA = asNumber(metricsA.silhouette_score);
  const silhouetteB = asNumber(metricsB.silhouette_score);
  const noiseA = asNumber(metricsA.noise_count);
  const noiseB = asNumber(metricsB.noise_count);

  const metricAValue =
    accuracyA !== null ? `${accuracyA.toFixed(1)}%` : clusterA !== null ? `${Math.round(clusterA)}` : "-";
  const metricBValue =
    accuracyB !== null ? `${accuracyB.toFixed(1)}%` : clusterB !== null ? `${Math.round(clusterB)}` : "-";

  return [
    {
      key: "clusters_accuracy",
      label: "Clusters/Accuracy",
      valueA: metricAValue,
      valueB: metricBValue,
      scoreA: accuracyA ?? silhouetteA,
      scoreB: accuracyB ?? silhouetteB,
      direction: "higher",
    },
    {
      key: "silhouette",
      label: "Silhouette Score",
      valueA: silhouetteA === null ? "-" : silhouetteA.toFixed(3),
      valueB: silhouetteB === null ? "-" : silhouetteB.toFixed(3),
      scoreA: silhouetteA,
      scoreB: silhouetteB,
      direction: "higher",
    },
    {
      key: "noise_points",
      label: "Noise points",
      valueA: noiseA === null ? "-" : `${Math.round(noiseA)}`,
      valueB: noiseB === null ? "-" : `${Math.round(noiseB)}`,
      scoreA: noiseA,
      scoreB: noiseB,
      direction: "lower",
    },
  ];
};

/**
 * Resolves whether a value is better, worse, or neutral within one row.
 * @param {number | null} scoreA
 * @param {number | null} scoreB
 * @param {"higher" | "lower" | "none"} direction
 * @param {"a" | "b"} side
 * @returns {"better" | "worse" | "neutral"}
 */
export const resolveComparisonTone = (scoreA, scoreB, direction, side) => {
  if (direction === "none" || scoreA === null || scoreB === null || scoreA === scoreB) {
    return "neutral";
  }

  const aBetter = direction === "higher" ? scoreA > scoreB : scoreA < scoreB;
  if (side === "a") {
    return aBetter ? "better" : "worse";
  }
  return aBetter ? "worse" : "better";
};
