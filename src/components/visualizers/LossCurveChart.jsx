import { useEffect, useMemo, useRef, useState } from "react";

import { renderLossCurve } from "../../utils/renderLossCurve";

/**
 * Compact loss-curve chart synced to playback index.
 * @param {{
 *  steps: Array<Record<string, unknown>>,
 *  currentStepIndex: number,
 *  width?: number,
 *  height?: number,
 * }} props
 * @returns {JSX.Element}
 */
export const LossCurveChart = ({
  steps,
  currentStepIndex,
  width = 840,
  height = 180,
}) => {
  const wrapperRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const svgRef = useRef(/** @type {SVGSVGElement | null} */ (null));
  const [containerWidth, setContainerWidth] = useState(width);
  const losses = useMemo(
    () =>
      steps
        .map((step) => Number(step?.metrics?.loss))
        .filter((value) => Number.isFinite(value)),
    [steps]
  );

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect?.width;
      if (nextWidth) {
        setContainerWidth(nextWidth);
      }
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }
    renderLossCurve({
      svgElement: svgRef.current,
      losses,
      currentIndex: currentStepIndex,
      width,
      height,
      containerWidth,
    });
  }, [losses, currentStepIndex, width, height, containerWidth]);

  return (
    <div ref={wrapperRef} className="h-full w-full rounded-xl bg-white">
      <svg ref={svgRef} className="h-full w-full" role="img" aria-label="Loss curve chart" />
    </div>
  );
};

export default LossCurveChart;