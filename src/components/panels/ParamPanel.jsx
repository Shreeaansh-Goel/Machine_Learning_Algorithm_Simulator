const PANEL_CLASS = "grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-3";

/**
 * Controls for tuning K-Means hyperparameters.
 * @param {{
 *  params: { k: number, max_iter: number, init: "random" | "kmeans++" },
 *  onChange: (params: { k: number, max_iter: number, init: "random" | "kmeans++" }) => void,
 * }} props
 * @returns {JSX.Element}
 */
const KMeansParamControls = ({ params, onChange }) => {
  const updateParam = (key, value) => onChange({ ...params, [key]: value });

  return (
    <div className={PANEL_CLASS}>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Clusters (k)</span>
        <input type="range" min={2} max={10} step={1} value={params.k} onChange={(event) => updateParam("k", Number(event.target.value))} className="w-full" />
        <span className="block text-xs text-slate-500">{params.k}</span>
      </label>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Max Iterations</span>
        <input type="range" min={10} max={200} step={10} value={params.max_iter} onChange={(event) => updateParam("max_iter", Number(event.target.value))} className="w-full" />
        <span className="block text-xs text-slate-500">{params.max_iter}</span>
      </label>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Initialization</span>
        <select value={params.init} onChange={(event) => updateParam("init", /** @type {"random" | "kmeans++"} */ (event.target.value))} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5">
          <option value="kmeans++">k-means++</option>
          <option value="random">random</option>
        </select>
      </label>
    </div>
  );
};

/**
 * Controls for tuning DBSCAN hyperparameters.
 * @param {{
 *  params: { eps: number, min_samples: number, metric: "euclidean" | "manhattan" },
 *  onChange: (params: { eps: number, min_samples: number, metric: "euclidean" | "manhattan" }) => void,
 * }} props
 * @returns {JSX.Element}
 */
const DBSCANParamControls = ({ params, onChange }) => {
  const updateParam = (key, value) => onChange({ ...params, [key]: value });

  return (
    <div className={PANEL_CLASS}>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Epsilon</span>
        <input type="range" min={0.1} max={2.0} step={0.05} value={params.eps} onChange={(event) => updateParam("eps", Number(event.target.value))} className="w-full" />
        <span className="block text-xs text-slate-500">{params.eps.toFixed(2)}</span>
      </label>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Min Samples</span>
        <input type="range" min={2} max={20} step={1} value={params.min_samples} onChange={(event) => updateParam("min_samples", Number(event.target.value))} className="w-full" />
        <span className="block text-xs text-slate-500">{params.min_samples}</span>
      </label>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Metric</span>
        <select value={params.metric} onChange={(event) => updateParam("metric", /** @type {"euclidean" | "manhattan"} */ (event.target.value))} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5">
          <option value="euclidean">Euclidean</option>
          <option value="manhattan">Manhattan</option>
        </select>
      </label>
    </div>
  );
};

/**
 * Controls for tuning KNN query parameters.
 * @param {{
 *  params: { k: number, metric: "euclidean" | "manhattan" },
 *  onChange: (params: { k: number, metric: "euclidean" | "manhattan" }) => void,
 * }} props
 * @returns {JSX.Element}
 */
const KNNParamControls = ({ params, onChange }) => {
  const updateParam = (key, value) => onChange({ ...params, [key]: value });

  return (
    <div className={PANEL_CLASS}>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Neighbors (k)</span>
        <input type="range" min={1} max={20} step={1} value={params.k} onChange={(event) => updateParam("k", Number(event.target.value))} className="w-full" />
        <span className="block text-xs text-slate-500">{params.k}</span>
      </label>
      <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
        <span className="font-medium">Metric</span>
        <select value={params.metric} onChange={(event) => updateParam("metric", /** @type {"euclidean" | "manhattan"} */ (event.target.value))} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5">
          <option value="euclidean">Euclidean</option>
          <option value="manhattan">Manhattan</option>
        </select>
      </label>
    </div>
  );
};

/**
 * Controls for tuning linear regression training parameters.
 * @param {{
 *  params: { learning_rate: number, iterations: number },
 *  onChange: (params: { learning_rate: number, iterations: number }) => void,
 * }} props
 * @returns {JSX.Element}
 */
