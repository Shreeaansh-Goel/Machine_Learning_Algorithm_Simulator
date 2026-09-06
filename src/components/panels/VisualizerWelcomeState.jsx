const QUICK_START_CARDS = [
  {
    key: "dbscan",
    title: "Try DBSCAN",
    subtitle: "Great for non-spherical clusters and noise detection.",
  },
  {
    key: "k-means",
    title: "Try K-Means",
    subtitle: "Classic centroid-based clustering with clear iterations.",
  },
  {
    key: "decision-tree",
    title: "Try Decision Tree",
    subtitle: "Watch splits build interpretable classification rules.",
  },
];

/**
 * Empty visualizer state with quick-start presets.
 * @param {{ onQuickStart: (algorithm: "dbscan" | "k-means" | "decision-tree") => void }} props
 * @returns {JSX.Element}
 */
export const VisualizerWelcomeState = ({ onQuickStart }) => (
  <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
    <h2 className="text-xl font-semibold text-slate-900">Pick an algorithm to begin</h2>
    <p className="mt-2 text-sm text-slate-600">
      Start with a curated preset and explore each algorithm step by step.
    </p>
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {QUICK_START_CARDS.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onQuickStart(card.key)}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-primary hover:bg-primary-light"
        >
          <p className="text-sm font-semibold text-slate-900">{card.title}</p>
          <p className="mt-1 text-xs text-slate-600">{card.subtitle}</p>
        </button>
      ))}
    </div>
  </section>
);

export default VisualizerWelcomeState;
