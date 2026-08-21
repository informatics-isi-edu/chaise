import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { ElkNode } from 'elkjs/lib/elk.bundled.js';

// models
import { ERDColumn, ERDGraph, ERDTable } from '@isrd-isi-edu/chaise/src/models/erd';

// providers
import { ERDDetailLevel, ERDBaseLayoutAlgorithm } from '@isrd-isi-edu/chaise/src/providers/erd';

/**
 * the react-flow node shape used by the erd app: an `erdTable` node carrying
 * its ERDTable in data. positions and sizes come from elk.
 */
export type ERDTableNodeModel = Node<{ table: ERDTable }, 'erdTable'>;

/**
 * box measurements used for both the elk size estimates and the rendered node
 * (see _erd.scss). the two must stay in sync or the layout won't match what is
 * drawn.
 */
/**
 * exported so erd-pdf-export.ts can lay out rows against the same metrics
 * used here, instead of duplicating them.
 */
export const HEADER_HEIGHT = 28;
export const ROW_HEIGHT = 24;
const BORDER_HEIGHT = 2;
const MIN_NODE_WIDTH = 100;
const MAX_NODE_WIDTH = 320;
/**
 * rough text width at the node font sizes. an estimate is enough: rows ellipsis
 * on overflow.
 */
const CHAR_WIDTH = 7;
/**
 * horizontal padding plus the gap between the name and type in a row
 */
const ROW_EXTRA_WIDTH = 45;

/**
 * RID is a system column but is exempted below: it's the implicit primary
 * key ermrest guarantees on every table, so a table with no other key would
 * otherwise show zero rows under ERDDetailLevel.KEYS, misleadingly
 * suggesting it has no key at all.
 */
const RID_COLUMN_NAME = 'RID';

/**
 * the columns drawn (and measured) for a table at the given detail level.
 * single source of truth shared by estimateNodeSize and the table-node
 * component.
 */
export function visibleColumns(table: ERDTable, detail: ERDDetailLevel): ERDColumn[] {
  if (detail === ERDDetailLevel.NAMES) return [];
  return table.columns.filter((col) => {
    if (col.isSystemColumn && col.name !== RID_COLUMN_NAME) return false;
    if (detail === ERDDetailLevel.FULL) return true;
    if (detail === ERDDetailLevel.KEYS_FKS) return col.isPrimaryKey || col.isForeignKey;
    return col.isPrimaryKey;
  });
}

export interface ERDRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * center point of a node's box. shared by the on screen floating edge
 * (floating-edge.tsx) and the PDF export (erd-pdf-export.ts), each of
 * which reads a node's live position/size from a different shape (react-flow
 * internal node vs. plain ERDTableNodeModel) and reduces it to this rect.
 */
export function rectCenter(rect: ERDRect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * point where the straight line from `rect`'s center toward `otherCenter`
 * crosses `rect`'s own boundary. used to anchor an edge to whichever side of
 * a node currently faces the other node, instead of a fixed handle side.
 */
export function rectIntersection(rect: ERDRect, otherCenter: { x: number; y: number }): { x: number; y: number } {
  const center = rectCenter(rect);
  const dx = otherCenter.x - center.x;
  const dy = otherCenter.y - center.y;

  // how far (as a fraction of the dx/dy vector) we can travel before hitting
  // each pair of sides; the smaller of the two is the side actually hit.
  // clamped to 1 so overlapping/adjacent nodes don't overshoot past the
  // other node's center.
  const scaleX = dx !== 0 ? rect.width / 2 / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? rect.height / 2 / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY, 1);

  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

function estimateNodeSize(table: ERDTable, detail: ERDDetailLevel): { width: number; height: number } {
  const columns = visibleColumns(table, detail);

  let width = table.name.length * CHAR_WIDTH + 20;
  columns.forEach((col) => {
    width = Math.max(width, (col.name.length + col.type.length) * CHAR_WIDTH + ROW_EXTRA_WIDTH);
  });

  return {
    width: Math.min(MAX_NODE_WIDTH, Math.max(MIN_NODE_WIDTH, Math.round(width))),
    height: HEADER_HEIGHT + columns.length * ROW_HEIGHT + BORDER_HEIGHT,
  };
}

/**
 * options that only mean something to the 'layered' algorithm ('elk.layered.*'
 * keys, and direction). elk silently ignores options an algorithm doesn't
 * recognize rather than erroring, so leaving them in for e.g. 'force' would
 * be dead config, not a bug that shows up.
 */
function layeredOnlyOptions(layout: ERDBaseLayoutAlgorithm): Record<string, string> {
  if (layout !== ERDBaseLayoutAlgorithm.LAYERED) return {};
  return {
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.nodeNodeBetweenLayers': '60',
  };
}

/**
 * turn the graph into elk's input shape. layout only cares about boxes and
 * connections, so edges are deduped per table pair (multiple fks between the
 * same two tables would just stack identical lines). a table shows only if
 * both its schema (visibleSchemas) and its own id (visibleTableIds) are
 * checked; excluded tables, and any edge touching one, are left out
 * entirely, not just hidden visually, so they don't take up layout space.
 */
export function graphToElk(
  graph: ERDGraph,
  detail: ERDDetailLevel,
  layout: ERDBaseLayoutAlgorithm,
  visibleSchemas: Set<string>,
  visibleTableIds: Set<string>
): ElkNode {
  const includedTables = Object.values(graph.tables).filter(
    (table) => visibleSchemas.has(table.schema) && visibleTableIds.has(`${table.schema}:${table.name}`)
  );
  const includedIds = new Set(includedTables.map((table) => `${table.schema}:${table.name}`));

  const seen = new Set<string>();
  const elkEdges: ElkNode['edges'] = [];
  graph.edges.forEach((edge) => {
    if (!includedIds.has(edge.fromTable) || !includedIds.has(edge.toTable)) return;
    const id = `${edge.fromTable}->${edge.toTable}`;
    if (seen.has(id)) return;
    seen.add(id);
    elkEdges.push({ id, sources: [edge.fromTable], targets: [edge.toTable] });
  });

  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': layout,
      'elk.spacing.nodeNode': '30',
      ...layeredOnlyOptions(layout),
    },
    children: includedTables.map((table) => ({
      id: `${table.schema}:${table.name}`,
      ...estimateNodeSize(table, detail),
    })),
    edges: elkEdges,
  };
}

/**
 * combine the graph with the elk layout result into react-flow nodes/edges.
 * elk reports top-left coordinates, which is exactly what react-flow expects.
 * the estimated sizes are passed along as explicit node dimensions so the
 * rendered boxes match the layout.
 */
export function elkToFlow(
  graph: ERDGraph,
  laidOut: ElkNode
): { nodes: ERDTableNodeModel[]; edges: Edge[] } {
  const nodes: ERDTableNodeModel[] = (laidOut.children || []).map((child) => ({
    id: child.id,
    type: 'erdTable',
    position: { x: child.x || 0, y: child.y || 0 },
    width: child.width,
    height: child.height,
    data: { table: graph.tables[child.id] },
    // rendering-only diagram: no connect handles on either side
    connectable: false,
  }));

  const edges: Edge[] = (laidOut.edges || []).map((edge) => ({
    id: edge.id,
    source: edge.sources[0],
    target: edge.targets[0],
    type: 'erdFloating',
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  return { nodes, edges };
}
