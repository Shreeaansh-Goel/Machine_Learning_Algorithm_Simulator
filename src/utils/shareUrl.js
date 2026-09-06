/**
 * Maps route algorithm slug to compact share-url slug.
 * @param {string | null | undefined} algorithm
 * @returns {string}
 */
export const toShareAlgorithmSlug = (algorithm) => {
  const normalized = String(algorithm || "").trim().toLowerCase();
  if (normalized === "k-means") {
    return "kmeans";
  }
  return normalized;
};

/**
 * Maps compact share-url slug to route algorithm slug.
 * @param {string | null | undefined} algorithm
 * @returns {string}
 */
export const fromShareAlgorithmSlug = (algorithm) => {
  const normalized = String(algorithm || "").trim().toLowerCase();
  if (normalized === "kmeans") {
    return "k-means";
  }
  return normalized;
};

/**
 * Normalizes dataset name into url-safe slug.
 * @param {string | null | undefined} datasetName
 * @returns {string}
 */
export const normalizeDatasetSlug = (datasetName) =>
  String(datasetName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Converts params object to plain query-string-safe entries.
 * @param {Record<string, unknown> | null | undefined} params
 * @returns {[string, string][]}
 */
const getShareParamEntries = (params) => {
  const safeParams = params || {};
  return Object.entries(safeParams)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .map(([key, value]) => [key, String(value)]);
};

/**
 * Builds a share query string from visualizer state.
 * @param {{
 *  algorithm: string,
 *  datasetName: string,
 *  params: Record<string, unknown>,
 *  step: number,
 * }} input
 * @returns {string}
 */
export const buildShareSearch = ({ algorithm, datasetName, params, step }) => {
  const search = new URLSearchParams();
  const algorithmSlug = toShareAlgorithmSlug(algorithm);
  if (algorithmSlug) {
    search.set("algo", algorithmSlug);
  }

  const datasetSlug = normalizeDatasetSlug(datasetName);
  if (datasetSlug) {
    search.set("dataset", datasetSlug);
  }

  search.set("step", String(Math.max(0, Number(step) || 0)));
  getShareParamEntries(params).forEach(([key, value]) => {
    search.set(key, value);
  });

  return `?${search.toString()}`;
};

/**
 * Safely reads numeric query param.
 * @param {URLSearchParams} search
 * @param {string} key
 * @param {number} fallback
 * @returns {number}
 */
const readNumberParam = (search, key, fallback) => {
  const value = Number(search.get(key));
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return value;
};

/**
 * Parses algorithm params from URL search into typed defaults.
 * @param {string} algorithm
 * @param {Record<string, unknown>} defaults
 * @param {URLSearchParams} search
 * @returns {Record<string, unknown>}
 */
export const parseAlgorithmParamsFromSearch = (algorithm, defaults, search) => {
  const next = { ...defaults };
  const normalizedAlgorithm = String(algorithm || "").toLowerCase();

  if (normalizedAlgorithm === "k-means") {
    next.k = Math.max(2, Math.round(readNumberParam(search, "k", Number(next.k))));
    next.max_iter = Math.max(
      10,
      Math.round(readNumberParam(search, "max_iter", Number(next.max_iter)))
    );
    const init = String(search.get("init") || next.init || "kmeans++").toLowerCase();
    next.init = init === "random" ? "random" : "kmeans++";
    return next;
  }

  if (normalizedAlgorithm === "dbscan") {
    next.eps = Math.max(0.05, readNumberParam(search, "eps", Number(next.eps)));
    next.min_samples = Math.max(
      2,
      Math.round(readNumberParam(search, "min_samples", Number(next.min_samples)))
    );
    const metric = String(search.get("metric") || next.metric || "euclidean").toLowerCase();
    next.metric = metric === "manhattan" ? "manhattan" : "euclidean";
    return next;
  }

  if (normalizedAlgorithm === "knn") {
    next.k = Math.max(1, Math.round(readNumberParam(search, "k", Number(next.k))));
    const metric = String(search.get("metric") || next.metric || "euclidean").toLowerCase();
    next.metric = metric === "manhattan" ? "manhattan" : "euclidean";
    return next;
  }

  if (normalizedAlgorithm === "linear-regression") {
    next.learning_rate = Math.max(
      0.0001,
      readNumberParam(search, "learning_rate", Number(next.learning_rate))
    );
    next.iterations = Math.max(
      50,
      Math.round(readNumberParam(search, "iterations", Number(next.iterations)))
    );
    return next;
  }

  if (normalizedAlgorithm === "pca") {
    next.n_components = Math.max(
      2,
      Math.round(readNumberParam(search, "n_components", Number(next.n_components)))
    );
    return next;
  }

  if (normalizedAlgorithm === "svm") {
    const kernel = String(search.get("kernel") || next.kernel || "linear").toLowerCase();
    next.kernel = kernel === "rbf" ? "rbf" : "linear";
    next.C = Math.max(0.01, readNumberParam(search, "C", Number(next.C)));
    return next;
  }

  if (normalizedAlgorithm === "decision-tree") {
    next.max_depth = Math.max(
      1,
      Math.round(readNumberParam(search, "max_depth", Number(next.max_depth)))
    );
    const criterion = String(search.get("criterion") || next.criterion || "gini").toLowerCase();
    next.criterion = criterion === "entropy" ? "entropy" : "gini";
    next.min_samples_split = Math.max(
      2,
      Math.round(
        readNumberParam(search, "min_samples_split", Number(next.min_samples_split))
      )
    );
    return next;
  }

  return next;
};

/**
 * Reads step index from URL query.
 * @param {URLSearchParams} search
 * @returns {number | null}
 */
export const parseStepIndexFromSearch = (search) => {
  const value = Number(search.get("step"));
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.floor(value);
};

export default {
  buildShareSearch,
  fromShareAlgorithmSlug,
  normalizeDatasetSlug,
  parseAlgorithmParamsFromSearch,
  parseStepIndexFromSearch,
  toShareAlgorithmSlug,
};
