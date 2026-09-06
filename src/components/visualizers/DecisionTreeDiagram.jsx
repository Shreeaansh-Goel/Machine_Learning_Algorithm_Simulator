import { useEffect, useMemo, useRef, useState } from "react";

import { computeTreeLayout } from "../../utils/decisionTreeUtils.js";
import TreeNode from "./TreeNode.jsx";

/**
 * Builds a smooth curved edge path between parent and child nodes.
 * @param {{ sourceX: number, sourceY: number, targetX: number, targetY: number }} edge
 * @returns {string}
 */
const buildEdgePath = (edge) => {
  const middleY = (edge.sourceY + edge.targetY) / 2;
  return [
    `M ${edge.sourceX} ${edge.sourceY + 36}`,
    `C ${edge.sourceX} ${middleY}, ${edge.targetX} ${middleY}, ${edge.targetX} ${edge.targetY - 36}`,
  ].join(" ");
};

/**
 * SVG decision tree diagram panel.
 * @param {{ tree: Record<string, any> | null, currentNodeId: number | null }} props
 * @returns {JSX.Element}
 */
export const DecisionTreeDiagram = ({ tree, currentNodeId }) => {
  const wrapperRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [viewport, setViewport] = useState({ width: 620, height: 500 });

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) {
        return;
      }
      setViewport({
        width: Math.max(rect.width, 320),
        height: Math.max(rect.height, 320),
      });
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const treeStats = useMemo(() => {
    const countLeaves = (node) => {
      if (!node) {
        return 0;
      }
      if (node.is_leaf) {
        return 1;
      }
      return countLeaves(node.left) + countLeaves(node.right);
    };

    const maxDepth = (node) => {
      if (!node) {
        return 0;
      }
      return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
    };

    return {
      leaves: Math.max(countLeaves(tree), 1),
      depth: Math.max(maxDepth(tree), 1),
    };
  }, [tree]);

  const layoutWidth = useMemo(() => {
    const available = Math.max(viewport.width - 40, 360);
    const ideal = Math.max(560, treeStats.leaves * 170);
    return Math.max(available, Math.min(ideal, 6400));
  }, [treeStats.leaves, viewport.width]);

  const layoutHeight = useMemo(() => {
    const available = Math.max(viewport.height - 24, 360);
    const ideal = Math.max(460, treeStats.depth * 120);
    return Math.max(available, ideal);
  }, [treeStats.depth, viewport.height]);

  const svgWidth = layoutWidth + 40;
  const svgHeight = layoutHeight + 24;

  const { nodes, edges } = useMemo(() => {
    return computeTreeLayout(tree, layoutWidth, layoutHeight);
  }, [tree, layoutWidth, layoutHeight]);

  if (!tree) {
    return (
      <div
        ref={wrapperRef}
        className="flex h-full items-center justify-center rounded-lg bg-white text-sm text-slate-500"
      >
        Tree structure appears here as nodes are added.
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="h-full w-full overflow-auto rounded-lg bg-white">
      <svg
        className="block"
        style={{ width: `${svgWidth}px`, height: `${svgHeight}px` }}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label="decision tree diagram"
      >
        <g transform="translate(20, 12)">
          {edges.map((edge, index) => (
            <path
              key={`edge-${index}`}
              d={buildEdgePath(edge)}
              fill="none"
              stroke="#94A3B8"
              strokeWidth={1.5}
            />
          ))}
          {nodes.map((item) => (
            <TreeNode
              key={item.node.node_id}
              node={item.node}
              x={item.x}
              y={item.y}
              isActive={item.node.node_id === currentNodeId}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default DecisionTreeDiagram;
