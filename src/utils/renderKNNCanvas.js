import * as d3 from "d3";

import { getPointColor } from "./colorUtils";
import { expandDomain } from "./scatterPlotUtils";

const QUERY_COLOR = "#7C3AED";

/**
 * Renders KNN scatter view with query point, neighbor links, and distance labels.
 * @param {{
 *  svgElement: SVGSVGElement,
 *  points: Array<Record<string, unknown>>,
 *  width: number,
 *  height: number,
 *  containerWidth: number,
 *  onSetQuery: ((query: { x: number, y: number }) => void) | undefined,
 * }} options
 */
export const renderKNNCanvas = ({
  svgElement,
  points,
  width,
  height,
  containerWidth,
  onSetQuery,
}) => {
  const chartWidth = Math.max(width, containerWidth);
  const margins = { top: 20, right: 24, bottom: 48, left: 52 };
  const queryPoint = points.find((point) => point.state === "query") ?? null;
  const dataPoints = points.filter((point) => point.state !== "query");
  const neighborPoints = dataPoints.filter((point) => point.state === "neighbor");
  const allPoints = queryPoint ? [...dataPoints, queryPoint] : dataPoints;

  const xValues = allPoints.map((point) => Number(point.x));
  const yValues = allPoints.map((point) => Number(point.y));
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

  const interactionLayer = svg
    .append("rect")
    .attr("x", margins.left)
    .attr("y", margins.top)
    .attr("width", chartWidth - margins.left - margins.right)
    .attr("height", height - margins.top - margins.bottom)
    .attr("fill", "transparent")
    .style("cursor", "crosshair");

  if (onSetQuery) {
    interactionLayer.on("click", (event) => {
      const [px, py] = d3.pointer(event);
      onSetQuery({
        x: Number(xScale.invert(px).toFixed(4)),
        y: Number(yScale.invert(py).toFixed(4)),
      });
    });
  }

  if (queryPoint) {
    const queryX = Number(queryPoint.x);
    const queryY = Number(queryPoint.y);

    svg
      .append("g")
      .selectAll("line")
      .data(neighborPoints)
      .join("line")
      .attr("x1", xScale(queryX))
      .attr("y1", yScale(queryY))
      .attr("x2", (point) => xScale(Number(point.x)))
      .attr("y2", (point) => yScale(Number(point.y)))
      .attr("stroke", "#0EA5E9")
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", (point) => {
        const distance = Number(point.distance_to_query ?? 1);
        const safeDistance = Number.isFinite(distance) ? Math.max(distance, 1e-4) : 1;
        return Math.max(0.8, Math.min(4.5, 1 / safeDistance));
      });

    svg
      .append("g")
      .selectAll("text")
      .data(neighborPoints)
      .join("text")
      .attr("x", (point) => (xScale(queryX) + xScale(Number(point.x))) / 2)
      .attr("y", (point) => (yScale(queryY) + yScale(Number(point.y))) / 2 - 4)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#0F172A")
      .text((point) => {
        const distance = Number(point.distance_to_query);
        return Number.isFinite(distance) ? distance.toFixed(2) : "";
      });
  }

  svg
    .append("g")
    .selectAll("circle")
    .data(dataPoints)
    .join("circle")
    .attr("cx", (point) => xScale(Number(point.x)))
    .attr("cy", (point) => yScale(Number(point.y)))
    .attr("r", 5)
    .attr("fill", (point) => getPointColor(point))
    .attr("stroke", (point) => (point.state === "neighbor" ? "#0369A1" : "none"))
    .attr("stroke-width", (point) => (point.state === "neighbor" ? 2 : 0))
    .attr("opacity", 0.9);

  if (queryPoint) {
    svg
      .append("path")
      .datum(queryPoint)
      .attr("d", d3.symbol().type(d3.symbolDiamond).size(180))
      .attr(
        "transform",
        (point) => `translate(${xScale(Number(point.x))}, ${yScale(Number(point.y))})`
      )
      .attr("fill", QUERY_COLOR)
      .attr("stroke", "#4C1D95")
      .attr("stroke-width", 1.6);
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

export default renderKNNCanvas;