import { useEffect, useRef, useState } from "react";

import { renderPCACanvas } from "../../utils/renderPCACanvas";

/**
 * PCA dual scatter canvas wrapper.
 * @param {{
 *  step: Record<string, unknown> | null,
 *  width?: number,
 *  height?: number,
 * }} props
 * @returns {JSX.Element}
 */
export const PCACanvas = ({ step, width = 920, height = 420 }) => {
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
    renderPCACanvas({
      svgElement: svgRef.current,
      step,
      width,
      height,
      containerWidth,
    });
  }, [step, width, height, containerWidth]);

  return (
    <div ref={wrapperRef} className="h-full w-full rounded-xl bg-white">
      <svg ref={svgRef} className="h-full w-full" role="img" aria-label="pca canvas" />
    </div>
  );
};

export default PCACanvas;
