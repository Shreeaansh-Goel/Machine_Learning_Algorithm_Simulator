import { useEffect, useRef, useState } from "react";

/**
 * Animates numeric values from previous to next over a fixed duration.
 * @param {number | null | undefined} value
 * @param {number} duration
 * @returns {number | null}
 */
export const useCountAnimation = (value, duration = 300) => {
  const [animatedValue, setAnimatedValue] = useState(
    typeof value === "number" && Number.isFinite(value) ? value : null
  );
  const previousValueRef = useRef(
    typeof value === "number" && Number.isFinite(value) ? value : null
  );

  useEffect(() => {
    const target =
      typeof value === "number" && Number.isFinite(value) ? value : null;

    if (target === null) {
      previousValueRef.current = null;
      setAnimatedValue(null);
      return;
    }

    const startValue = previousValueRef.current ?? target;
    previousValueRef.current = target;
    const targetIsInteger = target % 1 === 0;

    if (Math.abs(target - startValue) < 1e-9 || duration <= 0) {
      setAnimatedValue(target);
      return;
    }

    let frameId = 0;
    const startTime = performance.now();
    const tick = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const nextValue = startValue + (target - startValue) * eased;
      setAnimatedValue(targetIsInteger ? Math.round(nextValue) : nextValue);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, value]);

  return animatedValue;
};

export default useCountAnimation;