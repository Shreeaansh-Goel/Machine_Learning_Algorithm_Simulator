import { getLevelProgress } from "../../utils/xpSystem";

const CIRCLE_RADIUS = 18;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

/**
 * Quiz top header with XP, level, streak and optional timer.
 * @param {{
 *  xp: number,
 *  streak: number,
 *  questionNumber: number,
 *  maxQuestions: number,
 *  timerSeconds: number | null,
 *  timerLimit: number | null,
 *  onExit: () => void,
 * }} props
 * @returns {JSX.Element}
 */
export const QuizHeader = ({
  xp,
  streak,
  questionNumber,
  maxQuestions,
  timerSeconds,
  timerLimit,
  onExit,
}) => {
  const progress = getLevelProgress(xp);
  const progressPct = Math.round(progress.progress * 100);
  const timerRatio =
    timerSeconds != null && timerLimit && timerLimit > 0
      ? Math.max(0, Math.min(1, timerSeconds / timerLimit))
      : 1;
  const dashOffset = CIRCLE_CIRCUMFERENCE * (1 - timerRatio);

  return (
    <header className="grid gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm md:grid-cols-[1fr_auto]">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">
          Level {progress.level} - {progress.title}
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-600">
          {progress.nextXp == null
            ? `${xp} XP total`
            : `${progress.currentInLevel}/${progress.levelSpan} XP toward next level`}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <p className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
          Streak: {streak}
        </p>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          Question {questionNumber} of {maxQuestions}
        </p>

        {timerSeconds != null ? (
          <div className="relative h-12 w-12">
            <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
              <circle cx="22" cy="22" r={CIRCLE_RADIUS} fill="none" stroke="#E2E8F0" strokeWidth="4" />
              <circle
                cx="22"
                cy="22"
                r={CIRCLE_RADIUS}
                fill="none"
                stroke="#E11D48"
                strokeWidth="4"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
              {timerSeconds}
            </span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onExit}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
        >
          Exit Quiz
        </button>
      </div>
    </header>
  );
};

export default QuizHeader;
