import * as d3 from "d3";

import { expandDomain } from "./scatterPlotUtils";

/**
 * Renders linear regression plot with data points, residual lines, and regression line.
 * @param {{
 *  svgElement: SVGSVGElement,
 *  points: Array<Record<string, unknown>>,
 *  previousPoints: Array<Record<string, unknown>>,
 *  linePoints: Array<{ x: number, y: number }>,
 *  previousLinePoints: Array<{ x: number, y: number }>,
 *  width: number,
 *  height: number,
 *  containerWidth: number,
 * }} options
 */
export const renderLinearRegressionCanvas = ({
  svgElement,
  points,
  previousPoints,
  linePoints,
  previousLinePoints,
  width,
  height,
  containerWidth,
}) => {
  const chartWidth = Math.max(width, containerWidth);
  const margins = { top: 20, right: 24, bottom: 48, left: 52 };

  const allPointCandidates = [...points, ...previousPoints].filter(
    (point) => typeof point.x === "number" && typeof point.y === "number"
  );
  const allLineCandidates = [...linePoints, ...previousLinePoints];
  const allXValues = [
    ...allPointCandidates.map((point) => Number(point.x)),
    ...allLineCandidates.map((point) => Number(point.x)),
  ];
  const allYValues = [
    ...allPointCandidates.map((point) => Number(point.y)),
    ...allPointCandidates.map((point) => Number(point.predicted_y ?? point.y)),
    ...allLineCandidates.map((point) => Number(point.y)),
  ];

  const xDomain = expandDomain(d3.extent(allXValues.length ? allXValues : [0, 1]));
  const yDomain = expandDomain(d3.extent(allYValues.length ? allYValues : [0, 1]));

  const xScale = d3
    .scaleLinear()
    .domain(xDomain)
    .range([margins.left, chartWidth - margins.right]);
  const yScale = d3
    .scaleLinear()
    .domain(yDomain)
    .range([height - margins.bottom, margins.top]);

  const svg = d3.select(svgElement);
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
    .append("g")
    .selectAll("line")
    .data(points)
    .join("line")
    .attr("x1", (point) => xScale(Number(point.x)))
    .attr("x2", (point) => xScale(Number(point.x)))
    .attr("y1", (point) => yScale(Number(point.y)))
    .attr("y2", (point) => yScale(Number(point.predicted_y ?? point.y)))
    .attr("stroke", "#94A3B8")
    .attr("stroke-dasharray", "4 3")
    .attr("stroke-opacity", 0.8)
    .attr("stroke-width", 1);

  svg
    .append("g")
    .selectAll("circle")
    .data(points)
    .join("circle")
    .attr("cx", (point) => xScale(Number(point.x)))
    .attr("cy", (point) => yScale(Number(point.y)))
    .attr("r", 4.5)
    .attr("fill", "#64748B")
    .attr("opacity", 0.85);

  const lineGenerator = d3
    .line()
    .x((point) => xScale(point.x))
    .y((point) => yScale(point.y));

  const initialLine = previousLinePoints.length === 2 ? previousLinePoints : linePoints;
  const regressionLine = svg
    .append("path")
    .datum(initialLine)
    .attr("fill", "none")
    .attr("stroke", "#2563EB")
    .attr("stroke-width", 2.6)
    .attr("d", lineGenerator);

  if (linePoints.length === 2) {
    regressionLine.transition().duration(300).attr("d", lineGenerator(linePoints));
  }

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
};

export default renderLinearRegressionCanvas;