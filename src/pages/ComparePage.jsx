import CompareColumnPanel from "../components/panels/CompareColumnPanel.jsx";
import CompareMetricsTable from "../components/panels/CompareMetricsTable.jsx";
import DatasetPanel from "../components/panels/DatasetPanel.jsx";
import MetricsBar from "../components/panels/MetricsBar.jsx";
import PlayBar from "../components/shared/PlayBar.jsx";
import { useComparePageState } from "../hooks/useComparePageState";

/**
 * Compare mode page with synced dual-algorithm playback.
 * @returns {JSX.Element}
 */
export const ComparePage = () => {
  const {
    algorithmA,
    algorithmB,
    loadingA,
    loadingB,
    errorA,
    errorB,
    currentIndexA,
    currentIndexB,
    currentStepA,
    currentStepB,
    previousStepA,
    previousStepB,
    finalMetricsA,
    finalMetricsB,
    playbarStep,
    currentMaxStepIndex,
    maxSteps,
    isPlaying,
    speed,
    handleAlgorithmChange,
    handleParamsChange,
    handlePlay,
    handlePause,
    handleStepForward,
    handleStepBack,
    handleReset,
    handleSpeedChange,
  } = useComparePageState();

  return (
    <div className="space-y-6">
      <DatasetPanel />
      <section className="grid gap-4 xl:grid-cols-2">
        <CompareColumnPanel
          title="Algorithm A"
          algorithmName={algorithmA.name}
          params={algorithmA.params}
          totalSteps={algorithmA.steps.length}
          currentStepIndex={currentIndexA}
          currentStep={currentStepA}
          previousStep={previousStepA}
          loading={loadingA}
          error={errorA}
          onAlgorithmChange={(name) => handleAlgorithmChange("A", name)}
          onParamsChange={(nextParams) => handleParamsChange("A", nextParams)}
        />
        <CompareColumnPanel
          title="Algorithm B"
          algorithmName={algorithmB.name}
          params={algorithmB.params}
          totalSteps={algorithmB.steps.length}
          currentStepIndex={currentIndexB}
          currentStep={currentStepB}
          previousStep={previousStepB}
          loading={loadingB}
          error={errorB}
          onAlgorithmChange={(name) => handleAlgorithmChange("B", name)}
          onParamsChange={(nextParams) => handleParamsChange("B", nextParams)}
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <MetricsBar metrics={currentStepA?.metrics} algorithm={algorithmA.name} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <MetricsBar metrics={currentStepB?.metrics} algorithm={algorithmB.name} />
        </div>
      </section>
      <CompareMetricsTable
        algorithmAName={algorithmA.name}
        algorithmBName={algorithmB.name}
        metricsA={finalMetricsA}
        metricsB={finalMetricsB}
      />
      <PlayBar
        totalSteps={maxSteps}
        currentStep={playbarStep}
        currentStepIndex={currentMaxStepIndex}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onStepForward={handleStepForward}
        onStepBack={handleStepBack}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={handleSpeedChange}
      />
    </div>
  );
};

export default ComparePage;
