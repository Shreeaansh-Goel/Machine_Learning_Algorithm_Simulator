import { getWhyThisMatters } from "../../utils/explanations";
import { getStepFormula } from "../../utils/mathFormulas";

/**
 * Renders educational, step-synced plain-English guidance for algorithm playback.
 * @param {{
 *  step: { step_type?: string, description?: string, highlight?: string, metrics?: Record<string, unknown>, points?: Array<Record<string, unknown>> } | null,
 *  algorithm: string,
 * }} props
 * @returns {JSX.Element}
 */
export const ExplanationPanel = ({ step, algorithm }) => {
  const description =
    step?.description ||
    "Run the algorithm to begin the step-by-step explanation.";
  const highlight =
    step?.highlight ||
    "Key insights for the current step will appear here.";
  const formula = getStepFormula(step, algorithm);
  const whyText = getWhyThisMatters(algorithm, step?.step_type);

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          What&apos;s happening now
        </p>
      </header>

      <p className="text-[14px] leading-6 text-slate-700">{description}</p>

      <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Key insight
        </p>
        <p className="mt-1 break-all text-sm leading-5 text-teal-900">{highlight}</p>
      </div>

      <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          Math for this step
        </summary>
        <p className="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-700">
          {formula || "No core formula for this step yet."}
        </p>
      </details>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Why does this matter?
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{whyText}</p>
      </div>
    </section>
  );
};

export default ExplanationPanel;