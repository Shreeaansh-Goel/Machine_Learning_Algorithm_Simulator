const DIFFICULTY_CARDS = [
  {
    key: "beginner",
    title: "Beginner",
    subtitle: "Just started ML? Start here. Focuses on visual intuition.",
    style: "border-emerald-300 bg-emerald-50",
    quizTypes: "Quiz types: 1 and 3",
  },
  {
    key: "intermediate",
    title: "Intermediate",
    subtitle: "Know the basics? Test your understanding.",
    style: "border-amber-300 bg-amber-50",
    quizTypes: "All 5 quiz types",
  },
  {
    key: "advanced",
    title: "Advanced",
    subtitle: "Hard datasets, edge cases, timed pressure.",
    style: "border-rose-300 bg-rose-50",
    quizTypes: "All 5 quiz types + timer",
  },
];

const QUIZ_TYPE_CARDS = [
  { id: 1, title: "Count the Clusters", desc: "Visual intuition quiz" },
  { id: 2, title: "Predict the Next Step", desc: "Algorithm logic quiz" },
  { id: 3, title: "Pick the Right Algorithm", desc: "Algorithm selection quiz" },
  { id: 4, title: "Tune the Parameters", desc: "Hyperparameter challenge" },
  { id: 5, title: "Read the Metrics", desc: "Metric interpretation quiz" },
];

/**
 * Quiz landing page before question starts.
 * @param {{
 *  sessionStats: any,
 *  onStartDaily: () => void,
 *  onStartDifficulty: (difficulty: "beginner"|"intermediate"|"advanced") => void,
 *  onStartType: (quizType: number) => void,
 *  error: string,
 * }} props
 * @returns {JSX.Element}
 */
export const QuizHomePage = ({
  sessionStats,
  onStartDaily,
  onStartDifficulty,
  onStartType,
  error,
}) => {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-primary bg-primary-light p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Daily Challenge x2 XP</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Today's Challenge</h1>
        <p className="mt-2 text-sm text-slate-700">
          Parameter Tuning - DBSCAN on Moon Data. Same challenge for everyone today.
        </p>
        <button
          type="button"
          onClick={onStartDaily}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Start Daily Challenge
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Choose Your Practice</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {DIFFICULTY_CARDS.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => onStartDifficulty(card.key)}
              className={`rounded-2xl border p-4 text-left shadow-sm ${card.style}`}
            >
              <p className="text-base font-semibold text-slate-900">{card.title}</p>
              <p className="mt-1 text-sm text-slate-700">{card.subtitle}</p>
              <p className="mt-2 text-xs font-medium text-slate-600">{card.quizTypes}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Choose Quiz Type</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {QUIZ_TYPE_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onStartType(card.id)}
              className="rounded-xl border border-slate-300 bg-white p-3 text-left shadow-sm transition hover:border-primary"
            >
              <p className="text-sm font-semibold text-slate-900">{card.title}</p>
              <p className="mt-1 text-xs text-slate-600">{card.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Your Stats</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <p className="rounded-lg bg-slate-50 p-2 text-sm">Today's XP: {sessionStats.xpEarned}</p>
          <p className="rounded-lg bg-slate-50 p-2 text-sm">Current streak: {sessionStats.bestStreak}</p>
          <p className="rounded-lg bg-slate-50 p-2 text-sm">Questions answered: {sessionStats.questionsAnswered}</p>
          <p className="rounded-lg bg-slate-50 p-2 text-sm">Best streak ever: {sessionStats.bestStreak}</p>
          <p className="rounded-lg bg-slate-50 p-2 text-sm">Badges: session based</p>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </section>
      ) : null}
    </div>
  );
};

export default QuizHomePage;
