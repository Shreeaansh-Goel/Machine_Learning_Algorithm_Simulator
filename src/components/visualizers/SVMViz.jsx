import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { usePlayback } from "../../hooks/usePlayback.js";
import { useSVMSteps } from "../../hooks/useSVMSteps.js";
import { useAlgorithmStore } from "../../store/algorithmStore.js";
import { useDatasetStore } from "../../store/datasetStore.js";
import { parseAlgorithmParamsFromSearch, parseStepIndexFromSearch } from "../../utils/shareUrl.js";
import ExplanationPanel from "../panels/ExplanationPanel.jsx";
import MetricsBar from "../panels/MetricsBar.jsx";
import ParamPanel from "../panels/ParamPanel.jsx";
import CanvasLoadingState from "../shared/CanvasLoadingState.jsx";
import PlayBar from "../shared/PlayBar.jsx";
import SVMCanvas from "./SVMCanvas.jsx";

const DEFAULT_PARAMS = { kernel: "linear", C: 1.0 };

/**
 * SVM visualizer with linear margin or RBF decision boundary playback.
 * @returns {JSX.Element}
 */
export const SVMViz = () => {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const stepFromQuery = useMemo(() => parseStepIndexFromSearch(searchParams), [searchParams]);

  const datasetPoints = useDatasetStore((state) => state.points);
  const [params, setParams] = useState(() => parseAlgorithmParamsFromSearch("svm", DEFAULT_PARAMS, searchParams));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { steps, currentStepIndex, isPlaying, speed, setSteps, nextStep, prevStep, setPlaying, setSpeed, reset, setCurrentParams, setAlgorithmName, setCurrentStepIndex } = useAlgorithmStore();

  useEffect(() => setAlgorithmName("svm"), [setAlgorithmName]);
  useEffect(() => setCurrentParams(params), [params, setCurrentParams]);
  useEffect(() => {
    if (steps.length > 0 && stepFromQuery != null) {
      setCurrentStepIndex(stepFromQuery);
    }
  }, [setCurrentStepIndex, stepFromQuery, steps.length]);

  useSVMSteps({ datasetPoints, params, setSteps, setPlaying, setLoading, setError });
  usePlayback({ isPlaying, speed, currentStepIndex, totalSteps: steps.length, nextStep, setPlaying });

  const currentStep = steps[currentStepIndex] ?? null;

  return (
    <div className="space-y-4">
      <ParamPanel algorithm="svm" params={params} onChange={setParams} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="h-[460px] rounded-xl border border-slate-200 bg-slate-50">
        {loading ? <CanvasLoadingState algorithmLabel="SVM" /> : <SVMCanvas step={currentStep} />}
      </div>
      <MetricsBar metrics={currentStep?.metrics} algorithm="svm" />
      <ExplanationPanel step={currentStep} algorithm="svm" />
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

export default SVMViz;
