import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDecisionTreeSteps } from "../../hooks/useDecisionTreeSteps.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import { useAlgorithmStore } from "../../store/algorithmStore.js";
import { useDatasetStore } from "../../store/datasetStore.js";
import {
  parseAlgorithmParamsFromSearch,
  parseStepIndexFromSearch,
} from "../../utils/shareUrl.js";
import ExplanationPanel from "../panels/ExplanationPanel.jsx";
import MetricsBar from "../panels/MetricsBar.jsx";
import CanvasLoadingState from "../shared/CanvasLoadingState.jsx";
import PlayBar from "../shared/PlayBar.jsx";
import DecisionTreeCanvas from "./DecisionTreeCanvas.jsx";
import DecisionTreeDiagram from "./DecisionTreeDiagram.jsx";
import DecisionTreeParams from "./DecisionTreeParams.jsx";

const DEFAULT_PARAMS = { max_depth: 5, criterion: "gini", min_samples_split: 2 };

/**
 * Decision Tree visualizer with side-by-side scatter and tree diagram.
 * @returns {JSX.Element}
 */
export const DecisionTreeViz = () => {
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
    /** @type {{ max_depth: number, criterion: "gini" | "entropy", min_samples_split: number }} */ (
      parseAlgorithmParamsFromSearch("decision-tree", DEFAULT_PARAMS, searchParams)
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
    setAlgorithmName("decision-tree");
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

  useDecisionTreeSteps({ datasetPoints, params, setSteps, setPlaying, setLoading, setError });
  usePlayback({ isPlaying, speed, currentStepIndex, totalSteps: steps.length, nextStep, setPlaying });

  const currentStep = steps[currentStepIndex] ?? null;

  return (
    <div className="space-y-4">
      <DecisionTreeParams params={params} onChange={setParams} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="h-[540px] rounded-xl border border-slate-200 bg-slate-50 p-2">
          {loading ? (
            <CanvasLoadingState algorithmLabel="Decision Tree" />
          ) : (
            <DecisionTreeCanvas step={currentStep} />
          )}
        </section>
        <section className="h-[540px] rounded-xl border border-slate-200 bg-slate-50 p-2">
          <DecisionTreeDiagram
            tree={currentStep?.tree_structure ?? null}
            currentNodeId={currentStep?.current_node_id ?? null}
          />
        </section>
      </div>
      <MetricsBar metrics={currentStep?.metrics} algorithm="decision-tree" />
      <ExplanationPanel step={currentStep} algorithm="decision-tree" />
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

export default DecisionTreeViz;
