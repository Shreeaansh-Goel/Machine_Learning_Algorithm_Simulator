/**
 * Converts unknown value to finite number when possible.
 * @param {unknown} value
 * @returns {number | null}
 */
const asNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * Returns score cell class by quality threshold.
 * @param {number | null} value
 * @returns {string}
 */
const getScoreClass = (value) => {
  if (value === null) {
    return "bg-slate-50 text-slate-500";
  }
  if (value > 0.8) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (value >= 0.5) {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-rose-50 text-rose-700";
};

/**
 * Formats score value for table cells.
 * @param {number | null} value
 * @returns {string}
 */
const formatScore = (value) => (value === null ? "-" : value.toFixed(3));

/**
 * Converts classification report dict to table rows.
 * @param {Record<string, unknown>} report
 * @returns {Array<{className: string, precision: number | null, recall: number | null, f1: number | null, support: number | null}>}
 */
const extractRows = (report) => {
  return Object.entries(report)
    .filter(([label, value]) => {
      if (label === "accuracy" || label === "macro avg" || label === "weighted avg") {
        return false;
      }
      if (typeof value !== "object" || value === null) {
        return false;
      }
      const row = /** @type {Record<string, unknown>} */ (value);
      return (
        typeof row.precision !== "undefined" &&
        typeof row.recall !== "undefined" &&
        typeof row["f1-score"] !== "undefined"
      );
    })
    .map(([className, value]) => {
      const row = /** @type {Record<string, unknown>} */ (value);
      return {
        className,
        precision: asNumber(row.precision),
        recall: asNumber(row.recall),
        f1: asNumber(row["f1-score"]),
        support: asNumber(row.support),
      };
    });
};

/**
 * Shows per-class precision, recall, F1, and support from classifier metrics.
 * @param {{ report: Record<string, unknown> }} props
 * @returns {JSX.Element | null}
 */
export const PerClassTable = ({ report }) => {
  const rows = extractRows(report);
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Per-Class Breakdown
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Class</th>
              <th
                className="px-3 py-2 text-right font-medium"
                title="Precision: Of all predictions for this class, how many were correct?"
              >
                Precision
              </th>
              <th
                className="px-3 py-2 text-right font-medium"
                title="Recall: Of all true samples in this class, how many were found?"
              >
                Recall
              </th>
              <th
                className="px-3 py-2 text-right font-medium"
                title="F1 Score: Harmonic mean balancing precision and recall."
              >
                F1 Score
              </th>
              <th
                className="px-3 py-2 text-right font-medium"
                title="Support: Number of samples belonging to this class."
              >
                Support
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.className} className="border-t border-slate-100 text-slate-700">
                <td className="px-3 py-2 text-left font-medium">{row.className}</td>
                <td className={`px-3 py-2 text-right ${getScoreClass(row.precision)}`}>
                  {formatScore(row.precision)}
                </td>
                <td className={`px-3 py-2 text-right ${getScoreClass(row.recall)}`}>
                  {formatScore(row.recall)}
                </td>
                <td className={`px-3 py-2 text-right ${getScoreClass(row.f1)}`}>
                  {formatScore(row.f1)}
                </td>
                <td className="px-3 py-2 text-right text-slate-600">
                  {row.support === null ? "-" : Math.round(row.support)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PerClassTable;