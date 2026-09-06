import { getClusterColor } from "./colorUtils";

/**
 * Predicts a class label by traversing a nested decision tree object.
 * @param {Record<string, any> | null | undefined} tree
 * @param {{ x: number, y: number }} point
 * @returns {string | null}
 */
export const predictTreeClass = (tree, point) => {
  if (!tree) {
    return null;
  }
  if (tree.is_leaf) {
    return String(tree.class);
  }

  const featureValue = tree.feature === "x" ? point.x : point.y;
  const nextNode = featureValue <= Number(tree.threshold) ? tree.left : tree.right;
  return predictTreeClass(nextNode, point);
};

/**
 * Collects all split boundaries from a nested tree.
 * @param {Record<string, any> | null | undefined} tree
 * @param {Array<{ node_id: number, x_or_y: "x" | "y", value: number }>} lines
 * @returns {Array<{ node_id: number, x_or_y: "x" | "y", value: number }>}
 */
export const collectSplitLines = (tree, lines = []) => {
  if (!tree) {
    return lines;
  }

  if (!tree.is_leaf && (tree.feature === "x" || tree.feature === "y")) {
    lines.push({
      node_id: Number(tree.node_id),
      x_or_y: tree.feature,
      value: Number(tree.threshold),
    });
  }

  collectSplitLines(tree.left, lines);
  collectSplitLines(tree.right, lines);
  return lines;
};

/**
 * Builds a stable class->color map from step points.
 * @param {Array<Record<string, any>>} points
 * @returns {Map<string, string>}
 */
export const buildLabelColorMap = (points) => {
  const labels = Array.from(
    new Set(points.map((point) => String(point.label ?? point.predicted_label ?? "")))
  ).filter((label) => label.length > 0);

  return new Map(labels.map((label, index) => [label, getClusterColor(index)]));
};

/**
 * Returns a display color for a class label.
 * @param {string | number | null | undefined} label
 * @param {Map<string, string>} colorMap
 * @returns {string}
 */
export const getLabelColor = (label, colorMap) => {
  return colorMap.get(String(label ?? "")) || "#94A3B8";
};

/**
 * Computes a recursive tree layout with centered parents and spaced children.
 * @param {Record<string, any> | null | undefined} tree
 * @param {number} width
 * @param {number} height
 * @returns {{ nodes: Array<{ node: Record<string, any>, x: number, y: number }>, edges: Array<{ sourceX: number, sourceY: number, targetX: number, targetY: number }> }}
 */
export const computeTreeLayout = (tree, width, height) => {
  if (!tree) {
    return { nodes: [], edges: [] };
  }

  /** @type {Array<{ node: Record<string, any>, x: number, y: number }>} */
  const nodes = [];
  /** @type {Array<{ sourceX: number, sourceY: number, targetX: number, targetY: number }>} */
  const edges = [];

  /**
   * Counts leaves recursively to determine horizontal spacing.
   * @param {Record<string, any> | null | undefined} node
   * @returns {number}
   */
  const countLeaves = (node) => {
    if (!node) {
      return 0;
    }
    if (node.is_leaf) {
      return 1;
    }
    return countLeaves(node.left) + countLeaves(node.right);
  };

  /**
   * Returns max depth recursively for vertical spacing.
   * @param {Record<string, any> | null | undefined} node
   * @returns {number}
   */
  const maxDepth = (node) => {
    if (!node) {
      return 0;
    }
    if (node.is_leaf) {
      return 1;
    }
    return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
  };

  const totalLeaves = Math.max(countLeaves(tree), 1);
  const leafSpacing = width / (totalLeaves + 1);
  const depthSpacing = height / (Math.max(maxDepth(tree), 1) + 1);
  let leafCursor = 0;

  /**
   * Places nodes recursively, centering parents above children.
   * @param {Record<string, any> | null | undefined} node
   * @param {number} depth
   * @returns {{ node: Record<string, any>, x: number, y: number } | null}
   */
  const placeRecursive = (node, depth) => {
    if (!node) {
      return null;
    }

    const leftNode = placeRecursive(node.left, depth + 1);
    const rightNode = placeRecursive(node.right, depth + 1);
    const leftX = leftNode?.x ?? null;
    const rightX = rightNode?.x ?? null;

    let x = ++leafCursor * leafSpacing;
    if (leftX !== null && rightX !== null) {
      x = (leftX + rightX) / 2;
    } else if (leftX !== null || rightX !== null) {
      x = /** @type {number} */ (leftX ?? rightX);
    }

    const y = (depth + 1) * depthSpacing;
    const currentNode = { node, x, y };

    nodes.push(currentNode);
    if (leftNode) {
      edges.push({ sourceX: x, sourceY: y, targetX: leftNode.x, targetY: leftNode.y });
    }
    if (rightNode) {
      edges.push({ sourceX: x, sourceY: y, targetX: rightNode.x, targetY: rightNode.y });
    }

    return currentNode;
  };

  // A simple recursive positioning function: leaves are distributed left->right,
  // and each internal node is centered above its children.
  placeRecursive(tree, 0);
  return { nodes, edges };
};
