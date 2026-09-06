import { useEffect } from "react";

/**
 * Checks whether keyboard focus is inside text input controls.
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
};

/**
 * Enables playback keyboard shortcuts for visualizer controls.
 * @param {{
 *  totalSteps: number,
 *  isPlaying: boolean,
 *  onPlay: () => void,
 *  onPause: () => void,
 *  onStepForward: () => void,
 *  onStepBack: () => void,
 *  onReset: () => void,
 * }} options
 */
export const usePlaybackShortcuts = ({
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
}) => {
  useEffect(() => {
    /**
     * Handles global keyboard shortcuts for playback controls.
     * @param {KeyboardEvent} event
     */
    const handleKeyDown = (event) => {
      if (isTypingTarget(event.target) || totalSteps === 0) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        if (isPlaying) {
          onPause();
        } else {
          onPlay();
        }
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        onStepForward();
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        onStepBack();
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        onReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isPlaying,
    onPause,
    onPlay,
    onReset,
    onStepBack,
    onStepForward,
    totalSteps,
  ]);
};

export default usePlaybackShortcuts;
