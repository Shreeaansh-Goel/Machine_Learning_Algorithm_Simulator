import * as d3 from "d3";

import {
  expandDomain,
  getAssignmentSegments,
  getCentroidMarkerPath,
  splitScatterPoints,
} from "./scatterPlotUtils";

const OVERLAY_STROKE_COLOR = "#534AB7";

/**
 * Draws epsilon neighborhood overlay for DBSCAN check/count steps.
 * @param {{
 *  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
 *  xScale: d3.ScaleLinear<number, number>,
 *  yScale: d3.ScaleLinear<number, number>,
 *  overlay: {
 *    center: { x: number, y: number },
 *    eps: number,
 *    metric: "euclidean" | "manhattan",
 *  },
 * }} options
 */
const drawNeighborhoodOverlay = ({ svg, xScale, yScale, overlay }) => {
  if (!overlay?.center) {
    return;
  }

  const centerX = Number(overlay.center.x);
  const centerY = Number(overlay.center.y);
  const eps = Math.max(Number(overlay.eps), 0);
  const overlayGroup = svg.append("g");

  if (overlay.metric === "manhattan") {
    const vertices = [
      [xScale(centerX + eps), yScale(centerY)],
      [xScale(centerX), yScale(centerY + eps)],
      [xScale(centerX - eps), yScale(centerY)],
      [xScale(centerX), yScale(centerY - eps)],
    ];
    const polygonPoints = vertices.map((vertex) => `${vertex[0]},${vertex[1]}`).join(" ");

    overlayGroup
      .append("polygon")
      .attr("points", polygonPoints)
      .attr("fill", OVERLAY_STROKE_COLOR)
      .attr("fill-opacity", 0)
      .attr("stroke", OVERLAY_STROKE_COLOR)
      .attr("stroke-width", 1.6)
      .attr("stroke-dasharray", "6 4")
      .attr("stroke-opacity", 0)
      .transition()
      .duration(300)
      .attr("fill-opacity", 0.12)
      .attr("stroke-opacity", 0.9);
    return;
  }

  const pixelRadius = Math.abs(xScale(eps) - xScale(0));
  overlayGroup
    .append("circle")
    .attr("cx", xScale(centerX))
    .attr("cy", yScale(centerY))
    .attr("r", pixelRadius)
    .attr("fill", OVERLAY_STROKE_COLOR)
    .attr("fill-opacity", 0)
    .attr("stroke", OVERLAY_STROKE_COLOR)
    .attr("stroke-width", 1.6)
    .attr("stroke-dasharray", "6 4")
    .attr("stroke-opacity", 0)
    .transition()
    .duration(300)
    .attr("fill-opacity", 0.12)
    .attr("stroke-opacity", 0.9);
};

/**
 * Renders scatter points, assignment lines, and centroid markers.
 * @param {{
 *  svgElement: SVGSVGElement,
 *  points: Array<Record<string, unknown>>,
 *  previousPoints: Array<Record<string, unknown>>,
 *  width: number,
 *  height: number,
 *  containerWidth: number,
 *  colorFn: (point: Record<string, unknown>) => string,
 *  pointStrokeFn?: (point: Record<string, unknown>) => string,
 *  pointStrokeWidthFn?: (point: Record<string, unknown>) => number,
 *  showAssignmentLines: boolean,
 *  animateCentroids: boolean,
 *  showNeighborhoodOverlay?: boolean,
 *  neighborhoodOverlay?: {
 *    center: { x: number, y: number },
 *    eps: number,
 *    metric: "euclidean" | "manhattan",
 *  } | null,
 *  onPointClick?: ((point: Record<string, unknown>) => void) | null,
 * }} options
 */
