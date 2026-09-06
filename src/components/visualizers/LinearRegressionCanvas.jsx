import { useEffect, useRef, useState } from "react";

import { renderLinearRegressionCanvas } from "../../utils/renderLinearRegressionCanvas";

/**
 * Linear regression scatter canvas with line and residual overlays.
 * @param {{
 *  points: Array<Record<string, unknown>>,
 *  previousPoints?: Array<Record<string, unknown>>,
 *  linePoints: Array<{ x: number, y: number }>,
 *  previousLinePoints?: Array<{ x: number, y: number }>,
 *  width?: number,
 *  height?: number,
 * }} props
 * @returns {JSX.Element}
 */
export const LinearRegressionCanvas = ({
  points,
  previousPoints = [],
  linePoints,
  previousLinePoints = [],
  width = 840,
  height = 420,
}) => {
  const wrapperRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const svgRef = useRef(/** @type {SVGSVGElement | null} */ (null));
  const [containerWidth, setContainerWidth] = useState(width);

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
    renderLinearRegressionCanvas({
      svgElement: svgRef.current,
      points,
      previousPoints,
      linePoints,
      previousLinePoints,
      width,
      height,
      containerWidth,
    });
  }, [points, previousPoints, linePoints, previousLinePoints, width, height, containerWidth]);

  return (
    <div ref={wrapperRef} className="h-full w-full rounded-xl bg-white">
      <svg ref={svgRef} className="h-full w-full" role="img" aria-label="Linear regression canvas" />
    </div>
  );
};

export default LinearRegressionCanvas;