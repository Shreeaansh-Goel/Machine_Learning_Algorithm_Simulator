import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { usePCASteps } from "../../hooks/usePCASteps.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import { useAlgorithmStore } from "../../store/algorithmStore.js";
import { useDatasetStore } from "../../store/datasetStore.js";
import { parseAlgorithmParamsFromSearch, parseStepIndexFromSearch } from "../../utils/shareUrl.js";
import ExplanationPanel from "../panels/ExplanationPanel.jsx";
import ParamPanel from "../panels/ParamPanel.jsx";
import PCAExplainedVariance from "../panels/PCAExplainedVariance.jsx";
import CanvasLoadingState from "../shared/CanvasLoadingState.jsx";
import PlayBar from "../shared/PlayBar.jsx";
import PCACanvas from "./PCACanvas.jsx";

const DEFAULT_PARAMS = { n_components: 2 };

/**
 * PCA visualizer with covariance/eigenvector/projection playback.
 * @returns {JSX.Element}
 */
export const PCAViz = () => {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const stepFromQuery = useMemo(() => parseStepIndexFromSearch(searchParams), [searchParams]);

  const datasetPoints = useDatasetStore((state) => state.points);
  const [params, setParams] = useState(() => parseAlgorithmParamsFromSearch("pca", DEFAULT_PARAMS, searchParams));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { steps, currentStepIndex, isPlaying, speed, setSteps, nextStep, prevStep, setPlaying, setSpeed, reset, setCurrentParams, setAlgorithmName, setCurrentStepIndex } = useAlgorithmStore();

  useEffect(() => setAlgorithmName("pca"), [setAlgorithmName]);
  useEffect(() => setCurrentParams(params), [params, setCurrentParams]);
  useEffect(() => {
    if (steps.length > 0 && stepFromQuery != null) {
      setCurrentStepIndex(stepFromQuery);
    }
  }, [setCurrentStepIndex, stepFromQuery, steps.length]);

  usePCASteps({ datasetPoints, params, setSteps, setPlaying, setLoading, setError });
  usePlayback({ isPlaying, speed, currentStepIndex, totalSteps: steps.length, nextStep, setPlaying });

  const currentStep = steps[currentStepIndex] ?? null;
  const explainedRatios = Array.isArray(currentStep?.metrics?.explained_variance_ratio)
    ? currentStep.metrics.explained_variance_ratio.map((value) => Number(value))
    : [];

  return (
    <div className="space-y-4">
      <ParamPanel algorithm="pca" params={params} onChange={setParams} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="h-[440px] rounded-xl border border-slate-200 bg-slate-50">
        {loading ? <CanvasLoadingState algorithmLabel="PCA" /> : <PCACanvas step={currentStep} />}
      </div>
      <PCAExplainedVariance ratios={explainedRatios} />
      <ExplanationPanel step={currentStep} algorithm="pca" />
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

export default PCAViz;
