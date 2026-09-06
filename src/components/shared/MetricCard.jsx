import { useCountAnimation } from "../../hooks/useCountAnimation";

/**
 * Renders one metric card with animated number and progress indicator.
 * @param {{
 *  label: string,
 *  value: string | number | null,
 *  subtitle: string,
 *  barColor: string,
 *  barValue: number,
 *  tooltip?: string,
 *  decimals?: number,
 *  suffix?: string,
 * }} props
 * @returns {JSX.Element}
 */
export const MetricCard = ({
  label,
  value,
  subtitle,
  barColor,
  barValue,
  tooltip,
  decimals,
  suffix,
}) => {
  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? value : null;
  const animatedValue = useCountAnimation(numericValue, 300);
  const clampedProgress = Math.max(0, Math.min(barValue, 1));

  /**
   * Formats a number compactly to keep large values readable in cards.
   * @param {number} numeric
   * @param {number} precision
   * @returns {string}
   */
  const formatNumericDisplay = (numeric, precision) => {
    const absValue = Math.abs(numeric);
    if (absValue >= 1e6 || (absValue > 0 && absValue < 1e-4)) {
      return numeric.toExponential(2);
    }
    return numeric.toFixed(precision);
  };

  const displayValue = (() => {
    if (numericValue === null) {
      if (typeof value === "string") {
        return value;
      }
      return "-";
    }

    const resolved = animatedValue ?? numericValue;
    const precision =
      typeof decimals === "number"
        ? Math.max(0, decimals)
        : numericValue % 1 === 0
          ? 0
          : 3;

    return `${formatNumericDisplay(resolved, precision)}${suffix ?? ""}`;
  })();

  return (
    <article className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p
        className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
        title={tooltip}
      >
        {label}
      </p>
      <p className="mt-1 break-all text-xl font-semibold text-slate-900">{displayValue}</p>
      <p className="mt-1 min-h-5 text-xs text-slate-500">{subtitle}</p>
      <progress
        value={clampedProgress}
        max={1}
        className={`mt-2 h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 ${barColor}`}
      />
    </article>
  );
};

export default MetricCard;