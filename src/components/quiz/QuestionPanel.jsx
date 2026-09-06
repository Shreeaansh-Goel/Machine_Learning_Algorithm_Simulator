const DIFFICULTY_STYLES = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-rose-100 text-rose-700",
};

const QUIZ_TYPE_LABELS = {
  1: "Count the Clusters",
  2: "Predict the Next Step",
  3: "Pick the Right Algorithm",
  4: "Tune the Parameters",
  5: "Read the Metrics",
};

/**
 * Displays question metadata and concept tag.
 * @param {{
 *  question: any,
 *  onConceptClick: (concept: string) => void,
 * }} props
 * @returns {JSX.Element}
 */
export const QuestionPanel = ({ question, onConceptClick }) => {
  if (!question) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            DIFFICULTY_STYLES[question.difficulty] || "bg-slate-100 text-slate-700"
          }`}
        >
          {question.difficulty}
        </span>
        <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
          {QUIZ_TYPE_LABELS[Number(question.quiz_type)] || "Quiz"}
        </span>
      </div>

      <p className="text-base font-semibold leading-6 text-slate-900">{question.question_text}</p>

      <button
        type="button"
        onClick={() => onConceptClick(String(question.concept_tested || ""))}
        className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700"
      >
        {question.concept_tested || "ML Concept"}
      </button>
    </section>
  );
};

export default QuestionPanel;
