import { create } from "zustand";

/**
 * @typedef {{
 *  step_index: number,
 *  step_type: string,
 *  description: string,
 *  highlight: string,
 *  points: Array<Record<string, unknown>>,
 *  metrics: Record<string, unknown>,
 * }} AlgorithmStep
 */

/**
 * @typedef {Object} AlgorithmState
 * @property {AlgorithmStep[]} steps
 * @property {number} currentStepIndex
 * @property {boolean} isPlaying
 * @property {number} speed
 * @property {string} algorithmName
 * @property {Record<string, unknown>} currentParams
 * @property {(steps: AlgorithmStep[], algorithmName?: string) => void} setSteps
 * @property {(algorithmName: string) => void} setAlgorithmName
 * @property {(params: Record<string, unknown>) => void} setCurrentParams
 * @property {(index: number) => void} setCurrentStepIndex
 * @property {() => void} nextStep
 * @property {() => void} prevStep
 * @property {(playing: boolean) => void} setPlaying
 * @property {(speed: number) => void} setSpeed
 * @property {() => void} reset
 */

/**
 * Creates algorithm playback state and controls.
 * @param {(updater: Partial<AlgorithmState> | ((state: AlgorithmState) => Partial<AlgorithmState>)) => void} set
 * @returns {AlgorithmState}
 */
const createAlgorithmStore = (set) => ({
  steps: [],
  currentStepIndex: 0,
  isPlaying: false,
  speed: 1,
  algorithmName: "k-means",
  currentParams: {},
  setSteps: (steps, algorithmName = undefined) =>
    set((state) => ({
      steps,
      currentStepIndex: 0,
      isPlaying: false,
      algorithmName: algorithmName || state.algorithmName,
    })),
  setAlgorithmName: (algorithmName) => set({ algorithmName }),
  setCurrentParams: (currentParams) => set({ currentParams }),
  setCurrentStepIndex: (index) =>
    set((state) => ({
      currentStepIndex: Math.min(
        Math.max(Number(index) || 0, 0),
        Math.max(state.steps.length - 1, 0)
      ),
    })),
  nextStep: () =>
    set((state) => ({
      currentStepIndex: Math.min(
        state.currentStepIndex + 1,
        Math.max(state.steps.length - 1, 0)
      ),
    })),
  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
    })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setSpeed: (speed) => set({ speed }),
  reset: () => set({ currentStepIndex: 0, isPlaying: false }),
});

export const useAlgorithmStore = create(createAlgorithmStore);

export default useAlgorithmStore;
