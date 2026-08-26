import { getStraightPath, MarkerType, type Edge, type Node } from '@xyflow/react';
import type { ElkNode } from 'elkjs/lib/elk.bundled.js';

// models
import {
  edgeKey,
  ModelColumn,
  ModelEdge,
  ModelGraph,
  ModelTable,
} from '@isrd-isi-edu/chaise/src/models/model-app';

// providers
import { ModelDetailLevel, ModelBaseLayoutAlgorithm, ModelDisplayMode } from '@isrd-isi-edu/chaise/src/providers/model';

//-------------------  types  --------------------//

/**
 * the react-flow node shape used by the model app: a `modelTable` node carrying
 * its ModelTable in data. positions and sizes come from elk.
 */
export type ModelTableNodeModel = Node<{ table: ModelTable }, 'modelTable'>;

/**
 * per-edge geometry inputs, computed once in buildFlowEdges and read by
 * computeEdgePath (both on the canvas and in the PDF export)
 */
export interface ModelEdgeData extends Record<string, unknown> {
  /**
   * signed perpendicular step relative to this edge's own source->target
   * direction; 0 = straight line. the canonical sign is baked in at assignment
   * time so opposite-direction edges between the same pair curve to opposite sides.
   */
  offset: number;
  isSelfLoop: boolean;
  /**
   * 0-based index among self-loops on the same table; 0 otherwise
   */
  loopIndex: number;
  /**
   * relationship facts for the ERD display mode markers (see erdMarkerUrls)
   */
  isOptional: boolean;
  isOneToOne: boolean;
  /**
   * stamped on by displayEdges when the edge touches the focused table, so the
   * floating edge can pick the highlighted marker variants
   */
  highlighted?: boolean;
}

export type ModelEdgeModel = Edge<ModelEdgeData, 'modelFloating'>;

export interface ModelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

//-------------------  constants  --------------------//

/**
 * box measurements used by estimateNodeSize for the elk size estimates, and by
 * the PDF export to draw boxes with the same proportions. they must stay in
 * sync with the rendered node styles (see _model.scss) or the layout won't match
 * what is drawn.
 */
export const NODE_SIZING = {
  HEADER_HEIGHT: 28,
  ROW_HEIGHT: 24,
  BORDER_HEIGHT: 2,
  MIN_WIDTH: 100,
  MAX_WIDTH: 320,
  /**
   * rough text width at the node font sizes. an estimate is enough: rows
   * ellipsis on overflow.
   */
  CHAR_WIDTH: 7,
  /**
   * horizontal padding plus the gap between the name and type in a row
   */
  ROW_EXTRA_WIDTH: 45,
} as const;

/**
 * knobs for computeEdgePath's curved cases (parallel fks and self-loops)
 */
const EDGE_GEOMETRY = {
  /**
   * control-point spacing between parallel edges; the visible apex spacing is
   * about half this (a quadratic's midpoint sits halfway to the control point)
   */
  OFFSET_STEP: 50,
  /**
   * horizontal reach of the smallest self-loop, plus growth per extra loop on
   * the same table. must clear the 30px-long end markers with room to spare.
   */
  LOOP_BASE: 55,
  LOOP_STEP: 25,
} as const;

/**
 * RID is a system column but is exempted in visibleColumns: it's the implicit
 * primary key ermrest guarantees on every table, so a table with no other key
 * would otherwise show zero rows under ModelDetailLevel.KEYS, misleadingly
 * suggesting it has no key at all.
 */
const RID_COLUMN_NAME = 'RID';

/**
 * crow's foot marker geometry for the ERD display mode, shared by the canvas
 * defs (marker-defs.tsx) and the PDF export. all shapes live in a
 * WIDTH x HEIGHT box with the node-boundary contact at x = WIDTH (refX), and
 * are stroked, not filled. each end carries min + max symbols: circle = zero,
 * bar = one, crow's foot = many (the outer symbol touches the node).
 */
