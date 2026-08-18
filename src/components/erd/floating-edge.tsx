import { BaseEdge, getStraightPath, useInternalNode, type EdgeProps, type InternalNode, type Node } from '@xyflow/react';
import { type JSX } from 'react';

// utilities
import { rectCenter, rectIntersection, type ERDRect } from '@isrd-isi-edu/chaise/src/utils/erd-utils';

function nodeRect(node: InternalNode<Node>): ERDRect {
  const { x, y } = node.internals.positionAbsolute;
  return { x, y, width: node.measured.width ?? 0, height: node.measured.height ?? 0 };
}

/**
 * edge that anchors to whichever point on each node's boundary currently
 * faces the other node, computed fresh every render from live node
 * position/size, instead of a handle's fixed side. a handle-based edge
 * always exits/enters from the same side regardless of where a node is
 * dragged to, which looks wrong once a node ends up in an unexpected
 * direction relative to its neighbor. same idea as xyflow's "floating
 * edges" pattern: https://reactflow.dev/examples/edges/simple-floating-edges
 */
const ERDFloatingEdge = ({ id, source, target, markerEnd }: EdgeProps): JSX.Element | null => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const sourceRect = nodeRect(sourceNode);
  const targetRect = nodeRect(targetNode);
  const sourcePoint = rectIntersection(sourceRect, rectCenter(targetRect));
  const targetPoint = rectIntersection(targetRect, rectCenter(sourceRect));

  const [path] = getStraightPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
  });

  return <BaseEdge id={id} path={path} markerEnd={markerEnd} />;
};

export default ERDFloatingEdge;
