import * as d3 from "d3";

const CLASS_COLORS = ["#2563EB", "#DC2626"];

/**
 * Resolves stable color for two-class SVM points.
 * @param {Record<string, unknown>} point
 * @returns {string}
 */
const getClassColor = (point) => {
  const classIndex = Number(point?.class_index);
  if (Number.isFinite(classIndex)) {
    return CLASS_COLORS[Math.abs(classIndex) % CLASS_COLORS.length];
  }

  const label = String(point?.label ?? "");
  return label ? CLASS_COLORS[Math.abs(label.length) % 2] : "#334155";
};

/**
 * Converts D3 contour coordinate sets into SVG path string.
 * @param {Array<Array<Array<[number, number]>>>} coordinates
 * @param {(x: number) => number} toX
 * @param {(y: number) => number} toY
 * @returns {string}
 */
const contourPath = (coordinates, toX, toY) => {
  /** @type {string[]} */
  const commands = [];

  coordinates.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach(([gridX, gridY], index) => {
        commands.push(`${index === 0 ? "M" : "L"}${toX(gridX)},${toY(gridY)}`);
      });
      commands.push("Z");
    });
  });

  return commands.join(" ");
};

/**
 * Renders SVM scatter canvas including linear margins or RBF boundary contours.
 * @param {{
 *  svgElement: SVGSVGElement,
 *  step: Record<string, unknown> | null,
 *  width: number,
 *  height: number,
 *  containerWidth: number,
 * }} options
 */
export const renderSVMCanvas = ({
  svgElement,
  step,
  width,
  height,
  containerWidth,
}) => {
  const points = Array.isArray(step?.points) ? step.points : [];
  const metrics = /** @type {Record<string, unknown>} */ (step?.metrics ?? {});
  const kernel = String(metrics.kernel ?? "linear").toLowerCase();

  const chartWidth = Math.max(containerWidth || width, 320);
  const margins = { top: 20, right: 24, bottom: 44, left: 50 };

  const xValues = points.map((point) => Number(point.x));
  const yValues = points.map((point) => Number(point.y));
  const xDomain = d3.extent(xValues.length > 0 ? xValues : [0, 1]);
  const yDomain = d3.extent(yValues.length > 0 ? yValues : [0, 1]);

  const xScale = d3
    .scaleLinear()
    .domain(xDomain)
    .nice()
    .range([margins.left, chartWidth - margins.right]);
  const yScale = d3
    .scaleLinear()
    .domain(yDomain)
    .nice()
    .range([height - margins.bottom, margins.top]);

  const svg = d3.select(svgElement);
  svg.attr("viewBox", `0 0 ${chartWidth} ${height}`);
  svg.selectAll("*").remove();

  const clipId = `svm-plot-clip-${Math.round(Math.random() * 1e9)}`;
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("x", margins.left)
    .attr("y", margins.top)
    .attr("width", chartWidth - margins.left - margins.right)
    .attr("height", height - margins.top - margins.bottom);

  const plotLayer = svg.append("g").attr("clip-path", `url(#${clipId})`);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margins.bottom})`)
    .call(d3.axisBottom(xScale));
  svg
    .append("g")
    .attr("transform", `translate(${margins.left}, 0)`)
    .call(d3.axisLeft(yScale));

  if (kernel === "rbf" && metrics.decision_grid && typeof metrics.decision_grid === "object") {
    const grid = /** @type {Record<string, unknown>} */ (metrics.decision_grid);
    const cols = Number(grid.cols ?? 0);
    const rows = Number(grid.rows ?? 0);
    const xMin = Number(grid.x_min ?? 0);
    const xMax = Number(grid.x_max ?? 1);
    const yMin = Number(grid.y_min ?? 0);
    const yMax = Number(grid.y_max ?? 1);
    const values = Array.isArray(grid.values) ? grid.values.map((value) => Number(value)) : [];

    if (cols > 1 && rows > 1 && values.length === cols * rows) {
      const contours = d3.contours().size([cols, rows]).thresholds([-1, 0, 1])(values);
      const toX = (gridX) => xScale(xMin + ((gridX / (cols - 1)) * (xMax - xMin)));
      const toY = (gridY) => yScale(yMin + ((gridY / (rows - 1)) * (yMax - yMin)));

      plotLayer
        .append("g")
        .selectAll("path")
        .data(contours)
        .join("path")
        .attr("d", (contour) => contourPath(contour.coordinates, toX, toY))
        .attr("fill", "none")
        .attr("stroke", (contour) => (contour.value === 0 ? "#4f46e5" : "#64748b"))
        .attr("stroke-width", (contour) => (contour.value === 0 ? 2.2 : 1.4))
        .attr("stroke-dasharray", (contour) => (contour.value === 0 ? "" : "5 4"))
        .attr("opacity", 0.9);
    }
  }

  if (kernel === "linear") {
    const lineFn = d3.line().x((point) => xScale(point.x)).y((point) => yScale(point.y));
    const boundary = Array.isArray(metrics.hyperplane_line) ? metrics.hyperplane_line : [];
    const marginsData = Array.isArray(metrics.margin_lines) ? metrics.margin_lines : [];

    if (boundary.length >= 2) {
      plotLayer
        .append("path")
        .attr("d", lineFn(boundary))
        .attr("fill", "none")
        .attr("stroke", "#4f46e5")
        .attr("stroke-width", 2.2);
    }

    marginsData.forEach((marginLine) => {
      if (Array.isArray(marginLine) && marginLine.length >= 2) {
        plotLayer
          .append("path")
          .attr("d", lineFn(marginLine))
          .attr("fill", "none")
          .attr("stroke", "#64748b")
          .attr("stroke-width", 1.4)
          .attr("stroke-dasharray", "6 4");
      }
    });
  }

  const normalPoints = points.filter((point) => point.state !== "support_vector");
  const supportPoints = points.filter((point) => point.state === "support_vector");

  plotLayer
    .append("g")
    .selectAll("circle")
    .data(normalPoints)
    .join("circle")
    .attr("cx", (point) => xScale(Number(point.x)))
    .attr("cy", (point) => yScale(Number(point.y)))
    .attr("r", 4.8)
    .attr("fill", (point) => getClassColor(point))
    .attr("opacity", 0.9);

  plotLayer
    .append("g")
    .selectAll("rect")
    .data(supportPoints)
    .join("rect")
    .attr("x", (point) => xScale(Number(point.x)) - 5.5)
    .attr("y", (point) => yScale(Number(point.y)) - 5.5)
    .attr("width", 11)
    .attr("height", 11)
    .attr("fill", "none")
    .attr("stroke", "#f59e0b")
    .attr("stroke-width", 2.2);
};

export default renderSVMCanvas;
