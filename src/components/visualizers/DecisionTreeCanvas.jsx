import { useEffect, useRef } from "react";

import { renderDecisionTreeCanvas } from "../../utils/renderDecisionTreeCanvas";

/**
 * Decision Tree scatter canvas with region shading and split boundaries.
 * @param {{
 *  step: Record<string, any> | null,
 *  width?: number,
 *  height?: number,
 * }} props
 * @returns {JSX.Element}
 */
export const DecisionTreeCanvas = ({ step, width = 780, height = 500 }) => {
  const svgRef = useRef(/** @type {SVGSVGElement | null} */ (null));

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }
    renderDecisionTreeCanvas({
      svgElement: svgRef.current,
      step,
      width,
      height,
    });
  }, [step, width, height]);

  if (!step) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Run Decision Tree to see split boundaries.
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg bg-white">
      <svg
        ref={svgRef}
        className="h-full w-full"
        role="img"
        aria-label="decision tree scatter"
      />
    </div>
  );
};

export default DecisionTreeCanvas;