export const ERD_MARKERS = {
  WIDTH: 30,
  HEIGHT: 12,
  REF_Y: 6,
  COLOR: '#999',
  SHAPES: {
    /** zero or many: circle + crow's foot */
    zeroMany: {
      paths: ['M 14 6 L 30 0', 'M 14 6 L 30 6', 'M 14 6 L 30 12'],
      circle: { cx: 6, cy: 6, r: 4 },
    },
    /** zero or one: circle + bar */
    zeroOne: { paths: ['M 20 1 L 20 11'], circle: { cx: 8, cy: 6, r: 4 } },
    /** exactly one: double bar */
    exactlyOne: { paths: ['M 18 1 L 18 11', 'M 24 1 L 24 11'] },
  },
} as const;

export type ERDMarkerShape = keyof typeof ERD_MARKERS.SHAPES;

/**
 * dom id of one marker def
 */
export function erdMarkerId(shape: ERDMarkerShape, highlighted?: boolean): string {
  return `erd-marker-${shape}${highlighted ? '-hl' : ''}`;
}

/**
 * per-end marker urls for the ERD display mode.
 *
 * child (fk-holding) end = edge source: max is many, or one when the fk
 * columns are unique; min is always zero, since no relational constraint can
 * force a parent row to have children. so: zero-or-many, or zero-or-one when
 * one-to-one.
 *
 * parent (referenced) end = edge target: max is always one; min is zero when
 * the fk is nullable. so: exactly-one (double bar), or zero-or-one when
 * optional.
 */
export function erdMarkerUrls(data?: ModelEdgeData): { markerStart: string; markerEnd: string } {
  const hl = data?.highlighted;
  const start: ERDMarkerShape = data?.isOneToOne ? 'zeroOne' : 'zeroMany';
  const end: ERDMarkerShape = data?.isOptional ? 'zeroOne' : 'exactlyOne';
  return {
    markerStart: `url(#${erdMarkerId(start, hl)})`,
    markerEnd: `url(#${erdMarkerId(end, hl)})`,
  };
}

//-------------------  table contents and sizing  --------------------//

/**
 * the columns drawn (and measured) for a table at the given detail level.
 * single source of truth shared by estimateNodeSize and the table-node
 * component.
 */
export function visibleColumns(table: ModelTable, detail: ModelDetailLevel): ModelColumn[] {
  if (detail === ModelDetailLevel.NAMES) return [];
  return table.columns.filter((col) => {
    if (col.isSystemColumn && col.name !== RID_COLUMN_NAME) return false;
    if (detail === ModelDetailLevel.FULL) return true;
    if (detail === ModelDetailLevel.KEYS_FKS) return col.isPrimaryKey || col.isForeignKey;
    return col.isPrimaryKey;
  });
}

function estimateNodeSize(
  table: ModelTable,
  detail: ModelDetailLevel
): { width: number; height: number } {
  const columns = visibleColumns(table, detail);

  let width = table.name.length * NODE_SIZING.CHAR_WIDTH + 20;
  columns.forEach((col) => {
    width = Math.max(
      width,
      (col.name.length + col.type.length) * NODE_SIZING.CHAR_WIDTH + NODE_SIZING.ROW_EXTRA_WIDTH
    );
  });

  return {
    width: Math.min(NODE_SIZING.MAX_WIDTH, Math.max(NODE_SIZING.MIN_WIDTH, Math.round(width))),
    height: NODE_SIZING.HEADER_HEIGHT + columns.length * NODE_SIZING.ROW_HEIGHT + NODE_SIZING.BORDER_HEIGHT,
  };
}

//-------------------  edge geometry (shared with the pdf export)  --------------------//

/**
 * center point of a node's box. shared by the on screen floating edge
 * (floating-edge.tsx) and the PDF export (model-pdf-export.ts), each of
 * which reads a node's live position/size from a different shape (react-flow
 * internal node vs. plain ModelTableNodeModel) and reduces it to this rect.
 */
