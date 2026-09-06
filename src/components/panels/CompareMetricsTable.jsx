import {
  buildComparisonRows,
  getAlgorithmLabel,
  resolveComparisonTone,
} from "../../utils/compareUtils";

const TONE_CLASS = {
  better: "bg-emerald-50 text-emerald-700",
  worse: "bg-rose-50 text-rose-700",
  neutral: "bg-white text-slate-700",
};

/**
 * Returns compare table cell classes based on better/worse status.
 * @param {"better" | "worse" | "neutral"} tone
 * @returns {string}
 */
const getCellClass = (tone) =>
  `rounded-md px-2 py-1 text-right text-sm font-medium ${TONE_CLASS[tone]}`;

/**
 * Final metrics comparison table for compare mode.
 * @param {{
 *  algorithmAName: string,
 *  algorithmBName: string,
 *  metricsA: Record<string, unknown>,
 *  metricsB: Record<string, unknown>,
 * }} props
 * @returns {JSX.Element}
 */
export const CompareMetricsTable = ({
  algorithmAName,
  algorithmBName,
  metricsA,
  metricsB,
}) => {
  const rows = buildComparisonRows(metricsA, metricsB);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Final Comparison</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-2">Metric</th>
              <th className="px-2 text-right">{getAlgorithmLabel(algorithmAName)}</th>
              <th className="px-2 text-right">{getAlgorithmLabel(algorithmBName)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const toneA = resolveComparisonTone(
                row.scoreA,
                row.scoreB,
                row.direction,
                "a"
              );
              const toneB = resolveComparisonTone(
                row.scoreA,
                row.scoreB,
                row.direction,
                "b"
              );

              return (
                <tr key={row.key}>
                  <td className="px-2 text-sm font-medium text-slate-700">{row.label}</td>
                  <td className="px-2">
                    <div className={getCellClass(toneA)}>{row.valueA}</div>
                  </td>
                  <td className="px-2">
                    <div className={getCellClass(toneB)}>{row.valueB}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CompareMetricsTable;
