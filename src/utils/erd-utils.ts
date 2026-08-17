import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { ElkNode } from 'elkjs/lib/elk.bundled.js';

// models
import { ERDGraph } from '@isrd-isi-edu/chaise/src/models/erd';

/**
 * estimated node box size, used by elk for layout. react-flow will render the
 * node at its natural size, so keep the estimate close to the rendered size
 * (default react-flow node: 10px padding, 12px font).
 */
const NODE_HEIGHT = 40;
const MIN_NODE_WIDTH = 60;
function estimateNodeWidth(label: string): number {
  return Math.max(MIN_NODE_WIDTH, Math.round(label.length * 7.5) + 24);
}

/**
 * turn the graph into elk's input shape. layout only cares about boxes and
 * connections, so edges are deduped per table pair (multiple fks between the
 * same two tables would just stack identical lines).
 */
export function graphToElk(graph: ERDGraph): ElkNode {
  const seen = new Set<string>();
  const elkEdges: ElkNode['edges'] = [];
  graph.edges.forEach((edge) => {
    const id = `${edge.fromTable}->${edge.toTable}`;
    if (seen.has(id)) return;
    seen.add(id);
    elkEdges.push({ id, sources: [edge.fromTable], targets: [edge.toTable] });
  });

  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '30',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
    },
    children: Object.values(graph.tables).map((table) => ({
      id: `${table.schema}:${table.name}`,
      width: estimateNodeWidth(table.name),
      height: NODE_HEIGHT,
    })),
    edges: elkEdges,
  };
}

/**
 * combine the graph with the elk layout result into react-flow nodes/edges.
 * elk reports top-left coordinates, which is exactly what react-flow expects.
 */
export function elkToFlow(graph: ERDGraph, laidOut: ElkNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = (laidOut.children || []).map((child) => ({
    id: child.id,
    position: { x: child.x || 0, y: child.y || 0 },
    data: { label: graph.tables[child.id]?.name || child.id },
    // rendering-only diagram: no connect handles on either side
    connectable: false,
  }));

  const edges: Edge[] = (laidOut.edges || []).map((edge) => ({
    id: edge.id,
    source: edge.sources[0],
    target: edge.targets[0],
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  return { nodes, edges };
}
