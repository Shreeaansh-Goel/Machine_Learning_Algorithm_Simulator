import { useCallback, useEffect, useState } from "react";

import { getSampleDatasets } from "../api/client";
import { useCompareAlgorithmSteps } from "./useCompareAlgorithmSteps";
import { useComparePlayback } from "./useComparePlayback";
import { useCompareStore } from "../store/compareStore";
import { useDatasetStore } from "../store/datasetStore";
import {
  getDefaultAlgorithmParams,
  getProgressStepSize,
  getStepAtProgress,
  getStepIndexFromProgress,
} from "../utils/compareUtils";

/**
 * Manages compare page orchestration: data loading, step fetching, and synced playback.
 * @returns {{
 *  algorithmA: { name: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression", params: Record<string, unknown>, steps: Array<Record<string, unknown>> },
 *  algorithmB: { name: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression", params: Record<string, unknown>, steps: Array<Record<string, unknown>> },
 *  loadingA: boolean,
 *  loadingB: boolean,
 *  errorA: string,
 *  errorB: string,
 *  currentIndexA: number,
 *  currentIndexB: number,
 *  currentStepA: Record<string, unknown> | null,
 *  currentStepB: Record<string, unknown> | null,
 *  previousStepA: Record<string, unknown> | null,
 *  previousStepB: Record<string, unknown> | null,
 *  finalMetricsA: Record<string, unknown>,
 *  finalMetricsB: Record<string, unknown>,
 *  playbarStep: Record<string, unknown> | null,
 *  currentMaxStepIndex: number,
 *  maxSteps: number,
 *  isPlaying: boolean,
 *  speed: number,
 *  handleAlgorithmChange: (side: "A" | "B", name: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression") => void,
 *  handleParamsChange: (side: "A" | "B", nextParams: Record<string, unknown>) => void,
 *  handlePlay: () => void,
 *  handlePause: () => void,
 *  handleStepForward: () => void,
 *  handleStepBack: () => void,
 *  handleReset: () => void,
 *  handleSpeedChange: (speed: number) => void,
 * }}
 */
