/**
 * Renders answer input controls by quiz type.
 * @param {{
 *  question: any,
 *  selectedAnswer: unknown,
 *  onSelectAnswer: (value: unknown) => void,
 *  onSubmit: () => void,
 *  paramDraft: Record<string, unknown>,
 *  onParamChange: (key: string, value: unknown) => void,
 *  onTryParams: () => void,
 *  type4Attempts: number,
 *  lastResult: any,
 * }} props
 * @returns {JSX.Element | null}
 */
export const AnswerArea = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  paramDraft,
  onParamChange,
  onTryParams,
  type4Attempts,
  lastResult,
}) => {
  if (!question) {
    return null;
  }

  const quizType = Number(question.quiz_type);

  if (quizType === 1) {
    return (
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onSelectAnswer(count)}
              className={`min-w-12 rounded-xl border px-4 py-2 text-sm font-semibold ${
                Number(selectedAnswer) === count
                  ? "border-primary bg-primary text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={selectedAnswer == null}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Submit Answer
        </button>
      </section>
    );
  }

  if ([2, 3, 5].includes(quizType)) {
    return (
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        {(question.options || []).map((option, index) => (
          <button
            key={`${option}-${index}`}
            type="button"
            onClick={() => onSelectAnswer(index)}
            onDoubleClick={onSubmit}
            className={`rounded-xl border p-3 text-left ${
              Number(selectedAnswer) === index
                ? "border-primary bg-primary-light"
                : "border-slate-300 bg-white"
            }`}
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              {String.fromCharCode(65 + index)}
            </p>
            <p className="mt-1 text-sm text-slate-800">{option}</p>
          </button>
        ))}
        <button
          type="button"
          onClick={onSubmit}
          disabled={selectedAnswer == null}
          className="md:col-span-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Submit Answer
        </button>
      </section>
    );
  }

  const isDbscan = String(question.algorithm) === "dbscan";
  const primaryKey = isDbscan ? "eps" : "k";
  const secondaryKey = isDbscan ? "min_samples" : "max_iter";
  const primaryValue = Number(paramDraft[primaryKey] ?? (isDbscan ? 0.3 : 3));
  const secondaryValue = Number(paramDraft[secondaryKey] ?? (isDbscan ? 5 : 80));

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-700">
          {isDbscan ? "Epsilon" : "K"}
          <input
            type="range"
            min={isDbscan ? 0.1 : 2}
            max={isDbscan ? 2.0 : 10}
            step={isDbscan ? 0.05 : 1}
            value={primaryValue}
            onChange={(event) => onParamChange(primaryKey, Number(event.target.value))}
            className="w-full"
          />
          <p className="text-xs text-slate-500">{primaryValue}</p>
        </label>

        <label className="space-y-1 text-sm text-slate-700">
          {isDbscan ? "Min Samples" : "Max Iterations"}
          <input
            type="range"
            min={isDbscan ? 2 : 20}
            max={isDbscan ? 20 : 200}
            step={1}
            value={secondaryValue}
            onChange={(event) => onParamChange(secondaryKey, Number(event.target.value))}
            className="w-full"
          />
          <p className="text-xs text-slate-500">{secondaryValue}</p>
        </label>
      </div>

      <p className="text-xs text-slate-500">Attempt {Math.min(type4Attempts + 1, 5)} of 5</p>

      {lastResult?.isPartial && lastResult?.evaluation ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p>{lastResult.evaluation.feedback_text}</p>
          <p className="mt-1 font-medium">Score: {lastResult.evaluation.score_pct}%</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onTryParams}
        className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
      >
        Try These Params
      </button>
    </section>
  );
};

export default AnswerArea;
