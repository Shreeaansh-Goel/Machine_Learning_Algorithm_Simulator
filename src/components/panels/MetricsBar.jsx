import MetricCard from "../shared/MetricCard.jsx";
import PerClassTable from "./PerClassTable.jsx";
import { buildMetricCards, isClassifierAlgorithm } from "../../utils/metricsBarUtils.js";

/**
 * Renders the live metrics dashboard for the current algorithm step.
 * @param {{
 *  metrics: Record<string, unknown> | null | undefined,
 *  algorithm: string,
 * }} props
 * @returns {JSX.Element}
 */
export const MetricsBar = ({ metrics, algorithm }) => {
  const safeMetrics = metrics ?? {};
  const cards = buildMetricCards(algorithm, safeMetrics);
  const showPerClass =
    isClassifierAlgorithm(algorithm) &&
    typeof safeMetrics.per_class_report === "object" &&
    safeMetrics.per_class_report !== null;

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard
            key={String(card.key)}
            label={String(card.label)}
            value={/** @type {string | number | null} */ (card.value)}
            subtitle={String(card.subtitle)}
            barValue={Number(card.barValue ?? 0)}
            barColor={String(card.barColor)}
            tooltip={String(card.tooltip)}
            decimals={
              typeof card.decimals === "number" ? Number(card.decimals) : undefined
            }
            suffix={typeof card.suffix === "string" ? String(card.suffix) : undefined}
          />
        ))}
      </div>
      {showPerClass ? (
        <PerClassTable
          report={/** @type {Record<string, unknown>} */ (safeMetrics.per_class_report)}
        />
      ) : null}
    </section>
  );
};

export default MetricsBar;