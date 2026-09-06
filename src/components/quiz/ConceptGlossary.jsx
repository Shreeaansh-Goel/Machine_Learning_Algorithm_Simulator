import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const GLOSSARY = [
  {
    name: "Core Point",
    definition:
      "A point with at least MinPts neighbors within epsilon. Core points anchor clusters.",
    formula: "|N(p)| >= MinPts",
    mistake: "Students often count only immediate visual neighbors and miss points on the radius boundary.",
    route: "dbscan",
  },
  {
    name: "Border Point",
    definition:
      "Reachable from a core point but not itself a core point. It lies on the cluster edge.",
    formula: "reachable(core) and |N(p)| < MinPts",
    mistake: "Confusing border points with noise when they actually connect to a core region.",
    route: "dbscan",
  },
  {
    name: "Noise Point",
    definition:
      "Not reachable from any core point. DBSCAN marks it as outlier.",
    formula: "not density-reachable from any core",
    mistake: "Assuming every point must belong to a cluster like K-Means.",
    route: "dbscan",
  },
  {
    name: "Epsilon",
    definition: "Neighborhood radius in DBSCAN.",
    formula: "N(p) = { q in D | dist(p,q) <= eps }",
    mistake: "Using too small epsilon and getting mostly noise.",
    route: "dbscan",
  },
  {
    name: "MinPts",
    definition: "Minimum neighbors required for core-point status.",
    formula: "core if |N(p)| >= MinPts",
    mistake: "Setting MinPts too high for sparse datasets.",
    route: "dbscan",
  },
  {
    name: "Silhouette Score",
    definition: "Measures cluster separation quality from -1 to 1.",
    formula: "s = (b - a) / max(a, b)",
    mistake: "Treating any positive score as equally good.",
    route: "k-means",
  },
  {
    name: "Centroid",
    definition: "Mean position of points assigned to a cluster.",
    formula: "mu_k = (1/|C_k|) * sum(x_i)",
    mistake: "Thinking centroids are always actual data points.",
    route: "k-means",
  },
  {
    name: "Inertia",
    definition: "Sum of squared distances from points to their centroids.",
    formula: "sum ||x_i - mu_{c(i)}||^2",
    mistake: "Comparing inertia across different dataset scales without normalization.",
    route: "k-means",
  },
  {
    name: "Convergence",
    definition: "Iteration where cluster assignments stop changing.",
    formula: "labels_t == labels_{t-1}",
    mistake: "Assuming convergence guarantees the global optimum.",
    route: "k-means",
  },
  {
    name: "Gini Impurity",
    definition: "How mixed classes are at a tree node.",
    formula: "Gini = 1 - sum(p_i^2)",
    mistake: "Interpreting low gini as overfitting by itself.",
    route: "decision-tree",
  },
  {
    name: "Information Gain",
    definition: "Impurity reduction achieved by a split.",
    formula: "Gain = impurity(parent) - weighted_children",
    mistake: "Choosing deep trees based only on immediate gain.",
    route: "decision-tree",
  },
  {
    name: "Overfitting",
    definition: "Model memorizes training data but performs poorly on unseen data.",
    formula: "train score >> validation score",
    mistake: "Increasing max_depth after seeing near-perfect training accuracy.",
    route: "decision-tree",
  },
  {
    name: "Pruning",
    definition: "Removing branches with little predictive value.",
    formula: "reduce complexity -> better generalization",
    mistake: "Pruning too aggressively and losing useful structure.",
    route: "decision-tree",
  },
  {
    name: "Precision",
    definition: "Of predicted positives, how many were truly positive.",
    formula: "TP / (TP + FP)",
    mistake: "Ignoring recall in high-risk domains.",
    route: "decision-tree",
  },
  {
    name: "Recall",
    definition: "Of true positives, how many did the model find.",
    formula: "TP / (TP + FN)",
    mistake: "Calling high precision alone a safe classifier.",
    route: "decision-tree",
  },
  {
    name: "F1 Score",
    definition: "Harmonic mean of precision and recall.",
    formula: "2 * (P * R) / (P + R)",
    mistake: "Using only accuracy when classes are imbalanced.",
    route: "decision-tree",
  },
  {
    name: "Macro Average",
    definition: "Average metric across classes with equal class weight.",
    formula: "(m_1 + m_2 + ... + m_k) / k",
    mistake: "Confusing macro and weighted averages on imbalanced data.",
    route: "decision-tree",
  },
  {
    name: "Weighted Average",
    definition: "Average metric weighted by class support.",
    formula: "sum(w_i * m_i)",
    mistake: "Using weighted score alone and missing minority-class failures.",
    route: "decision-tree",
  },
  {
    name: "Confusion Matrix",
    definition: "Table counting TP, FP, TN, and FN outcomes.",
    formula: "rows = actual, columns = predicted",
    mistake: "Reading rows/columns in the wrong direction.",
    route: "decision-tree",
  },
];

/**
 * Concept glossary slide-in drawer.
 * @param {{
 *  isOpen: boolean,
 *  activeConcept: string,
 *  onClose: () => void,
 * }} props
 * @returns {JSX.Element | null}
 */
export const ConceptGlossary = ({ isOpen, activeConcept, onClose }) => {
  const navigate = useNavigate();

  const activeEntry = useMemo(() => {
    if (!activeConcept) {
      return null;
    }
    const lower = activeConcept.toLowerCase();
    return (
      GLOSSARY.find((entry) => lower.includes(entry.name.toLowerCase())) ||
      GLOSSARY.find((entry) => entry.name.toLowerCase().includes(lower)) ||
      null
    );
  }, [activeConcept]);

  if (!isOpen) {
    return null;
  }

  const entries = activeEntry ? [activeEntry] : GLOSSARY;

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40">
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Concept Glossary</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          {entries.map((entry) => (
            <article key={entry.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h3 className="text-base font-semibold text-slate-900">{entry.name}</h3>
              <p className="mt-1 text-sm text-slate-700">{entry.definition}</p>
              <p className="mt-2 rounded bg-white px-2 py-1 font-mono text-xs text-slate-700">
                {entry.formula}
              </p>
              <p className="mt-2 text-xs text-slate-600">Common mistake: {entry.mistake}</p>
              <button
                type="button"
                onClick={() => {
                  navigate(`/visualize/${entry.route}`);
                  onClose();
                }}
                className="mt-3 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
              >
                See it in action
              </button>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default ConceptGlossary;