const LinearRegressionParamControls = ({ params, onChange }) => {
  const updateParam = (key, value) => onChange({ ...params, [key]: value });

  return (
    <div className={PANEL_CLASS}>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Learning Rate</span>
        <select value={String(params.learning_rate)} onChange={(event) => updateParam("learning_rate", Number(event.target.value))} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5">
          <option value="0.001">0.001</option>
          <option value="0.01">0.01</option>
          <option value="0.1">0.1</option>
          <option value="0.5">0.5</option>
        </select>
      </label>
      <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
        <span className="font-medium">Iterations</span>
        <input type="range" min={100} max={2000} step={50} value={params.iterations} onChange={(event) => updateParam("iterations", Number(event.target.value))} className="w-full" />
        <span className="block text-xs text-slate-500">{params.iterations}</span>
      </label>
    </div>
  );
};

/**
 * Controls for tuning SVM hyperparameters.
 * @param {{
 *  params: { kernel: "linear" | "rbf", C: number },
 *  onChange: (params: { kernel: "linear" | "rbf", C: number }) => void,
 * }} props
 * @returns {JSX.Element}
 */
const SVMParamControls = ({ params, onChange }) => {
  const updateParam = (key, value) => onChange({ ...params, [key]: value });

  return (
    <div className={PANEL_CLASS}>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Kernel</span>
        <select value={params.kernel} onChange={(event) => updateParam("kernel", /** @type {"linear" | "rbf"} */ (event.target.value))} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5">
          <option value="linear">Linear</option>
          <option value="rbf">RBF</option>
        </select>
      </label>
      <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
        <span className="font-medium">C (Regularization)</span>
        <input type="range" min={0.1} max={10} step={0.1} value={params.C} onChange={(event) => updateParam("C", Number(event.target.value))} className="w-full" />
        <span className="block text-xs text-slate-500">{params.C.toFixed(1)}</span>
      </label>
    </div>
  );
};

/**
 * Controls for PCA projection parameters.
 * @param {{
 *  params: { n_components: number },
 *  onChange: (params: { n_components: number }) => void,
 * }} props
 * @returns {JSX.Element}
 */
const PCAParamControls = ({ params, onChange }) => {
  return (
    <div className={PANEL_CLASS}>
      <label className="space-y-1 text-sm text-slate-700 md:col-span-3">
        <span className="font-medium">Components</span>
        <select
          value={String(params.n_components)}
          onChange={(event) => onChange({ ...params, n_components: Number(event.target.value) })}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
        >
          <option value="2">2 (PC1, PC2)</option>
        </select>
      </label>
    </div>
  );
};

/**
 * Shared algorithm parameter panel for visualizers.
 * @param {{
 *  algorithm: "kmeans" | "dbscan" | "knn" | "linear-regression" | "svm" | "pca",
 *  params: Record<string, unknown>,
 *  onChange: (params: Record<string, unknown>) => void,
 * }} props
 * @returns {JSX.Element}
 */
export const ParamPanel = ({ algorithm, params, onChange }) => {
  if (algorithm === "dbscan") {
    return (
      <DBSCANParamControls
        params={/** @type {{ eps: number, min_samples: number, metric: "euclidean" | "manhattan" }} */ (params)}
        onChange={/** @type {(params: { eps: number, min_samples: number, metric: "euclidean" | "manhattan" }) => void} */ (onChange)}
      />
    );
  }

  if (algorithm === "knn") {
    return (
      <KNNParamControls
        params={/** @type {{ k: number, metric: "euclidean" | "manhattan" }} */ (params)}
        onChange={/** @type {(params: { k: number, metric: "euclidean" | "manhattan" }) => void} */ (onChange)}
      />
    );
  }

  if (algorithm === "linear-regression") {
    return (
      <LinearRegressionParamControls
        params={/** @type {{ learning_rate: number, iterations: number }} */ (params)}
        onChange={/** @type {(params: { learning_rate: number, iterations: number }) => void} */ (onChange)}
      />
    );
  }

  if (algorithm === "svm") {
    return (
      <SVMParamControls
        params={/** @type {{ kernel: "linear" | "rbf", C: number }} */ (params)}
        onChange={/** @type {(params: { kernel: "linear" | "rbf", C: number }) => void} */ (onChange)}
      />
    );
  }

  if (algorithm === "pca") {
    return (
      <PCAParamControls
        params={/** @type {{ n_components: number }} */ (params)}
        onChange={/** @type {(params: { n_components: number }) => void} */ (onChange)}
      />
    );
  }

  return (
    <KMeansParamControls
      params={/** @type {{ k: number, max_iter: number, init: "random" | "kmeans++" }} */ (params)}
      onChange={/** @type {(params: { k: number, max_iter: number, init: "random" | "kmeans++" }) => void} */ (onChange)}
    />
  );
};

export default ParamPanel;