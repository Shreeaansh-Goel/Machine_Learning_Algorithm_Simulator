/**
 * Displays explained variance ratios for PCA components.
 * @param {{
 *  ratios: number[],
 * }} props
 * @returns {JSX.Element}
 */
export const PCAExplainedVariance = ({ ratios }) => {
  const first = Number(ratios?.[0] ?? 0);
  const second = Number(ratios?.[1] ?? 0);

  return (
    <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-sm font-semibold text-slate-900">Explained Variance</p>
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>PC1</span>
            <span>{(first * 100).toFixed(1)}%</span>
          </div>
          <progress
            className="mt-1 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-indigo-500"
            value={Math.max(0, Math.min(first, 1))}
            max={1}
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>PC2</span>
            <span>{(second * 100).toFixed(1)}%</span>
          </div>
          <progress
            className="mt-1 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-sky-500"
            value={Math.max(0, Math.min(second, 1))}
            max={1}
          />
        </div>
      </div>
    </section>
  );
};

export default PCAExplainedVariance;
