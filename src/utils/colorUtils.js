const CLUSTER_PALETTE = ["#3B82F6", "#F97316", "#22C55E", "#EF4444", "#8B5CF6"];

const DBSCAN_STATE_COLORS = {
  current: "#FFFFFF",
  core: "#378ADD",
  border: "#EF9F27",
  noise: "#E24B4A",
  unvisited: "#888780",
  neighbor: "#1D9E75",
};

/**
 * Maps a point's label to a stable color for scatter rendering.
 * @param {{ label?: string | null }} point
 * @returns {string}
 */
export const getPointColor = (point) => {
  if (!point?.label) {
    return "#534AB7";
  }
  const labelAsNumber = Number.parseInt(point.label, 10);
  if (Number.isNaN(labelAsNumber)) {
    return "#1D9E75";
  }
  return CLUSTER_PALETTE[Math.abs(labelAsNumber) % CLUSTER_PALETTE.length];
};

/**
 * Maps a cluster index to a stable palette color.
 * @param {number | null | undefined} cluster
 * @returns {string}
 */
export const getClusterColor = (cluster) => {
  if (typeof cluster !== "number" || Number.isNaN(cluster)) {
    return "#94A3B8";
  }
  return CLUSTER_PALETTE[Math.abs(cluster) % CLUSTER_PALETTE.length];
};

/**
 * Color mapper for K-Means step rendering.
 * @param {{ cluster?: number | null, state?: string }} point
 * @returns {string}
 */
export const getKMeansColor = (point) => {
  if (point?.state === "unassigned") {
    return "#94A3B8";
  }
  return getClusterColor(point?.cluster);
};

/**
 * Color mapper for DBSCAN step rendering.
 * @param {{ state?: string }} point
 * @returns {string}
 */
export const getDBSCANColor = (point) => {
  const state = point?.state || "unvisited";
  return DBSCAN_STATE_COLORS[state] || DBSCAN_STATE_COLORS.unvisited;
};

/**
 * Stroke color mapper for DBSCAN points.
 * @param {{ state?: string }} point
 * @returns {string}
 */
export const getDBSCANStrokeColor = (point) => {
  return point?.state === "current" ? "#534AB7" : "none";
};

/**
 * Stroke width mapper for DBSCAN points.
 * @param {{ state?: string }} point
 * @returns {number}
 */
export const getDBSCANStrokeWidth = (point) => {
  return point?.state === "current" ? 2 : 0;
};
