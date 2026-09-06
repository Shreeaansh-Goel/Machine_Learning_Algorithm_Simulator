/**
 * Reads neighbor count from step metrics, falling back to highlighted neighbor points.
 * @param {{ metrics?: Record<string, unknown>, points?: Array<Record<string, unknown>> } | null | undefined} step
 * @returns {number | null}
 */
const getNeighborCount = (step) => {
  const metricValue = step?.metrics?.neighbor_count;
  if (typeof metricValue === "number" && Number.isFinite(metricValue)) {
    return metricValue;
  }

  const points = step?.points ?? [];
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }

  const neighbors = points.filter((point) => point.state === "neighbor").length;
  const includeCurrent = points.some((point) => point.state === "current") ? 1 : 0;
  return neighbors + includeCurrent;
};

/**
 * Returns a plain-text formula for the current algorithm step.
 * @param {{ step_type?: string, metrics?: Record<string, unknown>, points?: Array<Record<string, unknown>> } | null | undefined} step
 * @param {string | null | undefined} algorithm
 * @returns {string | null}
 */
export const getStepFormula = (step, algorithm) => {
  const stepType = step?.step_type;

  if (stepType === "count_neighbors") {
    const neighborCount = getNeighborCount(step);
    const countValue = neighborCount === null ? "?" : String(neighborCount);
    return `N(p) = { q in D | dist(p,q) <= eps }  ->  |N(p)| = ${countValue}`;
  }

  const isKMeans = algorithm === "kmeans" || algorithm === "k-means";
  if (isKMeans && stepType === "assign") {
    return "cluster(x) = argmin_k || x - mu_k ||^2";
  }
  if (isKMeans && stepType === "update") {
    return "mu_k = (1/|C_k|) x sum(x_i), for x_i in C_k";
  }

  if (stepType === "compute_distances") {
    return "dist(x_q, x_i) = sqrt(sum_j (x_qj - x_ij)^2)";
  }

  if (stepType === "select_k") {
    return "N_k(x_q) = k nearest samples by sorted distance";
  }

  if (stepType === "predict") {
    return "y_hat = mode({ y_i | x_i in N_k(x_q) })";
  }

  if (stepType === "gradient_step") {
    return "w := w - alpha * dL/dw,  b := b - alpha * dL/db";
  }

  if (stepType === "converged" && algorithm === "linear-regression") {
    return "y_hat = wx + b";
  }

  if (stepType === "compute_covariance") {
    return "Sigma = (1/(n-1)) * X_centered^T * X_centered";
  }

  if (stepType === "compute_eigenvectors") {
    return "Sigma * v_i = lambda_i * v_i";
  }

  if (stepType === "project") {
    return "Z = X_centered * W_k";
  }

  if (stepType === "fit" && algorithm === "svm") {
    return "min (1/2)||w||^2 + C * sum_i xi_i";
  }

  if (stepType === "show_margin" && algorithm === "svm") {
    return "margin = 2 / ||w||";
  }

  return null;
};

export default getStepFormula;