export function rectCenter(rect: ModelRect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * point where the straight line from `rect`'s center toward `otherCenter`
 * crosses `rect`'s own boundary. used to anchor an edge to whichever side of
 * a node currently faces the other node, instead of a fixed handle side.
 */
export function rectIntersection(
  rect: ModelRect,
  otherCenter: { x: number; y: number }
): { x: number; y: number } {
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

/**
 * the svg path for an edge, shared by the on-screen floating edge and the PDF
 * export. three cases: a straight line (single edge between a pair), a
 * quadratic fanned out perpendicular to the pair (parallel fks), or a cubic
 * loop on the node's right side (self-referencing fk). when nodes overlap the
 * anchors clamp to the centers (see rectIntersection) and the path degrades
 * gracefully, same as the straight case always has.
 */
export function computeEdgePath(
  sourceRect: ModelRect,
  targetRect: ModelRect,
  data?: ModelEdgeData
): string {
  if (data?.isSelfLoop) {
    const r = EDGE_GEOMETRY.LOOP_BASE + data.loopIndex * EDGE_GEOMETRY.LOOP_STEP;
    const x = sourceRect.x + sourceRect.width;
    const y1 = sourceRect.y + sourceRect.height / 3;
    const y2 = sourceRect.y + (sourceRect.height * 2) / 3;
    /*
     * horizontal control points give flat tangents at both anchors, so the
     * end markers sit flush against the node edge (a diagonal exit would lay
     * them across the bend). the result is a "D" shaped loop bulging ~3/4 r.
     */
    return `M ${x},${y1} C ${x + r},${y1} ${x + r},${y2} ${x},${y2}`;
  }

  if (data && data.offset !== 0) {
    const sourceCenter = rectCenter(sourceRect);
    const targetCenter = rectCenter(targetRect);
    let dx = targetCenter.x - sourceCenter.x;
    let dy = targetCenter.y - sourceCenter.y;
    let len = Math.hypot(dx, dy);
    if (len < 1) {
      // co-centered nodes: fixed fallback direction instead of NaN
      dx = 1;
      dy = 0;
      len = 1;
    }
    const perpX = -dy / len;
    const perpY = dx / len;
    const offset = data.offset * EDGE_GEOMETRY.OFFSET_STEP;
    const controlX = (sourceCenter.x + targetCenter.x) / 2 + perpX * offset;
    const controlY = (sourceCenter.y + targetCenter.y) / 2 + perpY * offset;
    // anchoring toward the control fans the group out at the node boundary too
    const s = rectIntersection(sourceRect, { x: controlX, y: controlY });
    const t = rectIntersection(targetRect, { x: controlX, y: controlY });
    return `M ${s.x},${s.y} Q ${controlX},${controlY} ${t.x},${t.y}`;
  }

  const sourcePoint = rectIntersection(sourceRect, rectCenter(targetRect));
  const targetPoint = rectIntersection(targetRect, rectCenter(sourceRect));
  const [path] = getStraightPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
  });
  return path;
}

//-------------------  elk conversion  --------------------//

/**
 * options that only mean something to the 'layered' algorithm ('elk.layered.*'
 * keys, and direction). elk silently ignores options an algorithm doesn't
 * recognize rather than erroring, so leaving them in for e.g. 'force' would
 * be dead config, not a bug that shows up.
 */
function layeredOnlyOptions(layout: ModelBaseLayoutAlgorithm): Record<string, string> {
  if (layout !== ModelBaseLayoutAlgorithm.LAYERED) return {};
  return {
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.nodeNodeBetweenLayers': '60',
  };
}

/**
 * turn the graph into elk's input shape. elk input is placement-only: rendered
 * edges are built separately from graph.edges in elkToFlow, so edges here are
 * deduped per table pair and self-loops are skipped (neither affects where
 * boxes go). a table shows only if both its schema (visibleSchemas) and its
 * own id (visibleTableIds) are checked; excluded tables, and any edge touching
 * one, are left out entirely, not just hidden visually, so they don't take up
 * layout space.
 */
