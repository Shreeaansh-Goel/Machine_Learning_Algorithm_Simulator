import { NavLink } from "react-router-dom";

const GROUPS = [
  {
    title: "Clustering",
    items: [
      { label: "DBSCAN", slug: "dbscan", dotClass: "bg-sky-500" },
      { label: "K-Means", slug: "k-means", dotClass: "bg-emerald-500" },
      { label: "Hierarchical", slug: "hierarchical", dotClass: "bg-indigo-500" },
    ],
  },
  {
    title: "Classification",
    items: [
      { label: "Decision Tree", slug: "decision-tree", dotClass: "bg-amber-500" },
      { label: "KNN", slug: "knn", dotClass: "bg-cyan-500" },
      { label: "SVM", slug: "svm", dotClass: "bg-rose-500" },
    ],
  },
  {
    title: "Regression",
    items: [
      { label: "Linear Regression", slug: "linear-regression", dotClass: "bg-violet-500" },
      { label: "Polynomial Regression", slug: "polynomial-regression", dotClass: "bg-fuchsia-500" },
    ],
  },
  {
    title: "Dimensionality",
    items: [
      { label: "PCA", slug: "pca", dotClass: "bg-teal-500" },
      { label: "t-SNE", slug: "t-sne", dotClass: "bg-orange-500" },
    ],
  },
];

/**
 * Builds nav link classes based on active state.
 * @param {{ isActive: boolean }} navState
 * @returns {string}
 */
const getNavLinkClass = ({ isActive }) =>
  [
    "flex items-center rounded-lg text-sm font-medium transition md:h-10 md:w-10 md:justify-center lg:h-auto lg:w-auto lg:justify-start lg:px-3 lg:py-2",
    isActive
      ? "bg-primary text-white shadow-sm"
      : "text-slate-700 hover:bg-slate-100",
  ].join(" ");

/**
 * Renders a single algorithm link item.
 * @param {{ label: string, slug: string, dotClass: string }} item
 * @returns {JSX.Element}
 */
const renderItem = (item) => (
  <li key={item.slug}>
    <NavLink to={`/visualize/${item.slug}`} className={getNavLinkClass} title={item.label}>
      <span className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} aria-hidden="true" />
      <span className="sr-only">{item.label}</span>
      <span className="ml-2 hidden lg:inline-block">{item.label}</span>
    </NavLink>
  </li>
);

/**
 * Renders a group section.
 * @param {{ title: string, items: { label: string, slug: string }[] }} group
 * @returns {JSX.Element}
 */
const renderGroup = (group) => (
  <div key={group.title} className="space-y-2">
    <p className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 lg:block">
      {group.title}
    </p>
    <ul className="space-y-1 lg:space-y-1.5">{group.items.map(renderItem)}</ul>
  </div>
);

/**
 * Sidebar navigation listing algorithms.
 * @returns {JSX.Element}
 */
export const Sidebar = () => (
  <aside className="fixed left-0 top-12 z-10 hidden h-[calc(100vh-3rem)] w-16 border-r border-slate-200 bg-white/90 p-2 backdrop-blur md:block lg:w-[220px] lg:p-4">
    <div className="flex h-full flex-col gap-4 overflow-y-auto lg:gap-6">
      {GROUPS.map(renderGroup)}
    </div>
  </aside>
);

export default Sidebar;
