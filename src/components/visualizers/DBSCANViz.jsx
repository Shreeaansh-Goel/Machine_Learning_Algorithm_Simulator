import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ParamPanel from "../panels/ParamPanel.jsx";
import { useDBSCANSteps } from "../../hooks/useDBSCANSteps.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import { useAlgorithmStore } from "../../store/algorithmStore.js";
import { useDatasetStore } from "../../store/datasetStore.js";
import { getDBSCANColor, getDBSCANStrokeColor, getDBSCANStrokeWidth } from "../../utils/colorUtils.js";
import {
  parseAlgorithmParamsFromSearch,
  parseStepIndexFromSearch,
} from "../../utils/shareUrl.js";
import ExplanationPanel from "../panels/ExplanationPanel.jsx";
import MetricsBar from "../panels/MetricsBar.jsx";
import CanvasLoadingState from "../shared/CanvasLoadingState.jsx";
import ScatterPlot from "../shared/ScatterPlot.jsx";
import PlayBar from "../shared/PlayBar.jsx";

const DEFAULT_PARAMS = { eps: 0.25, min_samples: 8, metric: "euclidean" };

/**
 * DBSCAN visualizer with step playback and epsilon-neighborhood overlay.
 * @returns {JSX.Element}
 */
export const DBSCANViz = () => {
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const stepFromQuery = useMemo(
    () => parseStepIndexFromSearch(searchParams),
    [searchParams]
  );

  const datasetPoints = useDatasetStore((state) => state.points);
  const [params, setParams] = useState(() =>
    /** @type {{ eps: number, min_samples: number, metric: "euclidean" | "manhattan" }} */ (
      parseAlgorithmParamsFromSearch("dbscan", DEFAULT_PARAMS, searchParams)
    )
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const {
    steps,
    currentStepIndex,
    isPlaying,
    speed,
    setSteps,
    nextStep,
    prevStep,
    setPlaying,
    setSpeed,
    reset,
    setCurrentParams,
    setAlgorithmName,
    setCurrentStepIndex,
  } = useAlgorithmStore();

  useEffect(() => {
    setAlgorithmName("dbscan");
  }, [setAlgorithmName]);

  useEffect(() => {
    setCurrentParams(params);
  }, [params, setCurrentParams]);

  useEffect(() => {
    if (steps.length === 0 || stepFromQuery == null) {
      return;
    }
    setCurrentStepIndex(stepFromQuery);
  }, [setCurrentStepIndex, stepFromQuery, steps.length]);

  useDBSCANSteps({ datasetPoints, params, setSteps, setPlaying, setLoading, setError });
  usePlayback({ isPlaying, speed, currentStepIndex, totalSteps: steps.length, nextStep, setPlaying });

  const currentStep = steps[currentStepIndex] ?? null;
  const currentPoint = currentStep?.points?.find((point) => point.state === "current") ?? null;
  const showNeighborhoodOverlay = currentStep?.step_type === "check_point" || currentStep?.step_type === "count_neighbors";
  const neighborhoodOverlay = showNeighborhoodOverlay && currentPoint
    ? { center: { x: Number(currentPoint.x), y: Number(currentPoint.y) }, eps: params.eps, metric: params.metric }
    : null;

  return (
    <div className="space-y-4">
      <ParamPanel algorithm="dbscan" params={params} onChange={setParams} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="h-[460px] rounded-xl border border-slate-200 bg-slate-50">
        {loading ? (
          <CanvasLoadingState algorithmLabel="DBSCAN" />
        ) : currentStep ? (
          <ScatterPlot
            points={currentStep.points}
            width={840}
            height={460}
            colorFn={getDBSCANColor}
            pointStrokeFn={getDBSCANStrokeColor}
            pointStrokeWidthFn={getDBSCANStrokeWidth}
            showNeighborhoodOverlay={showNeighborhoodOverlay}
            neighborhoodOverlay={neighborhoodOverlay}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Adjust parameters and load data to generate DBSCAN steps.
          </div>
        )}
      </div>
      <MetricsBar metrics={currentStep?.metrics} algorithm="dbscan" />
      <ExplanationPanel step={currentStep} algorithm="dbscan" />
      <PlayBar
        totalSteps={steps.length}
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        isPlaying={isPlaying}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onStepForward={nextStep}
        onStepBack={prevStep}
        onReset={reset}
        speed={speed}
        onSpeedChange={setSpeed}
      />
    </div>
  );
};

export default DBSCANViz;
