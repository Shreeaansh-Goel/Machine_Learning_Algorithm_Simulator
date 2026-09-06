import { COMPARE_ALGORITHM_OPTIONS } from "../../utils/compareUtils";

/**
 * Compare-mode algorithm dropdown.
 * @param {{
 *  value: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression",
 *  onChange: (value: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression") => void,
 * }} props
 * @returns {JSX.Element}
 */
export const CompareAlgorithmSelector = ({ value, onChange }) => (
  <label className="space-y-1 text-sm text-slate-700">
    <span className="font-medium">Algorithm</span>
    <select
      value={value}
      onChange={(event) =>
        onChange(
          /** @type {"kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression"} */ (event.target.value)
        )
      }
      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
    >
      {COMPARE_ALGORITHM_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export default CompareAlgorithmSelector;
