import { usePlaybackShortcuts } from "../../hooks/usePlaybackShortcuts";

const SPEED_OPTIONS = [0.5, 1, 2, 5];

const STEP_LABELS = {
  init: "Initializing centroids",
  assign: "Assigning points to centroids",
  update: "Updating centroid positions",
  converged: "Converged",
  check_point: "Checking candidate point",
  count_neighbors: "Counting epsilon neighbors",
  core_point: "Core point discovered",
  border_point: "Border point assigned",
  noise_point: "Noise point identified",
  expand_cluster: "Expanding cluster frontier",
  split: "Splitting node",
  leaf: "Creating leaf node",
  compute_distances: "Computing distances to query",
  sort_distances: "Sorting neighbors by distance",
  select_k: "Selecting nearest neighbors",
  predict: "Predicting class from votes",
  gradient_step: "Applying gradient descent step",
  compute_covariance: "Computing covariance matrix",
  compute_eigenvectors: "Computing principal directions",
  project: "Projecting points onto principal components",
  fit: "Fitting model to data",
  show_margin: "Showing decision boundary and margins",
  show_support_vectors: "Highlighting support vectors",
  done: "Algorithm complete",
};

export const PlayBar = ({
  totalSteps,
  currentStep,
  currentStepIndex,
  isPlaying,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  speed,
  onSpeedChange,
}) => {
  const stepNumber = totalSteps > 0 ? currentStepIndex + 1 : 0;
  const stepText = STEP_LABELS[currentStep?.step_type] || "Ready";
  const isFirst = currentStepIndex <= 0;
  const isLast = totalSteps === 0 || currentStepIndex >= totalSteps - 1;

  usePlaybackShortcuts({
    totalSteps,
    isPlaying,
    onPlay,
    onPause,
    onStepForward,
    onStepBack,
    onReset,
  });

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <progress
        className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-sky-500"
        value={stepNumber}
        max={Math.max(totalSteps, 1)}
      />
      <p className="text-sm text-slate-700">{`Step ${stepNumber} of ${totalSteps} — ${stepText}`}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={isPlaying ? onPause : onPlay} disabled={totalSteps === 0 || (isLast && !isPlaying)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300">{isPlaying ? "Pause" : "Play"}</button>
        <button type="button" onClick={onStepBack} disabled={isFirst || totalSteps === 0} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Step Back</button>
        <button type="button" onClick={onStepForward} disabled={isLast} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Step Forward</button>
        <button type="button" onClick={onReset} disabled={totalSteps === 0} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Reset</button>
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          Speed
          <select value={speed} onChange={(event) => onSpeedChange(Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-2 py-1">
            {SPEED_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}x</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Shortcuts: Space play/pause, ArrowRight step forward, ArrowLeft step back, R reset.
      </p>
    </div>
  );
};

export default PlayBar;
