import ScatterPlot from "../shared/ScatterPlot.jsx";
import { buildDrawingPoints, getDrawingPointColor } from "../../utils/quizUtils";

/**
 * Quiz stage 2: optional point grouping with click-to-assign behavior.
 * @param {{
 *  points: Array<{ point_index: number, x: number, y: number }>,
 *  pointAssignments: Record<number, number | null>,
 *  onAssignPoint: (point: { point_index: number }) => void,
 * }} props
 * @returns {JSX.Element}
 */
export const QuizDrawingStage = ({ points, pointAssignments, onAssignPoint }) => {
  const drawingPoints = buildDrawingPoints(points, pointAssignments);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-700">
        Optional: click points to assign clusters. You can skip and reveal directly anytime.
      </p>
      <div className="h-[430px] rounded-xl border border-slate-200 bg-slate-50">
        <ScatterPlot
          points={drawingPoints}
          width={820}
          height={430}
          colorFn={(point) => getDrawingPointColor(point, pointAssignments)}
          onPointClick={onAssignPoint}
        />
      </div>
    </div>
  );
};

export default QuizDrawingStage;
