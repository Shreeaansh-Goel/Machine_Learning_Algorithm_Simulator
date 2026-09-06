import * as d3 from "d3";

const LABEL_COLORS = ["#2563EB", "#E11D48", "#16A34A", "#F59E0B", "#7C3AED"];

/**
 * Returns stable color based on optional label/class index.
 * @param {Record<string, unknown>} point
 * @returns {string}
 */
const getPointColor = (point) => {
  const classIndex = Number(point?.class_index);
  if (Number.isFinite(classIndex)) {
    return LABEL_COLORS[Math.abs(classIndex) % LABEL_COLORS.length];
  }

  const label = String(point?.label ?? "");
  if (!label) {
    return "#334155";
  }

  let hash = 0;
  for (let index = 0; index < label.length; index += 1) {
    hash = (hash * 31) + label.charCodeAt(index);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
};

/**
 * Draws one axis-aligned scatter frame with title.
 * @param {{
 *  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
 *  xScale: d3.ScaleLinear<number, number>,
 *  yScale: d3.ScaleLinear<number, number>,
 *  xAxisY: number,
 *  yAxisX: number,
 *  title: string,
 *  titleX: number,
 *  titleY: number,
 * }} options
 */
const drawFrame = ({ svg, xScale, yScale, xAxisY, yAxisX, title, titleX, titleY }) => {
  svg.append("g").attr("transform", `translate(0, ${xAxisY})`).call(d3.axisBottom(xScale).ticks(6));
  svg.append("g").attr("transform", `translate(${yAxisX}, 0)`).call(d3.axisLeft(yScale).ticks(6));
  svg
    .append("text")
    .attr("x", titleX)
    .attr("y", titleY)
    .attr("text-anchor", "middle")
    .attr("fill", "#0f172a")
    .attr("font-size", 13)
    .attr("font-weight", 600)
    .text(title);
};

/**
 * Renders PCA dual-view canvas with projection animation and eigenvector arrows.
 * @param {{
 *  svgElement: SVGSVGElement,
 *  step: Record<string, unknown> | null,
 *  width: number,
 *  height: number,
 *  containerWidth: number,
 * }} options
 */
export const renderPCACanvas = ({
  svgElement,
  step,
  width,
  height,
  containerWidth,
}) => {
  const points = Array.isArray(step?.points) ? step.points : [];
  const chartWidth = Math.max(width, containerWidth);
  const margins = { top: 34, right: 26, bottom: 44, left: 44 };
  const panelGap = 84;
  const panelWidth = Math.max(120, ((chartWidth - margins.left - margins.right - panelGap) / 2));

  const leftStart = margins.left;
  const leftEnd = leftStart + panelWidth;
  const rightStart = leftEnd + panelGap;
  const rightEnd = rightStart + panelWidth;
  const plotTop = margins.top;
  const plotBottom = height - margins.bottom;

  const originalX = points.map((point) => Number(point.x));
  const originalY = points.map((point) => Number(point.y));
  const projectedX = points.map((point) => Number(point.projected_x));
  const projectedY = points.map((point) => Number(point.projected_y));

  const xLeftDomain = d3.extent(originalX.length > 0 ? originalX : [0, 1]);
  const yLeftDomain = d3.extent(originalY.length > 0 ? originalY : [0, 1]);
  const xRightDomain = d3.extent(projectedX.length > 0 ? projectedX : [0, 1]);
  const yRightDomain = d3.extent(projectedY.length > 0 ? projectedY : [0, 1]);

  const xLeft = d3.scaleLinear().domain(xLeftDomain).nice().range([leftStart, leftEnd]);
  const yLeft = d3.scaleLinear().domain(yLeftDomain).nice().range([plotBottom, plotTop]);
  const xRight = d3.scaleLinear().domain(xRightDomain).nice().range([rightStart, rightEnd]);
  const yRight = d3.scaleLinear().domain(yRightDomain).nice().range([plotBottom, plotTop]);

  const svg = d3.select(svgElement);
  svg.attr("viewBox", `0 0 ${chartWidth} ${height}`);
  svg.selectAll("*").remove();

  drawFrame({
    svg,
    xScale: xLeft,
    yScale: yLeft,
    xAxisY: plotBottom,
    yAxisX: leftStart,
    title: "Original Space",
    titleX: (leftStart + leftEnd) / 2,
    titleY: 20,
  });

  drawFrame({
    svg,
    xScale: xRight,
    yScale: yRight,
    xAxisY: plotBottom,
    yAxisX: rightStart,
    title: "Projected Space (PC1 vs PC2)",
    titleX: (rightStart + rightEnd) / 2,
    titleY: 20,
  });

  if (step?.step_type === "project" || step?.step_type === "done") {
    svg
      .append("g")
      .selectAll("line")
      .data(points)
      .join("line")
      .attr("x1", (point) => xLeft(Number(point.x)))
      .attr("y1", (point) => yLeft(Number(point.y)))
      .attr("x2", (point) => xRight(Number(point.projected_x)))
      .attr("y2", (point) => yRight(Number(point.projected_y)))
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 3")
      .attr("opacity", 0.85);
  }

  svg
    .append("g")
    .selectAll("circle")
    .data(points)
    .join("circle")
    .attr("cx", (point) => xLeft(Number(point.x)))
    .attr("cy", (point) => yLeft(Number(point.y)))
    .attr("r", 4.5)
    .attr("fill", (point) => getPointColor(point))
    .attr("opacity", 0.9);

  const rightPoints = svg.append("g").selectAll("circle").data(points).join("circle");
  rightPoints
    .attr("r", 4.5)
    .attr("fill", (point) => getPointColor(point))
    .attr("opacity", 0.9)
    .attr("cx", (point) => {
      if (step?.step_type === "project") {
        return xLeft(Number(point.x));
      }
      return xRight(Number(point.projected_x));
    })
    .attr("cy", (point) => {
      if (step?.step_type === "project") {
        return yLeft(Number(point.y));
      }
      return yRight(Number(point.projected_y));
    });

  if (step?.step_type === "project") {
    rightPoints
      .transition()
      .duration(650)
      .attr("cx", (point) => xRight(Number(point.projected_x)))
      .attr("cy", (point) => yRight(Number(point.projected_y)));
  }

  const arrows = Array.isArray(step?.metrics?.eigenvector_arrows)
    ? step.metrics.eigenvector_arrows
    : [];

  if (arrows.length > 0) {
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "pca-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#4f46e5");

    svg
      .append("g")
      .selectAll("line")
      .data(arrows)
      .join("line")
      .attr("x1", (arrow) => xLeft(Number(arrow.start?.x ?? 0)))
      .attr("y1", (arrow) => yLeft(Number(arrow.start?.y ?? 0)))
      .attr("x2", (arrow) => xLeft(Number(arrow.end?.x ?? 0)))
      .attr("y2", (arrow) => yLeft(Number(arrow.end?.y ?? 0)))
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#pca-arrow)");
  }
};

export default renderPCACanvas;