export const useComparePageState = () => {
  const points = useDatasetStore((state) => state.points);
  const setDataset = useDatasetStore((state) => state.setDataset);
  const setColumns = useDatasetStore((state) => state.setColumns);
  const algorithmA = useCompareStore((state) => state.algorithmA);
  const algorithmB = useCompareStore((state) => state.algorithmB);
  const syncedProgress = useCompareStore((state) => state.syncedProgress);
  const isPlaying = useCompareStore((state) => state.isPlaying);
  const speed = useCompareStore((state) => state.speed);
  const setAlgorithmA = useCompareStore((state) => state.setAlgorithmA);
  const setAlgorithmB = useCompareStore((state) => state.setAlgorithmB);
  const setSyncedProgress = useCompareStore((state) => state.setSyncedProgress);
  const setPlaying = useCompareStore((state) => state.setPlaying);
  const setSpeed = useCompareStore((state) => state.setSpeed);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState("");
  const [errorB, setErrorB] = useState("");

  const setStepsA = useCallback((steps) => setAlgorithmA({ steps }), [setAlgorithmA]);
  const setStepsB = useCallback((steps) => setAlgorithmB({ steps }), [setAlgorithmB]);

  useEffect(() => {
    let cancelled = false;

    /**
     * Loads Moons by default so compare mode starts with a meaningful demo.
     * @returns {Promise<void>}
     */
    const loadDefaultMoons = async () => {
      if (points.length > 0) {
        return;
      }

      try {
        const response = await getSampleDatasets();
        const moons = Array.isArray(response.data?.moons) ? response.data.moons : [];
        if (!cancelled && moons.length > 0) {
          setDataset(moons, "Moons", "builtin");
          setColumns("x", "y");
        }
      } catch (error) {
        console.error("[ComparePage] failed to load default moons dataset", error);
      }
    };

    loadDefaultMoons();
    return () => {
      cancelled = true;
    };
  }, [points.length, setColumns, setDataset]);

  useCompareAlgorithmSteps({
    datasetPoints: points,
    algorithmName: algorithmA.name,
    params: algorithmA.params,
    setSteps: setStepsA,
    setLoading: setLoadingA,
    setError: setErrorA,
    setPlaying,
    setSyncedProgress,
  });

  useCompareAlgorithmSteps({
    datasetPoints: points,
    algorithmName: algorithmB.name,
    params: algorithmB.params,
    setSteps: setStepsB,
    setLoading: setLoadingB,
    setError: setErrorB,
    setPlaying,
    setSyncedProgress,
  });

  const stepsA = algorithmA.steps;
  const stepsB = algorithmB.steps;
  const maxSteps = Math.max(stepsA.length, stepsB.length, 0);
  const currentIndexA = getStepIndexFromProgress(stepsA.length, syncedProgress);
  const currentIndexB = getStepIndexFromProgress(stepsB.length, syncedProgress);
  const currentStepA = getStepAtProgress(stepsA, syncedProgress);
  const currentStepB = getStepAtProgress(stepsB, syncedProgress);
  const previousStepA = stepsA[Math.max(currentIndexA - 1, 0)] ?? null;
  const previousStepB = stepsB[Math.max(currentIndexB - 1, 0)] ?? null;
  const referenceSteps = stepsA.length >= stepsB.length ? stepsA : stepsB;
  const playbarStep = getStepAtProgress(referenceSteps, syncedProgress);
  const currentMaxStepIndex = getStepIndexFromProgress(maxSteps, syncedProgress);

  useComparePlayback({
    isPlaying,
    speed,
    maxSteps,
    syncedProgress,
    setSyncedProgress,
    setPlaying,
  });

  /**
   * Nudges synced progress by one shared step.
   * @param {number} direction
   * @returns {void}
   */
  const nudgeProgress = useCallback(
    (direction) => {
      const stepSize = getProgressStepSize(maxSteps);
      setSyncedProgress(syncedProgress + direction * stepSize);
    },
    [maxSteps, setSyncedProgress, syncedProgress]
  );

  /**
   * Switches one compare column algorithm and resets playback.
   * @param {"A" | "B"} side
    * @param {"kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression"} name
   * @returns {void}
   */
  const handleAlgorithmChange = useCallback(
    (side, name) => {
      const update = {
        name,
        params: getDefaultAlgorithmParams(name),
        steps: [],
        visualizerProps: {},
      };
      if (side === "A") {
        setAlgorithmA(update);
      } else {
        setAlgorithmB(update);
      }
      setPlaying(false);
      setSyncedProgress(0);
    },
    [setAlgorithmA, setAlgorithmB, setPlaying, setSyncedProgress]
  );

  /**
   * Updates one column's params and restarts synced progress.
   * @param {"A" | "B"} side
   * @param {Record<string, unknown>} nextParams
   * @returns {void}
   */
  const handleParamsChange = useCallback(
    (side, nextParams) => {
      if (side === "A") {
        setAlgorithmA({ params: nextParams });
      } else {
        setAlgorithmB({ params: nextParams });
      }
      setPlaying(false);
      setSyncedProgress(0);
    },
    [setAlgorithmA, setAlgorithmB, setPlaying, setSyncedProgress]
  );

  return {
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
    finalMetricsA: stepsA[stepsA.length - 1]?.metrics ?? {},
    finalMetricsB: stepsB[stepsB.length - 1]?.metrics ?? {},
    playbarStep,
    currentMaxStepIndex,
    maxSteps,
    isPlaying,
    speed,
    handleAlgorithmChange,
    handleParamsChange,
    handlePlay: () => setPlaying(true),
    handlePause: () => setPlaying(false),
    handleStepForward: () => nudgeProgress(1),
    handleStepBack: () => nudgeProgress(-1),
    handleReset: () => {
      setPlaying(false);
      setSyncedProgress(0);
    },
    handleSpeedChange: setSpeed,
  };
};

export default useComparePageState;
