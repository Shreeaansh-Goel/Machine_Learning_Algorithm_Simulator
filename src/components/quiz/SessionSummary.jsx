import { getBadgeById } from "../../utils/xpSystem";

const QUIZ_LABELS = {
  1: "Count the Clusters",
  2: "Predict the Next Step",
  3: "Pick the Right Algorithm",
  4: "Tune the Parameters",
  5: "Read the Metrics",
};

/**
 * Quiz session summary view.
 * @param {{
 *  sessionStats: any,
 *  xp: number,
 *  level: number,
 *  levelTitle: string,
 *  badges: string[],
 *  onRestart: () => void,
 *  onBackToVisualizer: () => void,
 *  onPracticeType: (quizType: number) => void,
 * }} props
 * @returns {JSX.Element}
 */
export const SessionSummary = ({
  sessionStats,
  xp,
  level,
  levelTitle,
  badges,
  onRestart,
  onBackToVisualizer,
  onPracticeType,
}) => {
  const total = Math.max(1, Number(sessionStats.questionsAnswered || 0));
  const accuracy = Math.round((Number(sessionStats.correct || 0) / total) * 100);
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - sessionStats.startedAt) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const typeRows = [1, 2, 3, 4, 5].map((quizType) => {
    const attempted = Number(sessionStats.typeStats?.[quizType]?.attempted || 0);
    const correct = Number(sessionStats.typeStats?.[quizType]?.correct || 0);
    const rowAccuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return { quizType, attempted, correct, rowAccuracy };
  });

  const weakest = typeRows
    .filter((row) => row.attempted > 0)
    .sort((a, b) => a.rowAccuracy - b.rowAccuracy)[0];

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Session Complete!</h1>
      <p className="text-sm text-slate-600">
        Level {level} - {levelTitle} | Total XP: {xp}
      </p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl bg-slate-50 p-3 text-sm">Questions answered: {sessionStats.questionsAnswered}</div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">Correct: {sessionStats.correct} ({accuracy}%)</div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">Hints used: {sessionStats.hintsUsed} (-{sessionStats.hintsUsed * 5} XP)</div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">Best streak: {sessionStats.bestStreak}</div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">Time spent: {minutes}m {seconds}s</div>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">Performance by Quiz Type</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-slate-700">
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Attempted</th>
                <th className="px-3 py-2">Correct</th>
                <th className="px-3 py-2">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {typeRows.map((row) => (
                <tr key={row.quizType} className="border-b border-slate-200">
                  <td className="px-3 py-2">{QUIZ_LABELS[row.quizType]}</td>
                  <td className="px-3 py-2">{row.attempted}</td>
                  <td className="px-3 py-2">{row.correct}</td>
                  <td className="px-3 py-2">{row.rowAccuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {weakest ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p>
            Weakest area: {QUIZ_LABELS[weakest.quizType]} ({weakest.rowAccuracy}% accuracy)
          </p>
          <button
            type="button"
            onClick={() => onPracticeType(weakest.quizType)}
            className="mt-2 rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-semibold"
          >
            Practice This Type
          </button>
        </div>
      ) : null}

      {badges.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">Badges Earned</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((badgeId) => (
              <span
                key={badgeId}
                className="rounded-full border border-primary bg-primary-light px-3 py-1 text-xs font-semibold text-primary"
              >
                {getBadgeById(badgeId).label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
        >
          Restart Session
        </button>
        <button
          type="button"
          onClick={onBackToVisualizer}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Back to Visualizer
        </button>
      </div>
    </section>
  );
};

export default SessionSummary;