export const renderScatterPlot = ({
  svgElement,
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
}) => {
  const { dataPoints, centroidPoints } = splitScatterPoints(points);
  const { centroidPoints: previousCentroids } = splitScatterPoints(previousPoints);
  const margins = { top: 20, right: 24, bottom: 48, left: 52 };
  const chartWidth = Math.max(containerWidth, width);

  const allPlotPoints = [...dataPoints, ...centroidPoints, ...previousCentroids];
  const xValues = allPlotPoints.map((point) => Number(point.x));
  const yValues = allPlotPoints.map((point) => Number(point.y));
  const xDomain = expandDomain(d3.extent(xValues.length ? xValues : [0, 1]));
  const yDomain = expandDomain(d3.extent(yValues.length ? yValues : [0, 1]));

  const xScale = d3
    .scaleLinear()
    .domain(xDomain)
    .range([margins.left, chartWidth - margins.right]);
  const yScale = d3
    .scaleLinear()
    .domain(yDomain)
    .range([height - margins.bottom, margins.top]);

  const svg = d3.select(svgElement);
  const assignmentSegments = showAssignmentLines ? getAssignmentSegments(dataPoints) : [];
  const centroidMarkerPath = getCentroidMarkerPath();
  const resolveStroke = pointStrokeFn || (() => "none");
  const resolveStrokeWidth = pointStrokeWidthFn || (() => 0);
  const previousCentroidMap = new Map(
    previousCentroids.map((centroid) => [String(centroid.cluster), centroid])
  );

  svg.attr("viewBox", `0 0 ${chartWidth} ${height}`);
  svg.selectAll("*").remove();

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margins.bottom})`)
    .call(d3.axisBottom(xScale));
  svg
    .append("g")
    .attr("transform", `translate(${margins.left}, 0)`)
    .call(d3.axisLeft(yScale));
  svg
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "#475569")
    .text("X Axis");
  svg
    .append("text")
    .attr("x", -height / 2)
    .attr("y", 16)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("fill", "#475569")
    .text("Y Axis");

  if (showNeighborhoodOverlay && neighborhoodOverlay?.center) {
    drawNeighborhoodOverlay({
      svg,
      xScale,
      yScale,
      overlay: neighborhoodOverlay,
    });
  }

  svg
    .append("g")
    .selectAll("line")
    .data(assignmentSegments)
    .join("line")
    .attr("x1", (segment) => xScale(segment.x1))
    .attr("y1", (segment) => yScale(segment.y1))
    .attr("x2", (segment) => xScale(segment.x2))
    .attr("y2", (segment) => yScale(segment.y2))
    .attr("stroke", "#94A3B8")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.5);

  const pointSelection = svg
    .append("g")
    .selectAll("circle")
    .data(dataPoints)
    .join("circle")
    .attr("cx", (point) => xScale(Number(point.x)))
    .attr("cy", (point) => yScale(Number(point.y)))
    .attr("r", 5)
    .attr("fill", (point) => colorFn(point))
    .attr("stroke", (point) => resolveStroke(point))
    .attr("stroke-width", (point) => resolveStrokeWidth(point))
    .attr("opacity", 0.85);

  if (onPointClick) {
    pointSelection
      .attr("cursor", "pointer")
      .on("click", (_event, point) => {
        onPointClick(point);
      });
  }

  const centroidSelection = svg
    .append("g")
    .selectAll("path")
    .data(centroidPoints, (point) => String(point.cluster))
    .join("path")
    .attr("d", centroidMarkerPath)
    .attr("fill", "none")
    .attr("stroke", (point) => colorFn(point))
    .attr("stroke-width", 2.4)
    .attr("opacity", 0.95)
    .attr("transform", (point) => {
      const startPoint = animateCentroids
        ? previousCentroidMap.get(String(point.cluster)) || point
        : point;
      return `translate(${xScale(Number(startPoint.x))}, ${yScale(Number(startPoint.y))})`;
    });

  if (animateCentroids) {
    centroidSelection
      .transition()
      .duration(400)
      .attr(
        "transform",
        (point) => `translate(${xScale(Number(point.x))}, ${yScale(Number(point.y))})`
      );
  }
};

export default renderScatterPlot;
