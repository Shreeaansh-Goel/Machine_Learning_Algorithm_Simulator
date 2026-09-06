import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { useKNNSteps } from "../../hooks/useKNNSteps.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import { useAlgorithmStore } from "../../store/algorithmStore.js";
import { useDatasetStore } from "../../store/datasetStore.js";
import {
  parseAlgorithmParamsFromSearch,
  parseStepIndexFromSearch,
} from "../../utils/shareUrl.js";
import ExplanationPanel from "../panels/ExplanationPanel.jsx";
import MetricsBar from "../panels/MetricsBar.jsx";
import ParamPanel from "../panels/ParamPanel.jsx";
import CanvasLoadingState from "../shared/CanvasLoadingState.jsx";
import PlayBar from "../shared/PlayBar.jsx";
import KNNCanvas from "./KNNCanvas.jsx";

const DEFAULT_PARAMS = { k: 5, metric: "euclidean" };

/**
 * KNN visualizer with click-to-set query point classification playback.
 * @returns {JSX.Element}
 */
export const KNNViz = () => {
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
    /** @type {{ k: number, metric: "euclidean" | "manhattan" }} */ (
      parseAlgorithmParamsFromSearch("knn", DEFAULT_PARAMS, searchParams)
    )
  );
  const [queryPoint, setQueryPoint] = useState(/** @type {{ x: number, y: number } | null} */ (null));
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
    setAlgorithmName("knn");
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

  useEffect(() => {
    if (datasetPoints.length === 0) {
      setQueryPoint(null);
      return;
    }
    const meanX = datasetPoints.reduce((sum, point) => sum + Number(point.x), 0) / datasetPoints.length;
    const meanY = datasetPoints.reduce((sum, point) => sum + Number(point.y), 0) / datasetPoints.length;
    setQueryPoint({ x: Number(meanX.toFixed(4)), y: Number(meanY.toFixed(4)) });
  }, [datasetPoints]);

  useKNNSteps({ datasetPoints, params, queryPoint, setSteps, setPlaying, setLoading, setError });
  usePlayback({ isPlaying, speed, currentStepIndex, totalSteps: steps.length, nextStep, setPlaying });

  const currentStep = steps[currentStepIndex] ?? null;
  const predictedClass = currentStep?.metrics?.predicted_class ?? "-";
  const confidence = Number(currentStep?.metrics?.prediction_confidence);

  return (
    <div className="space-y-4">
      <ParamPanel algorithm="knn" params={params} onChange={setParams} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="h-[460px] rounded-xl border border-slate-200 bg-slate-50">
        {loading ? (
          <CanvasLoadingState algorithmLabel="KNN" />
        ) : currentStep ? (
          <KNNCanvas points={currentStep.points ?? []} onSetQuery={setQueryPoint} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Load labeled data to run KNN.</div>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Predicted class: {String(predictedClass)}</p>
        <p className="mt-1 text-slate-600">Confidence: {Number.isFinite(confidence) ? `${Math.round(confidence)}%` : "-"}</p>
        <p className="mt-1 text-xs text-slate-500">Click anywhere on the chart to move the query point and re-run KNN.</p>
      </div>
      <MetricsBar metrics={currentStep?.metrics} algorithm="knn" />
      <ExplanationPanel step={currentStep} algorithm="knn" />
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

export default KNNViz;