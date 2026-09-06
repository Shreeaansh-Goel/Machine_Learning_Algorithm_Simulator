export const VISUALIZER_ALGORITHM_OPTIONS = [
  { value: "", label: "Select algorithm" },
  { value: "dbscan", label: "DBSCAN" },
  { value: "k-means", label: "K-Means" },
  { value: "decision-tree", label: "Decision Tree" },
  { value: "knn", label: "KNN" },
  { value: "svm", label: "SVM" },
  { value: "linear-regression", label: "Linear Regression" },
  { value: "pca", label: "PCA" },
];

/**
 * Mobile-only algorithm selector shown when sidebar is hidden.
 * @param {{ value: string, onChange: (algorithm: string) => void }} props
 * @returns {JSX.Element}
 */
export const MobileAlgorithmSelector = ({ value, onChange }) => (
  <section className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm md:hidden">
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      Algorithm
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        {VISUALIZER_ALGORITHM_OPTIONS.map((option) => (
          <option key={option.value || "none"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  </section>
);

export default MobileAlgorithmSelector;
