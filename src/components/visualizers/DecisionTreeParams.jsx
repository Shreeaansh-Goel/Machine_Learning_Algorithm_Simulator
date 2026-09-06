/**
 * Controls for tuning Decision Tree hyperparameters.
 * @param {{
 *  params: { max_depth: number, criterion: "gini" | "entropy", min_samples_split: number },
 *  onChange: (params: { max_depth: number, criterion: "gini" | "entropy", min_samples_split: number }) => void,
 * }} props
 * @returns {JSX.Element}
 */
export const DecisionTreeParams = ({ params, onChange }) => {
  /**
   * Updates one Decision Tree parameter while preserving all others.
   * @param {"max_depth" | "criterion" | "min_samples_split"} key
   * @param {number | "gini" | "entropy"} value
   */
  const updateParam = (key, value) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-3">
      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Max Depth</span>
        <input
          type="range"
          min={2}
          max={10}
          step={1}
          value={params.max_depth}
          onChange={(event) => updateParam("max_depth", Number(event.target.value))}
          className="w-full"
        />
        <span className="block text-xs text-slate-500">{params.max_depth}</span>
      </label>

      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Criterion</span>
        <select
          value={params.criterion}
          onChange={(event) =>
            updateParam("criterion", /** @type {"gini" | "entropy"} */ (event.target.value))
          }
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
        >
          <option value="gini">Gini</option>
          <option value="entropy">Entropy</option>
        </select>
      </label>

      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-medium">Min Samples Split</span>
        <input
          type="range"
          min={2}
          max={20}
          step={1}
          value={params.min_samples_split}
          onChange={(event) =>
            updateParam("min_samples_split", Number(event.target.value))
          }
          className="w-full"
        />
        <span className="block text-xs text-slate-500">{params.min_samples_split}</span>
      </label>
    </div>
  );
};

export default DecisionTreeParams;
