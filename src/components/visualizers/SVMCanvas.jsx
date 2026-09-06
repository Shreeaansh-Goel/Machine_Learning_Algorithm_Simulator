import { useEffect, useRef, useState } from "react";

import { renderSVMCanvas } from "../../utils/renderSVMCanvas";

/**
 * SVM scatter canvas wrapper with boundary overlays.
 * @param {{
 *  step: Record<string, unknown> | null,
 *  width?: number,
 *  height?: number,
 * }} props
 * @returns {JSX.Element}
 */
export const SVMCanvas = ({ step, width = 860, height = 460 }) => {
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
    renderSVMCanvas({
      svgElement: svgRef.current,
      step,
      width,
      height,
      containerWidth,
    });
  }, [step, width, height, containerWidth]);

  return (
    <div ref={wrapperRef} className="h-full w-full rounded-xl bg-white">
      <svg ref={svgRef} className="h-full w-full" role="img" aria-label="svm canvas" />
    </div>
  );
};

export default SVMCanvas;