export function graphToElk(
  graph: ModelGraph,
  displayMode: ModelDisplayMode,
  detail: ModelDetailLevel,
  layout: ModelBaseLayoutAlgorithm,
  visibleSchemas: Set<string>,
  visibleTableIds: Set<string>
): ElkNode {
  const includedTables = Object.values(graph.tables).filter(
    (table) =>
      visibleSchemas.has(table.schema) && visibleTableIds.has(`${table.schema}:${table.name}`)
  );
  const includedIds = new Set(includedTables.map((table) => `${table.schema}:${table.name}`));

  const seen = new Set<string>();
  const elkEdges: ElkNode['edges'] = [];
  graph.edges.forEach((edge) => {
    if (!includedIds.has(edge.fromTable) || !includedIds.has(edge.toTable)) return;
    if (edge.fromTable === edge.toTable) return;
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
 * one react-flow edge per fk constraint, with the geometry inputs each edge
 * needs (see ModelEdgeData). edges between the same table pair (either
 * direction) share an offset group and fan out around the straight line;
 * self-loops nest per table. group members are sorted by edge id so offsets
 * are deterministic across renders.
 */
function buildFlowEdges(edges: ModelEdge[]): ModelEdgeModel[] {
  const groups = new Map<string, ModelEdge[]>();
  edges.forEach((edge) => {
    const key =
      edge.fromTable === edge.toTable
        ? `self:${edge.fromTable}`
        : [edge.fromTable, edge.toTable].sort().join(' ');
    const group = groups.get(key);
    if (group) group.push(edge);
    else groups.set(key, [edge]);
  });

  const flowEdges: ModelEdgeModel[] = [];
  groups.forEach((group) => {
    group.sort((a, b) => (edgeKey(a) < edgeKey(b) ? -1 : 1));
    group.forEach((edge, i) => {
      const isSelfLoop = edge.fromTable === edge.toTable;
      // centered offsets: n=2 -> ±0.5, n=3 -> -1,0,+1. the canonical sign
      // makes opposite-direction edges in the group curve to opposite sides.
      const raw = i - (group.length - 1) / 2;
      flowEdges.push({
        id: edgeKey(edge),
        source: edge.fromTable,
        target: edge.toTable,
        type: 'modelFloating',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          offset: isSelfLoop ? 0 : edge.fromTable < edge.toTable ? raw : -raw,
          isSelfLoop,
          loopIndex: isSelfLoop ? i : 0,
          isOptional: edge.isOptional,
          isOneToOne: edge.isOneToOne,
        },
      });
    });
  });
  return flowEdges;
}

/**
 * combine the graph with the elk layout result into react-flow nodes/edges.
 * elk reports top-left coordinates, which is exactly what react-flow expects.
 * the estimated sizes are passed along as explicit node dimensions so the
 * rendered boxes match the layout. edges come from graph.edges (one per fk
 * constraint), not from elk's placement-only edge list; laidOut.children is
 * the source of truth for which tables are included, so this works for both
 * the relayout and remove-overlaps call paths.
 */
export function elkToFlow(
  graph: ModelGraph,
  laidOut: ElkNode
): { nodes: ModelTableNodeModel[]; edges: ModelEdgeModel[] } {
  const nodes: ModelTableNodeModel[] = (laidOut.children || []).map((child) => ({
    id: child.id,
    type: 'modelTable',
    position: { x: child.x || 0, y: child.y || 0 },
    width: child.width,
    height: child.height,
    data: { table: graph.tables[child.id] },
    // rendering-only diagram: no connect handles on either side
    connectable: false,
  }));

  const includedIds = new Set(nodes.map((node) => node.id));
  const edges = buildFlowEdges(
    graph.edges.filter((edge) => includedIds.has(edge.fromTable) && includedIds.has(edge.toTable))
  );

  return { nodes, edges };
}
