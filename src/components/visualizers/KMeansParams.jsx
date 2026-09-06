/**
 * Controls for tuning K-Means hyperparameters.
 * @param {{
 *  params: { k: number, max_iter: number, init: "random" | "kmeans++" },
 *  onChange: (params: { k: number, max_iter: number, init: "random" | "kmeans++" }) => void,
 * }} props
 * @returns {JSX.Element}
 */
export const KMeansParams = ({ params, onChange }) => {
  /**
   * Updates a single field while preserving the rest of params.
   * @param {"k" | "max_iter" | "init"} key
   * @param {number | "random" | "kmeans++"} value
   */
  const updateParam = (key, value) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-3">
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Clusters (k)</span>
        <input
          type="range"
          min={2}
          max={8}
          value={params.k}
          onChange={(event) => updateParam("k", Number(event.target.value))}
          className="w-full"
        />
        <span className="block text-xs text-slate-500">{params.k}</span>
      </label>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Max Iterations</span>
        <input
          type="range"
          min={10}
          max={200}
          step={10}
          value={params.max_iter}
          onChange={(event) =>
            updateParam("max_iter", Number(event.target.value))
          }
          className="w-full"
        />
        <span className="block text-xs text-slate-500">{params.max_iter}</span>
      </label>
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Initialization</span>
        <select
          value={params.init}
          onChange={(event) =>
            updateParam(
              "init",
              /** @type {"random" | "kmeans++"} */ (event.target.value)
            )
          }
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
        >
          <option value="kmeans++">kmeans++</option>
          <option value="random">random</option>
        </select>
      </label>
    </div>
  );
};

export default KMeansParams;
