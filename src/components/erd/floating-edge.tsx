import {
  BaseEdge,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
  type Node,
} from '@xyflow/react';
import { type JSX } from 'react';

function nodeCenter(node: InternalNode<Node>) {
  const { x, y } = node.internals.positionAbsolute;
  return {
    x: x + (node.measured.width ?? 0) / 2,
    y: y + (node.measured.height ?? 0) / 2,
  };
}

/**
 * point where the straight line from `node`'s center toward `otherCenter`
 * crosses `node`'s own rectangle boundary.
 */
function getRectIntersection(node: InternalNode<Node>, otherCenter: { x: number; y: number }) {
  const { x, y } = node.internals.positionAbsolute;
  const width = node.measured.width ?? 0;
  const height = node.measured.height ?? 0;
  const center = { x: x + width / 2, y: y + height / 2 };

  const dx = otherCenter.x - center.x;
  const dy = otherCenter.y - center.y;

  // how far (as a fraction of the dx/dy vector) we can travel before hitting
  // each pair of sides; the smaller of the two is the side actually hit.
  // clamped to 1 so overlapping/adjacent nodes don't overshoot past the
  // other node's center.
  const scaleX = dx !== 0 ? width / 2 / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? height / 2 / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY, 1);

  return { x: center.x + dx * scale, y: center.y + dy * scale };
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

  const sourcePoint = getRectIntersection(sourceNode, nodeCenter(targetNode));
  const targetPoint = getRectIntersection(targetNode, nodeCenter(sourceNode));

  const [path] = getStraightPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
  });

  return <BaseEdge id={id} path={path} markerEnd={markerEnd} />;
};

export default ERDFloatingEdge;
