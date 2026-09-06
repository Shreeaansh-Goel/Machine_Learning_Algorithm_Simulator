import { create } from "zustand";

import { getDefaultAlgorithmParams } from "../utils/compareUtils";

/**
 * @typedef {{
 *  name: "kmeans" | "dbscan" | "decision-tree" | "knn" | "linear-regression",
 *  params: Record<string, unknown>,
 *  steps: Array<Record<string, unknown>>,
 *  visualizerProps: Record<string, unknown>,
 * }} CompareAlgorithmState
 */

/**
 * @typedef {Object} CompareState
 * @property {CompareAlgorithmState} algorithmA
 * @property {CompareAlgorithmState} algorithmB
 * @property {number} syncedProgress
 * @property {boolean} isPlaying
 * @property {number} speed
 * @property {(algorithm: Partial<CompareAlgorithmState>) => void} setAlgorithmA
 * @property {(algorithm: Partial<CompareAlgorithmState>) => void} setAlgorithmB
 * @property {(progress: number) => void} setSyncedProgress
 * @property {(playing: boolean) => void} setPlaying
 * @property {(speed: number) => void} setSpeed
 * @property {() => void} reset
 */

/**
 * Clamps progress into [0, 1] for percentage-based syncing.
 * @param {number} value
 * @returns {number}
 */
const clampProgress = (value) => Math.max(0, Math.min(1, Number(value) || 0));

/**
 * Clamps playback speed to supported compare playbar range.
 * @param {number} value
 * @returns {number}
 */
const clampSpeed = (value) => Math.max(0.5, Math.min(5, Number(value) || 1));

/**
 * Builds a complete algorithm state from partial updates.
 * @param {Partial<CompareAlgorithmState>} next
 * @param {CompareAlgorithmState} current
 * @returns {CompareAlgorithmState}
 */
const mergeAlgorithmState = (next, current) => {
  const resolvedName = /** @type {CompareAlgorithmState["name"]} */ (next.name || current.name);
  return {
    name: resolvedName,
    params: next.params ?? current.params,
    steps: next.steps ?? current.steps,
    visualizerProps: next.visualizerProps ?? current.visualizerProps,
  };
};

/**
 * Creates default algorithm state for one compare column.
 * @param {CompareAlgorithmState["name"]} name
 * @returns {CompareAlgorithmState}
 */
const createDefaultAlgorithmState = (name) => ({
  name,
  params: getDefaultAlgorithmParams(name),
  steps: [],
  visualizerProps: {},
});

/**
 * Creates Zustand compare state with synchronized playback controls.
 * @param {(updater: Partial<CompareState> | ((state: CompareState) => Partial<CompareState>)) => void} set
 * @returns {CompareState}
 */
const createCompareStore = (set) => ({
  algorithmA: createDefaultAlgorithmState("kmeans"),
  algorithmB: createDefaultAlgorithmState("dbscan"),
  syncedProgress: 0,
  isPlaying: false,
  speed: 1,
  setAlgorithmA: (algorithm) =>
    set((state) => ({
      algorithmA: mergeAlgorithmState(algorithm, state.algorithmA),
    })),
  setAlgorithmB: (algorithm) =>
    set((state) => ({
      algorithmB: mergeAlgorithmState(algorithm, state.algorithmB),
    })),
  setSyncedProgress: (progress) => set({ syncedProgress: clampProgress(progress) }),
  setPlaying: (playing) => set({ isPlaying: Boolean(playing) }),
  setSpeed: (speed) => set({ speed: clampSpeed(speed) }),
  reset: () => set({ syncedProgress: 0, isPlaying: false }),
});

export const useCompareStore = create(createCompareStore);

export default useCompareStore;
