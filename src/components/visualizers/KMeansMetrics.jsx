/**
 * Renders key metrics from the currently active K-Means step.
 * @param {{ step: { metrics?: Record<string, unknown> } | null }} props
 * @returns {JSX.Element}
 */
export const KMeansMetrics = ({ step }) => {
  const metrics = step?.metrics ?? {};
  const items = [
    {
      key: "k",
      label: "K",
      value: metrics.k ?? "-",
    },
    {
      key: "iteration",
      label: "Iteration",
      value: metrics.iteration ?? "-",
    },
    {
      key: "inertia",
      label: "Inertia",
      value:
        typeof metrics.inertia === "number"
          ? metrics.inertia.toFixed(4)
          : "-",
    },
    {
      key: "silhouette_score",
      label: "Silhouette",
      value:
        typeof metrics.silhouette_score === "number"
          ? metrics.silhouette_score.toFixed(4)
          : "-",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {item.label}
          </p>
          <p className="text-lg font-semibold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

export default KMeansMetrics;
