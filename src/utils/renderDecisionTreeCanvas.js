import * as d3 from "d3";

import {
  buildLabelColorMap,
  collectSplitLines,
  getLabelColor,
  predictTreeClass,
} from "./decisionTreeUtils";
import { expandDomain } from "./scatterPlotUtils";

const BACKGROUND_COLS = 26;
const BACKGROUND_ROWS = 18;
const MARGINS = { top: 20, right: 20, bottom: 48, left: 52 };

/**
 * Creates low-opacity decision region cells by sampling the tree prediction.
 * @param {{
 *  tree: Record<string, any> | null | undefined,
 *  xDomain: [number, number],
 *  yDomain: [number, number],
 * }} options
 * @returns {Array<{ x0: number, x1: number, y0: number, y1: number, label: string }>}
 */
const buildBackgroundCells = ({ tree, xDomain, yDomain }) => {
  if (!tree) {
    return [];
  }

  const cells = [];
  const xStep = (xDomain[1] - xDomain[0]) / BACKGROUND_COLS;
  const yStep = (yDomain[1] - yDomain[0]) / BACKGROUND_ROWS;

  for (let xIndex = 0; xIndex < BACKGROUND_COLS; xIndex += 1) {
    for (let yIndex = 0; yIndex < BACKGROUND_ROWS; yIndex += 1) {
      const x0 = xDomain[0] + xIndex * xStep;
      const x1 = x0 + xStep;
      const y0 = yDomain[0] + yIndex * yStep;
      const y1 = y0 + yStep;
      const label = predictTreeClass(tree, {
        x: (x0 + x1) / 2,
        y: (y0 + y1) / 2,
      });

      if (label !== null) {
        cells.push({ x0, x1, y0, y1, label });
      }
    }
  }

  return cells;
};

/**
 * Renders the Decision Tree scatter panel with boundaries and split lines.
 * @param {{
 *  svgElement: SVGSVGElement,
 *  step: Record<string, any> | null,
 *  width: number,
 *  height: number,
 * }} options
 */
export const renderDecisionTreeCanvas = ({ svgElement, step, width, height }) => {
  const svg = d3.select(svgElement);
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  svg.selectAll("*").remove();

  const points = step?.points ?? [];
  if (points.length === 0) {
    return;
  }

  const xDomain = expandDomain(d3.extent(points.map((point) => Number(point.x))));
  const yDomain = expandDomain(d3.extent(points.map((point) => Number(point.y))));
  const colorMap = buildLabelColorMap(points);

  const xScale = d3
    .scaleLinear()
    .domain(xDomain)
    .range([MARGINS.left, width - MARGINS.right]);
  const yScale = d3
    .scaleLinear()
    .domain(yDomain)
    .range([height - MARGINS.bottom, MARGINS.top]);

  const backgroundCells = buildBackgroundCells({
    tree: step?.tree_structure,
    xDomain,
    yDomain,
  });
  svg
    .append("g")
    .selectAll("rect")
    .data(backgroundCells)
    .join("rect")
    .attr("x", (cell) => xScale(cell.x0))
    .attr("y", (cell) => yScale(cell.y1))
    .attr("width", (cell) => xScale(cell.x1) - xScale(cell.x0))
    .attr("height", (cell) => yScale(cell.y0) - yScale(cell.y1))
    .attr("fill", (cell) => getLabelColor(cell.label, colorMap))
    .attr("fill-opacity", 0.1);

  const splitLines = collectSplitLines(step?.tree_structure);
  svg
    .append("g")
    .selectAll("line")
    .data(splitLines)
    .join("line")
    .attr("x1", (line) => (line.x_or_y === "x" ? xScale(line.value) : MARGINS.left))
    .attr("y1", (line) => (line.x_or_y === "x" ? MARGINS.top : yScale(line.value)))
    .attr("x2", (line) =>
      line.x_or_y === "x" ? xScale(line.value) : width - MARGINS.right
    )
    .attr("y2", (line) =>
      line.x_or_y === "x" ? height - MARGINS.bottom : yScale(line.value)
    )
    .attr("stroke", (line) =>
      line.node_id === step?.current_node_id ? "#534AB7" : "#94A3B8"
    )
    .attr("stroke-width", (line) => (line.node_id === step?.current_node_id ? 2.4 : 1.2))
    .attr("stroke-dasharray", (line) =>
      line.node_id === step?.current_node_id ? "0" : "5 4"
    )
    .attr("stroke-opacity", 0.8);

  svg
    .append("g")
    .selectAll("circle")
    .data(points)
    .join("circle")
    .attr("cx", (point) => xScale(Number(point.x)))
    .attr("cy", (point) => yScale(Number(point.y)))
    .attr("r", 4.5)
    .attr("fill", (point) => getLabelColor(point.label, colorMap))
    .attr("stroke", (point) => (point.state === "active" ? "#0F172A" : "#FFFFFF"))
    .attr("stroke-width", (point) => (point.state === "active" ? 1.8 : 0.9));

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - MARGINS.bottom})`)
    .call(d3.axisBottom(xScale));
  svg
    .append("g")
    .attr("transform", `translate(${MARGINS.left}, 0)`)
    .call(d3.axisLeft(yScale));

  svg
    .append("text")
    .attr("x", width / 2)
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

export default renderDecisionTreeCanvas;
