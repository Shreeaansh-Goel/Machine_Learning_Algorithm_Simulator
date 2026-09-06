import { useEffect, useRef, useState } from "react";

import { renderKNNCanvas } from "../../utils/renderKNNCanvas";

/**
 * KNN visualization canvas with click-to-place query point interaction.
 * @param {{
 *  points: Array<Record<string, unknown>>,
 *  onSetQuery?: (query: { x: number, y: number }) => void,
 *  width?: number,
 *  height?: number,
 * }} props
 * @returns {JSX.Element}
 */
export const KNNCanvas = ({
  points,
  onSetQuery,
  width = 840,
  height = 460,
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
    renderKNNCanvas({
      svgElement: svgRef.current,
      points,
      width,
      height,
      containerWidth,
      onSetQuery,
    });
  }, [points, width, height, containerWidth, onSetQuery]);

  return (
    <div ref={wrapperRef} className="h-full w-full rounded-xl bg-white">
      <svg ref={svgRef} className="h-full w-full" role="img" aria-label="KNN canvas" />
    </div>
  );
};

export default KNNCanvas;