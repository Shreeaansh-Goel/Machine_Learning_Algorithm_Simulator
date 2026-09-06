/**
 * Renders DBSCAN metrics from the active step.
 * @param {{ step: { metrics?: Record<string, unknown> } | null }} props
 * @returns {JSX.Element}
 */
export const DBSCANMetrics = ({ step }) => {
  const metrics = step?.metrics ?? {};
  const items = [
    {
      key: "clusters_found",
      label: "Clusters",
      value: metrics.clusters_found ?? "-",
    },
    {
      key: "points_processed",
      label: "Processed",
      value: metrics.points_processed ?? "-",
    },
    {
      key: "core_count",
      label: "Core",
      value: metrics.core_count ?? "-",
    },
    {
      key: "border_count",
      label: "Border",
      value: metrics.border_count ?? "-",
    },
    {
      key: "noise_count",
      label: "Noise",
      value: metrics.noise_count ?? "-",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

export default DBSCANMetrics;
