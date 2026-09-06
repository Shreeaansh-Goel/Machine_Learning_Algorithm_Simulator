import CompareActiveCanvas from "./CompareActiveCanvas.jsx";
import CanvasLoadingState from "../shared/CanvasLoadingState.jsx";
import ErrorBoundary from "../shared/ErrorBoundary.jsx";
import { getAlgorithmLabel } from "../../utils/compareUtils";

/**
 * Compare-mode scatter pane for one algorithm column.
 * @param {{
 *  algorithmName: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression",
 *  params: Record<string, unknown>,
 *  currentStep: Record<string, unknown> | null,
 *  previousStep: Record<string, unknown> | null,
 *  loading: boolean,
 *  error: string,
 * }} props
 * @returns {JSX.Element}
 */
export const CompareScatterPane = ({
  algorithmName,
  params,
  currentStep,
  previousStep,
  loading,
  error,
}) => {
  const points = Array.isArray(currentStep?.points) ? currentStep.points : [];

  return (
    <div className="h-[340px] rounded-xl border border-slate-200 bg-slate-50">
      {loading ? (
        <CanvasLoadingState algorithmLabel={getAlgorithmLabel(algorithmName)} />
      ) : error ? (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-rose-600">
          {error}
        </div>
      ) : points.length > 0 ? (
        <ErrorBoundary
          resetKeys={[algorithmName, points.length, Number(currentStep?.step_index || 0)]}
        >
          <CompareActiveCanvas
            algorithmName={algorithmName}
            params={params}
            currentStep={currentStep}
            previousStep={previousStep}
          />
        </ErrorBoundary>
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
          Load a dataset to generate steps for this algorithm.
        </div>
      )}
    </div>
  );
};

export default CompareScatterPane;
