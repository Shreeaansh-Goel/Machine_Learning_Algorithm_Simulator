/**
 * Hint button row with progressive reveal and XP cost.
 * @param {{
 *  hintTexts: string[],
 *  hintsRevealed: number,
 *  xp: number,
 *  hintDebt: number,
 *  onUseHint: () => void,
 * }} props
 * @returns {JSX.Element}
 */
export const HintSystem = ({
  hintTexts,
  hintsRevealed,
  xp,
  hintDebt,
  onUseHint,
}) => {
  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
      {[0, 1, 2].map((index) => {
        const revealed = hintsRevealed > index;
        return (
          <button
            key={index}
            type="button"
            onClick={onUseHint}
            disabled={revealed}
            className={`rounded-xl border px-3 py-2 text-left transition ${
              revealed
                ? "border-teal-200 bg-teal-50"
                : "border-slate-300 bg-slate-50 hover:border-primary"
            }`}
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              Hint {index + 1} {revealed ? "- Revealed" : "- costs 5 XP"}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {revealed
                ? hintTexts[index] || "No hint text available"
                : "Click to reveal this hint."}
            </p>
          </button>
        );
      })}
      <div className="md:col-span-3 flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1">XP balance: {xp}</span>
        {hintDebt > 0 ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
            XP debt: {hintDebt}
          </span>
        ) : null}
      </div>
    </section>
  );
};

export default HintSystem;
