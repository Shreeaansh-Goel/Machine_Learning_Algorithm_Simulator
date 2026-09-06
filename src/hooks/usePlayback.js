import { useEffect } from "react";

/**
 * Drives algorithm playback while play mode is enabled.
 * @param {{
 *  isPlaying: boolean,
 *  speed: number,
 *  currentStepIndex: number,
 *  totalSteps: number,
 *  nextStep: () => void,
 *  setPlaying: (playing: boolean) => void,
 * }} options
 */
export const usePlayback = ({
  isPlaying,
  speed,
  currentStepIndex,
  totalSteps,
  nextStep,
  setPlaying,
}) => {
  useEffect(() => {
    if (!isPlaying || totalSteps <= 0) {
      return;
    }
    if (currentStepIndex >= totalSteps - 1) {
      setPlaying(false);
      return;
    }

    const intervalMs = Math.max(40, 1000 / Math.max(speed, 0.1));
    const timerId = window.setInterval(() => {
      nextStep();
    }, intervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [
    isPlaying,
    speed,
    currentStepIndex,
    totalSteps,
    nextStep,
    setPlaying,
  ]);
};

export default usePlayback;
