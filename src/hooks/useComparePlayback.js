import { useEffect } from "react";

import { getProgressStepSize } from "../utils/compareUtils";

/**
 * Drives shared compare playback using synced percentage progress.
 * @param {{
 *  isPlaying: boolean,
 *  speed: number,
 *  maxSteps: number,
 *  syncedProgress: number,
 *  setSyncedProgress: (progress: number) => void,
 *  setPlaying: (playing: boolean) => void,
 * }} options
 * @returns {void}
 */
export const useComparePlayback = ({
  isPlaying,
  speed,
  maxSteps,
  syncedProgress,
  setSyncedProgress,
  setPlaying,
}) => {
  useEffect(() => {
    if (!isPlaying || maxSteps <= 1) {
      return;
    }

    if (syncedProgress >= 1) {
      setPlaying(false);
      return;
    }

    const stepSize = getProgressStepSize(maxSteps);
    const intervalMs = Math.max(40, 1000 / Math.max(speed, 0.1));
    const timerId = window.setInterval(() => {
      setSyncedProgress(Math.min(1, syncedProgress + stepSize));
    }, intervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [
    isPlaying,
    speed,
    maxSteps,
    syncedProgress,
    setSyncedProgress,
    setPlaying,
  ]);
};

export default useComparePlayback;
