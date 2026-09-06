import ParamPanel from "./ParamPanel.jsx";
import { getAlgorithmLabel } from "../../utils/compareUtils";
import CompareAlgorithmSelector from "./CompareAlgorithmSelector.jsx";
import CompareScatterPane from "../visualizers/CompareScatterPane.jsx";
import DecisionTreeParams from "../visualizers/DecisionTreeParams.jsx";

/**
 * One compare-mode algorithm column with controls and visualization.
 * @param {{
 *  title: string,
 *  algorithmName: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression",
 *  params: Record<string, unknown>,
 *  totalSteps: number,
 *  currentStepIndex: number,
 *  currentStep: Record<string, unknown> | null,
 *  previousStep: Record<string, unknown> | null,
 *  loading: boolean,
 *  error: string,
 *  onAlgorithmChange: (name: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression") => void,
 *  onParamsChange: (params: Record<string, unknown>) => void,
 * }} props
 * @returns {JSX.Element}
 */
export const CompareColumnPanel = ({
  title,
  algorithmName,
  params,
  totalSteps,
  currentStepIndex,
  currentStep,
  previousStep,
  loading,
  error,
  onAlgorithmChange,
  onParamsChange,
}) => {
  const stepText =
    totalSteps > 0 ? `Step ${currentStepIndex + 1} of ${totalSteps}` : "Step 0 of 0";

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {getAlgorithmLabel(algorithmName)}
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-[minmax(0,180px)_1fr] md:items-end">
        <CompareAlgorithmSelector value={algorithmName} onChange={onAlgorithmChange} />
        <p className="text-xs text-slate-600">{stepText}</p>
      </div>
      {algorithmName === "decision-tree" ? (
        <DecisionTreeParams
          params={/** @type {{ max_depth: number, criterion: "gini" | "entropy", min_samples_split: number }} */ (params)}
          onChange={/** @type {(params: { max_depth: number, criterion: "gini" | "entropy", min_samples_split: number }) => void} */ (onParamsChange)}
        />
      ) : (
        <ParamPanel
          algorithm={/** @type {"kmeans" | "dbscan" | "knn" | "linear-regression"} */ (algorithmName)}
          params={params}
          onChange={onParamsChange}
        />
      )}
      <CompareScatterPane
        algorithmName={algorithmName}
        params={params}
        currentStep={currentStep}
        previousStep={previousStep}
        loading={loading}
        error={error}
      />
    </section>
  );
};

export default CompareColumnPanel;
