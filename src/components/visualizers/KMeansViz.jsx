import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useKMeansSteps } from "../../hooks/useKMeansSteps.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import { useAlgorithmStore } from "../../store/algorithmStore.js";
import { useDatasetStore } from "../../store/datasetStore.js";
import { getKMeansColor } from "../../utils/colorUtils.js";
import {
  parseAlgorithmParamsFromSearch,
  parseStepIndexFromSearch,
} from "../../utils/shareUrl.js";
import ExplanationPanel from "../panels/ExplanationPanel.jsx";
import MetricsBar from "../panels/MetricsBar.jsx";
import ParamPanel from "../panels/ParamPanel.jsx";
import CanvasLoadingState from "../shared/CanvasLoadingState.jsx";
import ScatterPlot from "../shared/ScatterPlot.jsx";
import PlayBar from "../shared/PlayBar.jsx";

const DEFAULT_PARAMS = { k: 3, max_iter: 50, init: "kmeans++" };
export const KMeansViz = () => {
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
    /** @type {{ k: number, max_iter: number, init: "random" | "kmeans++" }} */ (
      parseAlgorithmParamsFromSearch("k-means", DEFAULT_PARAMS, searchParams)
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
    setAlgorithmName("k-means");
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

  useKMeansSteps({
    datasetPoints,
    params,
    setSteps,
    setPlaying,
    setLoading,
    setError,
  });

  usePlayback({
    isPlaying,
    speed,
    currentStepIndex,
    totalSteps: steps.length,
    nextStep,
    setPlaying,
  });

  const currentStep = steps[currentStepIndex] ?? null;
  const previousStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;

  return (
    <div className="space-y-4">
      <ParamPanel algorithm="kmeans" params={params} onChange={setParams} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="h-[460px] rounded-xl border border-slate-200 bg-slate-50">
        {loading ? (
          <CanvasLoadingState algorithmLabel="K-Means" />
        ) : currentStep ? (
          <ScatterPlot
            points={currentStep.points}
            width={840}
            height={460}
            colorFn={getKMeansColor}
            showAssignmentLines={currentStep.step_type === "assign"}
            animateCentroids={currentStep.step_type === "update"}
            previousPoints={previousStep?.points ?? []}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Adjust parameters and load data to generate K-Means steps.
          </div>
        )}
      </div>
      <MetricsBar metrics={currentStep?.metrics} algorithm="kmeans" />
      <ExplanationPanel step={currentStep} algorithm="kmeans" />
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

export default KMeansViz;
