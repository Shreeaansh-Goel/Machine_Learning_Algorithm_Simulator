/**
 * Renders key Decision Tree metrics from the active step.
 * @param {{ step: { metrics?: Record<string, unknown> } | null }} props
 * @returns {JSX.Element}
 */
export const DecisionTreeMetrics = ({ step }) => {
  const metrics = step?.metrics ?? {};
  const items = [
    {
      key: "depth_reached",
      label: "Depth",
      value: metrics.depth_reached ?? "-",
    },
    {
      key: "total_nodes",
      label: "Nodes",
      value: metrics.total_nodes ?? "-",
    },
    {
      key: "accuracy",
      label: "Accuracy",
      value: typeof metrics.accuracy === "number" ? `${metrics.accuracy.toFixed(1)}%` : "-",
    },
    {
      key: "current_node_id",
      label: "Current Node",
      value: step?.current_node_id ?? "-",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.key} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="text-lg font-semibold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

export default DecisionTreeMetrics;
