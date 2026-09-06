import { Link } from "react-router-dom";

/**
 * Home page.
 * @returns {JSX.Element}
 */
export const Home = () => (
  <div className="grid gap-8">
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">
        Interactive ML Visualizer
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-900">
        See algorithms learn, step by step.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-slate-600">
        Upload a dataset or pick a sample, then watch clustering, classification,
        and regression unfold with live metrics and explanations.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/visualize/k-means"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm"
        >
          Start with K-Means
        </Link>
        <Link
          to="/compare"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
        >
          Try Compare Mode
        </Link>
      </div>
    </section>
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Pick a dataset</h2>
        <p className="mt-2 text-sm text-slate-600">
          Choose built-in samples or upload your own CSV in seconds.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Tune parameters</h2>
        <p className="mt-2 text-sm text-slate-600">
          Adjust hyperparameters and watch the model respond live.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Track metrics</h2>
        <p className="mt-2 text-sm text-slate-600">
          See accuracy, silhouette, and other metrics update per step.
        </p>
      </div>
    </section>
  </div>
);

export default Home;
