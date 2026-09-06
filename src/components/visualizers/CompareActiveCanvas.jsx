import KNNCanvas from "./KNNCanvas.jsx";
import LinearRegressionCanvas from "./LinearRegressionCanvas.jsx";
import DecisionTreeCanvas from "./DecisionTreeCanvas.jsx";
import ScatterPlot from "../shared/ScatterPlot.jsx";
import {
  getCompareColorFn,
  getCompareNeighborhoodOverlay,
  getCompareStrokeFn,
  getCompareStrokeWidthFn,
} from "../../utils/compareUtils";

/**
 * Renders algorithm-specific compare visualization canvas.
 * @param {{
 *  algorithmName: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression",
 *  params: Record<string, unknown>,
 *  currentStep: Record<string, unknown> | null,
 *  previousStep: Record<string, unknown> | null,
 * }} props
 * @returns {JSX.Element}
 */
export const CompareActiveCanvas = ({
  algorithmName,
  params,
  currentStep,
  previousStep,
}) => {
  const points = Array.isArray(currentStep?.points) ? currentStep.points : [];
  const previousPoints = Array.isArray(previousStep?.points) ? previousStep.points : [];
  const stepType = String(currentStep?.step_type || "");

  if (algorithmName === "decision-tree") {
    return <DecisionTreeCanvas step={currentStep} width={560} height={340} />;
  }

  if (algorithmName === "knn") {
    return <KNNCanvas points={points} width={560} height={340} />;
  }

  if (algorithmName === "linear-regression") {
    const linePoints = /** @type {Array<{ x: number, y: number }>} */ (
      currentStep?.metrics?.line_points ?? []
    );
    const previousLinePoints = /** @type {Array<{ x: number, y: number }>} */ (
      previousStep?.metrics?.line_points ?? []
    );

    return (
      <LinearRegressionCanvas
        points={points}
        previousPoints={previousPoints}
        linePoints={linePoints}
        previousLinePoints={previousLinePoints}
        width={560}
        height={340}
      />
    );
  }

  const isKMeans = algorithmName === "kmeans";
  const isDBSCAN = algorithmName === "dbscan";
  const showAssignmentLines = isKMeans && stepType === "assign";
  const animateCentroids = isKMeans && stepType === "update";
  const overlay = isDBSCAN
    ? getCompareNeighborhoodOverlay(currentStep, params)
    : { showNeighborhoodOverlay: false, neighborhoodOverlay: null };

  return (
    <ScatterPlot
      points={points}
      previousPoints={previousPoints}
      width={560}
      height={340}
      colorFn={getCompareColorFn(algorithmName)}
      pointStrokeFn={getCompareStrokeFn(algorithmName)}
      pointStrokeWidthFn={getCompareStrokeWidthFn(algorithmName)}
      showAssignmentLines={showAssignmentLines}
      animateCentroids={animateCentroids}
      showNeighborhoodOverlay={overlay.showNeighborhoodOverlay}
      neighborhoodOverlay={overlay.neighborhoodOverlay}
    />
  );
};

export default CompareActiveCanvas;
