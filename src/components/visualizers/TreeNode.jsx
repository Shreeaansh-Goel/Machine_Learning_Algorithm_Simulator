import { getClusterColor } from "../../utils/colorUtils";

const NODE_WIDTH = 136;
const NODE_HEIGHT = 74;

/**
 * Resolves node fill color based on leaf status and class label.
 * @param {{ is_leaf?: boolean, class?: string | number }} node
 * @returns {string}
 */
const getNodeFill = (node) => {
  if (!node?.is_leaf) {
    return "#FFFFFF";
  }
  const classIndex = Number.parseInt(String(node.class), 10);
  return Number.isNaN(classIndex) ? "#D1FAE5" : getClusterColor(classIndex);
};

/**
 * Renders one decision tree node as an SVG group.
 * @param {{ node: Record<string, any>, x: number, y: number, isActive: boolean }} props
 * @returns {JSX.Element}
 */
export const TreeNode = ({ node, x, y, isActive }) => {
  const featureText = node.is_leaf
    ? `Leaf class: ${node.class}`
    : `${node.feature} <= ${Number(node.threshold).toFixed(2)}`;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-NODE_WIDTH / 2}
        y={-NODE_HEIGHT / 2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={10}
        fill={getNodeFill(node)}
        fillOpacity={node.is_leaf ? 0.26 : 0.92}
        stroke={isActive ? "#534AB7" : "#CBD5E1"}
        strokeWidth={isActive ? 2.4 : 1.1}
      />
      <text x={0} y={-14} textAnchor="middle" fontSize="10" fill="#0F172A" fontWeight="600">
        {featureText}
      </text>
      <text x={0} y={2} textAnchor="middle" fontSize="10" fill="#334155">
        {`gini: ${Number(node.gini).toFixed(2)}`}
      </text>
      <text x={0} y={18} textAnchor="middle" fontSize="10" fill="#334155">
        {`samples: ${node.samples}`}
      </text>
    </g>
  );
};

export default TreeNode;
