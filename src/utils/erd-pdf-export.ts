import { getNodesBounds, getStraightPath, type Edge } from '@xyflow/react';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

// models
import { ERDDetailLevel } from '@isrd-isi-edu/chaise/src/providers/erd';

// utilities
import {
  HEADER_HEIGHT,
  rectCenter,
  rectIntersection,
  ROW_HEIGHT,
  visibleColumns,
  type ERDTableNodeModel,
} from '@isrd-isi-edu/chaise/src/utils/erd-utils';
import { getCssVariable } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

interface ErdSvgColors {
  nodeBorder: string;
  nodeBackground: string;
  headerBackground: string;
  rowBorder: string;
  typeText: string;
  fkBadge: string;
}

/**
 * reads the custom properties `_erd.scss` emits from `_color-map.scss`
 * (`$erd-js-colors`), so this stays in sync with the stylesheet instead of
 * hardcoding colors that can drift from it. called lazily, never at module
 * load time, since the styles aren't guaranteed ready until then.
 */
function getErdSvgColors(): ErdSvgColors {
  const container = document.querySelector('.erd-container') ?? document.documentElement;
  return {
    nodeBorder: getCssVariable('erd-node-border', container, '#999'),
    nodeBackground: getCssVariable('white', container, '#fff'),
    headerBackground: getCssVariable('erd-node-header-background', container, '#f0f0f0'),
    rowBorder: getCssVariable('erd-node-row-border', container, '#e5e5e5'),
    typeText: getCssVariable('placeholder', container, '#888'),
    fkBadge: getCssVariable('erd-fk-badge', container, '#b04a2a'),
  };
}

// no _erd.scss counterpart yet (react-flow's own default edge stroke, not
// something chaise's stylesheet defines), so this stays a plain constant.
const EDGE_COLOR = '#999';

/**
 * rough text width estimate, matching the CHAR_WIDTH heuristic in
 * erd-utils.ts. only used to place the FK badge after the column name; an
 * exact measurement would need a canvas/DOM text-measure pass.
 */
const CHAR_WIDTH = 7;

const PADDING = 20;

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * one table box: border/background rect, header band, and a row per visible
 * column. header and rows are clipped to a rounded rect so corners match the
 * on screen node (which relies on `overflow: hidden` for the same effect).
 */
function nodeToSvg(node: ERDTableNodeModel, detail: ERDDetailLevel, colors: ErdSvgColors): string {
  const { x, y } = node.position;
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  const columns = visibleColumns(node.data.table, detail);
  const clipId = `erd-export-clip-${node.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const rows = columns
    .map((col, i) => {
      const rowY = y + HEADER_HEIGHT + i * ROW_HEIGHT;
      const nameX = x + 10;
      const typeX = x + width - 10;
      const textY = rowY + ROW_HEIGHT / 2;

      const badgeX = nameX + col.name.length * CHAR_WIDTH + 5;
      const fkBadge =
        col.isForeignKey && detail !== ERDDetailLevel.KEYS
          ? `<text x="${badgeX}" y="${textY}" font-size="9" font-weight="bold" fill="${colors.fkBadge}"
              alignment-baseline="middle">FK</text>`
          : '';
      const nameWeight = col.isPrimaryKey ? 'bold' : 'normal';

      return `
        <line x1="${x}" y1="${rowY}" x2="${x + width}" y2="${rowY}" stroke="${colors.rowBorder}" stroke-width="1" />
        <text x="${nameX}" y="${textY}" font-size="12" font-weight="${nameWeight}"
          alignment-baseline="middle">${escapeXml(col.name)}</text>
        ${fkBadge}
        <text x="${typeX}" y="${textY}" font-size="11" fill="${colors.typeText}" text-anchor="end"
          alignment-baseline="middle">${escapeXml(col.type)}</text>
      `;
    })
    .join('');

  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="${colors.nodeBackground}"
        stroke="${colors.nodeBorder}" stroke-width="1" />
      <clipPath id="${clipId}">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" />
      </clipPath>
      <g clip-path="url(#${clipId})">
        <rect x="${x}" y="${y}" width="${width}" height="${HEADER_HEIGHT}" fill="${colors.headerBackground}" />
        <text x="${x + width / 2}" y="${y + HEADER_HEIGHT / 2}" font-size="12" font-weight="bold"
          text-anchor="middle" alignment-baseline="middle">${escapeXml(node.data.table.name)}</text>
        ${rows}
      </g>
    </g>
  `;
}

/**
 * same anchor logic as the on screen edge (floating-edge.tsx): each edge
 * connects whichever point on each node's boundary currently faces the
 * other node, not a fixed handle side, so a dragged/rerouted node exports
 * exactly as it renders on screen.
 */
function edgeToSvg(edge: Edge, nodesById: Map<string, ERDTableNodeModel>): string {
  const source = nodesById.get(edge.source);
  const target = nodesById.get(edge.target);
  if (!source || !target) return '';

  const sourceRect = { ...source.position, width: source.width ?? 0, height: source.height ?? 0 };
  const targetRect = { ...target.position, width: target.width ?? 0, height: target.height ?? 0 };
  const sourcePoint = rectIntersection(sourceRect, rectCenter(targetRect));
  const targetPoint = rectIntersection(targetRect, rectCenter(sourceRect));

  const [path] = getStraightPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
  });

  return `<path d="${path}" fill="none" stroke="${EDGE_COLOR}" stroke-width="1" marker-end="url(#erd-export-arrow)" />`;
}

/**
 * walks the live react-flow nodes/edges (positions included, so dragging and
 * future node removal are reflected automatically) and emits a plain SVG
 * string: rect/text for table boxes, path for edges, no `foreignObject`. that
 * makes it convert cleanly to a vector PDF, unlike react-flow's own DOM.
 */
export function nodesToSvg(nodes: ERDTableNodeModel[], edges: Edge[], detail: ERDDetailLevel): string {
  const bounds = getNodesBounds(nodes);
  const viewBox = `${bounds.x - PADDING} ${bounds.y - PADDING} ${bounds.width + PADDING * 2} ${bounds.height + PADDING * 2}`;
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const colors = getErdSvgColors();

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" font-family="sans-serif">
      <defs>
        <marker id="erd-export-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${EDGE_COLOR}" />
        </marker>
      </defs>
      ${edges.map((edge) => edgeToSvg(edge, nodesById)).join('')}
      ${nodes.map((node) => nodeToSvg(node, detail, colors)).join('')}
    </svg>
  `;
}

/**
 * renders the live diagram (current positions, current detail level) to a
 * real vector PDF, text stays selectable/searchable, and triggers a download.
 * v1 scales the whole diagram to fit one Letter landscape page; pagination
 * for large diagrams is a follow-up (see task notes).
 */
export async function exportErdToPdf(nodes: ERDTableNodeModel[], edges: Edge[], detail: ERDDetailLevel): Promise<void> {
  const svgString = nodesToSvg(nodes, edges, detail);
  const svgEl = new DOMParser().parseFromString(svgString, 'image/svg+xml').documentElement;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const margin = 24;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const height = doc.internal.pageSize.getHeight() - margin * 2;

  await doc.svg(svgEl, { x: margin, y: margin, width, height });
  doc.save('erd.pdf');
}
