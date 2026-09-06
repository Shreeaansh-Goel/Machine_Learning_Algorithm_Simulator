import { useEffect, useRef, useState } from "react";
import { renderScatterPlot } from "../../utils/renderScatterPlot";

/**
 * Scatter plot component powered by D3 in React.
 * @param {{
 *  points: Array<Record<string, unknown>>,
 *  width?: number,
 *  height?: number,
 *  colorFn: (point: Record<string, unknown>) => string,
 *  pointStrokeFn?: (point: Record<string, unknown>) => string,
 *  pointStrokeWidthFn?: (point: Record<string, unknown>) => number,
 *  showAssignmentLines?: boolean,
 *  animateCentroids?: boolean,
 *  previousPoints?: Array<Record<string, unknown>>,
 *  showNeighborhoodOverlay?: boolean,
 *  neighborhoodOverlay?: {
 *    center: { x: number, y: number },
 *    eps: number,
 *    metric: "euclidean" | "manhattan",
 *  } | null,
 *  onPointClick?: ((point: Record<string, unknown>) => void) | null,
 * }} props
 * @returns {JSX.Element}
 */
export const ScatterPlot = ({
  points,
  width = 760,
  height = 460,
  colorFn,
  pointStrokeFn = undefined,
  pointStrokeWidthFn = undefined,
  showAssignmentLines = false,
  animateCentroids = false,
  previousPoints = [],
  showNeighborhoodOverlay = false,
  neighborhoodOverlay = null,
  onPointClick = null,
}) => {
  const wrapperRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const svgRef = useRef(/** @type {SVGSVGElement | null} */ (null));
  const [containerWidth, setContainerWidth] = useState(width);

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect?.width) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }
    renderScatterPlot({
      svgElement: svgRef.current,
      points,
      previousPoints,
      width,
      height,
      containerWidth,
      colorFn,
      pointStrokeFn,
      pointStrokeWidthFn,
      showAssignmentLines,
      animateCentroids,
      showNeighborhoodOverlay,
      neighborhoodOverlay,
      onPointClick,
    });
  }, [
    points,
    previousPoints,
    width,
    height,
    containerWidth,
    colorFn,
    pointStrokeFn,
    pointStrokeWidthFn,
    showAssignmentLines,
    animateCentroids,
    showNeighborhoodOverlay,
    neighborhoodOverlay,
    onPointClick,
  ]);

  return (
    <div ref={wrapperRef} className="h-full w-full rounded-xl bg-white">
      <svg ref={svgRef} className="h-full w-full" role="img" aria-label="scatter plot" />
    </div>
  );
};

export default ScatterPlot;
