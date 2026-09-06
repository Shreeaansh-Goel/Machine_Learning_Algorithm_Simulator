import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { useLinearRegressionSteps } from "../../hooks/useLinearRegressionSteps.js";
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
import LinearRegressionCanvas from "./LinearRegressionCanvas.jsx";
import LossCurveChart from "./LossCurveChart.jsx";

const DEFAULT_PARAMS = { learning_rate: 0.01, iterations: 600 };

/**
 * Formats equation coefficients compactly to prevent overflow.
 * @param {number} value
 * @returns {string}
 */
const formatEquationValue = (value) => {
  if (!Number.isFinite(value)) {
    return "0.0000";
  }
  const absValue = Math.abs(value);
  if (absValue >= 1e6 || (absValue > 0 && absValue < 1e-4)) {
    return value.toExponential(2);
  }
  return value.toFixed(4);
};

/**
 * Linear regression visualizer with animated fit line and loss curve playback.
 * @returns {JSX.Element}
 */
export const LinearRegressionViz = () => {
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
    /** @type {{ learning_rate: number, iterations: number }} */ (
      parseAlgorithmParamsFromSearch("linear-regression", DEFAULT_PARAMS, searchParams)
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
    setAlgorithmName("linear-regression");
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

  useLinearRegressionSteps({ datasetPoints, params, setSteps, setPlaying, setLoading, setError });
  usePlayback({ isPlaying, speed, currentStepIndex, totalSteps: steps.length, nextStep, setPlaying });

  const currentStep = steps[currentStepIndex] ?? null;
  const previousStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;
  const weight = Number(currentStep?.metrics?.weight ?? 0);
  const bias = Number(currentStep?.metrics?.bias ?? 0);
  const currentPoints = currentStep?.points ?? [];
  const xValues = currentPoints
    .map((point) => Number(point?.x))
    .filter((value) => Number.isFinite(value));
  const minVisibleX = xValues.length > 0 ? Math.min(...xValues) : null;
  const valueAtMinVisibleX =
    minVisibleX === null ? null : (weight * minVisibleX) + bias;
  const linePoints = /** @type {Array<{ x: number, y: number }>} */ (currentStep?.metrics?.line_points ?? []);
  const previousLinePoints = /** @type {Array<{ x: number, y: number }>} */ (previousStep?.metrics?.line_points ?? []);

  return (
    <div className="space-y-4">
      <ParamPanel algorithm="linear-regression" params={params} onChange={setParams} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
        <div className="h-[420px] rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <CanvasLoadingState algorithmLabel="Linear Regression" />
          ) : currentStep ? (
            <LinearRegressionCanvas
              points={currentStep.points ?? []}
              previousPoints={previousStep?.points ?? []}
              linePoints={linePoints}
              previousLinePoints={previousLinePoints}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Load data to run Linear Regression.</div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
          <p>Current equation: y = {formatEquationValue(weight)}x + {formatEquationValue(bias)}</p>
          <p className="mt-1 text-xs text-slate-500">
            y-intercept at x = 0 is {formatEquationValue(bias)}
            {minVisibleX === null || valueAtMinVisibleX === null
              ? ""
              : `; at chart start x = ${minVisibleX.toFixed(2)}, y = ${formatEquationValue(valueAtMinVisibleX)}`}
          </p>
        </div>
        <div className="h-[180px] rounded-xl border border-slate-200 bg-white p-1">
          <LossCurveChart steps={steps} currentStepIndex={currentStepIndex} />
        </div>
      </div>
      <MetricsBar metrics={currentStep?.metrics} algorithm="linear-regression" />
      <ExplanationPanel step={currentStep} algorithm="linear-regression" />
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

export default LinearRegressionViz;