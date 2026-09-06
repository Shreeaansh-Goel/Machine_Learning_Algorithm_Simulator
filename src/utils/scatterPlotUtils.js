import * as d3 from "d3";

/**
 * Expands a scale domain so flat values still render with visible spread.
 * @param {[number | undefined, number | undefined]} domain
 * @returns {[number, number]}
 */
export const expandDomain = (domain) => {
  const minValue = domain[0] ?? 0;
  const maxValue = domain[1] ?? 1;
  if (minValue === maxValue) {
    return [minValue - 1, maxValue + 1];
  }
  const padding = (maxValue - minValue) * 0.1;
  return [minValue - padding, maxValue + padding];
};

/**
 * Splits regular points from centroid marker points.
 * @param {Array<Record<string, unknown>>} points
 * @returns {{ dataPoints: Array<Record<string, unknown>>, centroidPoints: Array<Record<string, unknown>> }}
 */
export const splitScatterPoints = (points) => ({
  dataPoints: points.filter((point) => point.state !== "centroid"),
  centroidPoints: points.filter((point) => point.state === "centroid"),
});

/**
 * Builds line segments from point to assigned centroid for assign steps.
 * @param {Array<Record<string, unknown>>} points
 * @returns {{ x1: number, y1: number, x2: number, y2: number }[]}
 */
export const getAssignmentSegments = (points) =>
  points
    .filter(
      (point) =>
        typeof point.x === "number" &&
        typeof point.y === "number" &&
        typeof point.centroid_x === "number" &&
        typeof point.centroid_y === "number"
    )
    .map((point) => ({
      x1: /** @type {number} */ (point.x),
      y1: /** @type {number} */ (point.y),
      x2: /** @type {number} */ (point.centroid_x),
      y2: /** @type {number} */ (point.centroid_y),
    }));

/**
 * Generates D3 path data for X-shaped centroid marker.
 * @returns {string}
 */
export const getCentroidMarkerPath = () =>
  d3.symbol().type(d3.symbolCross).size(220)();
