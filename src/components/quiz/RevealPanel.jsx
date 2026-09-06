import BadgeUnlock from "./BadgeUnlock";

/**
 * Formats correct answer text for display.
 * @param {any} question
 * @returns {string}
 */
const getCorrectAnswerText = (question) => {
  if (!question) {
    return "";
  }

  if ([2, 5].includes(Number(question.quiz_type))) {
    const index = Number(question.correct_answer);
    return question.options?.[index] || String(question.correct_answer);
  }

  if (Number(question.quiz_type) === 4) {
    return JSON.stringify(question.correct_answer || {}, null, 0);
  }

  return String(question.correct_answer);
};

/**
 * Result reveal panel after answer submission.
 * @param {{
 *  question: any,
 *  lastResult: any,
 *  unlockedBadges: string[],
 *  isRevealed: boolean,
 *  onReveal: () => void,
 *  onNext: () => void,
 *  onTrySimilar?: () => void,
 *  onWatchAlgorithm: () => void,
 * }} props
 * @returns {JSX.Element | null}
 */
export const RevealPanel = ({
  question,
  lastResult,
  unlockedBadges,
  isRevealed,
  onReveal,
  onNext,
  onTrySimilar = undefined,
  onWatchAlgorithm,
}) => {
  if (!question || !lastResult) {
    return null;
  }

  const correctAnswerText = getCorrectAnswerText(question);
  const isPartial = Boolean(lastResult.isPartial);
  const isCorrect = Boolean(lastResult.isCorrect);

  return (
    <section
      className={`space-y-3 rounded-2xl border p-4 shadow-sm ${
        isCorrect
          ? "border-emerald-300 bg-emerald-50"
          : isPartial
            ? "border-amber-300 bg-amber-50"
            : "border-rose-300 bg-rose-50"
      }`}
    >
      <p className="text-lg font-semibold text-slate-900">
        {isCorrect
          ? `Correct! +${lastResult.earnedXp || 0} XP`
          : isPartial
            ? `Good try! ${lastResult.scorePct || 0}%`
            : "Not quite"}
      </p>

      <p className="text-sm text-slate-700">{question.explanation_after}</p>
      <p className="text-sm text-slate-700">{question.concept_definition}</p>

      {!isCorrect ? (
        <p className="text-sm font-medium text-slate-800">
          Correct answer: {correctAnswerText}
        </p>
      ) : null}

      {isPartial && lastResult?.evaluation ? (
        <div className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800">
          <p>Your silhouette: {String(lastResult.evaluation.student_silhouette ?? "-")}</p>
          <p>Ideal silhouette: {String(lastResult.evaluation.ideal_silhouette ?? "-")}</p>
        </div>
      ) : null}

      {unlockedBadges.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2">
          {unlockedBadges.map((badgeId) => (
            <BadgeUnlock key={badgeId} badgeId={badgeId} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!isRevealed ? (
          <button
            type="button"
            onClick={onReveal}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Reveal Details
          </button>
        ) : null}

        <button
          type="button"
          onClick={onWatchAlgorithm}
          className="rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary"
        >
          Watch the Algorithm
        </button>

        {!isCorrect && onTrySimilar ? (
          <button
            type="button"
            onClick={onTrySimilar}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Try Similar Question
          </button>
        ) : null}

        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white"
        >
          Next Question
        </button>
      </div>
    </section>
  );
};

export default RevealPanel;
