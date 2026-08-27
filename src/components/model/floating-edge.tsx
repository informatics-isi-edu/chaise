import { BaseEdge, useInternalNode, type EdgeProps, type InternalNode, type Node } from '@xyflow/react';
import { type JSX } from 'react';

// providers
import { useModelStore, ModelDisplayMode } from '@isrd-isi-edu/chaise/src/providers/model';

// utilities
import { computeEdgePath, erdMarkerUrls, type ModelEdgeModel, type ModelRect } from '@isrd-isi-edu/chaise/src/utils/model-utils';

function nodeRect(node: InternalNode<Node>): ModelRect {
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
 *
 * the path itself (straight line, offset curve for parallel fks, or loop for
 * self-referencing fks) comes from computeEdgePath, driven by the offsets
 * assigned in buildFlowEdges (see ModelEdgeData in model-utils.ts).
 *
 * end decorations depend on the display mode: the simplified mode uses the
 * arrow react-flow resolved into the markerEnd prop, the ERD mode swaps in
 * crow's foot markers on both ends (defs in marker-defs.tsx).
 */
const ModelFloatingEdge = ({ id, source, target, markerEnd, data }: EdgeProps<ModelEdgeModel>): JSX.Element | null => {
  const displayMode = useModelStore((state) => state.displayMode);
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const path = computeEdgePath(nodeRect(sourceNode), nodeRect(targetNode), data);

  /*
   * the edge id is the fk constraint id (`schema:constraint`); a <title> child
   * of the edge's <g> wrapper shows it as a native tooltip on hover, same as
   * the table-node headers do for their `schema:table`.
   */
  if (displayMode === ModelDisplayMode.ERD) {
    const markers = erdMarkerUrls(data);
    return (
      <>
        <title>{id}</title>
        <BaseEdge id={id} path={path} markerStart={markers.markerStart} markerEnd={markers.markerEnd} />
      </>
    );
  }

  return (
    <>
      <title>{id}</title>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
    </>
  );
};

export default ModelFloatingEdge;
