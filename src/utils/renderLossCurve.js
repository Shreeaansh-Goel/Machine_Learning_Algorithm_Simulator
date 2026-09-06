import * as d3 from "d3";

/**
 * Renders a compact loss curve chart.
 * @param {{
 *  svgElement: SVGSVGElement,
 *  losses: number[],
 *  currentIndex: number,
 *  width: number,
 *  height: number,
 *  containerWidth: number,
 * }} options
 */
export const renderLossCurve = ({
  svgElement,
  losses,
  currentIndex,
  width,
  height,
  containerWidth,
}) => {
  const chartWidth = Math.max(width, containerWidth);
  const margins = { top: 16, right: 20, bottom: 30, left: 42 };
  const svg = d3.select(svgElement);
  svg.attr("viewBox", `0 0 ${chartWidth} ${height}`);
  svg.selectAll("*").remove();

  if (losses.length === 0) {
    return;
  }

  const xScale = d3
    .scaleLinear()
    .domain([0, losses.length - 1])
    .range([margins.left, chartWidth - margins.right]);
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(losses))
    .nice()
    .range([height - margins.bottom, margins.top]);

  const lineGenerator = d3
    .line()
    .x((_, index) => xScale(index))
    .y((value) => yScale(value));

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margins.bottom})`)
    .call(d3.axisBottom(xScale).ticks(5));
  svg
    .append("g")
    .attr("transform", `translate(${margins.left}, 0)`)
    .call(d3.axisLeft(yScale).ticks(4));

  svg
    .append("path")
    .datum(losses)
    .attr("fill", "none")
    .attr("stroke", "#0EA5E9")
    .attr("stroke-width", 2)
    .attr("d", lineGenerator);

  const safeIndex = Math.max(0, Math.min(currentIndex, losses.length - 1));
  svg
    .append("circle")
    .attr("cx", xScale(safeIndex))
    .attr("cy", yScale(losses[safeIndex]))
    .attr("r", 4)
    .attr("fill", "#0284C7")
    .attr("stroke", "#E0F2FE")
    .attr("stroke-width", 2);
};

export default renderLossCurve;