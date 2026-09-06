import { useCountAnimation } from "../../hooks/useCountAnimation";

/**
 * Renders one metric card with animated number and progress indicator.
 * @param {{
 *  label: string,
 *  value: string | number | null,
 *  subtitle: string,
 *  progress: number,
 *  progressClassName: string,
 *  formatter?: (value: number | null, raw: string | number | null) => string,
 * }} props
 * @returns {JSX.Element}
 */
export const MetricCard = ({
  label,
  value,
  subtitle,
  progress,
  progressClassName,
  formatter,
}) => {
  const clampedProgress = Math.max(0, Math.min(progress, 100));
  const animated = useCountAnimation(typeof value === "number" ? value : null, 300);
  const displayValue = formatter
    ? formatter(animated, value)
    : typeof value === "number"
      ? (animated ?? value).toFixed(1)
      : value ?? "-";

  return (
    <article className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{displayValue}</p>
      <p className="mt-1 min-h-5 text-xs text-slate-500">{subtitle}</p>
      <progress
        value={clampedProgress}
        max={100}
        className={`mt-2 h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 ${progressClassName}`}
      />
    </article>
  );
};

export default MetricCard;