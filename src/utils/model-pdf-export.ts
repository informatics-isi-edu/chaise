import { getNodesBounds } from '@xyflow/react';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

// models
import type { ModelFocusRelation } from '@isrd-isi-edu/chaise/src/models/model-app';

// providers
import { ModelDetailLevel, ModelDisplayMode } from '@isrd-isi-edu/chaise/src/providers/model';

// utilities
import {
  computeEdgePath,
  ERD_MARKERS,
  erdMarkerId,
  erdMarkerUrls,
  FOCUS_RELATION_ORDER,
  FOCUS_RELATION_TEXT,
  FOCUS_TABLE_LEGEND_TEXT,
  getNodeHeader,
  getNodeHeaderHeight,
  NODE_SIZING,
  visibleColumns,
  type ModelEdgeModel,
  type ERDMarkerShape,
  type ModelTableNodeModel,
} from '@isrd-isi-edu/chaise/src/utils/model-utils';
import { getCssVariable } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

export interface ModelPdfExportOptions {
  nodes: ModelTableNodeModel[];
  edges: ModelEdgeModel[];
  detail: ModelDetailLevel;
  displayMode: ModelDisplayMode;
  /**
   * the table whose neighbors are shown, or null for the whole catalog
   */
  focusTableId: string | null;
  focusRelations: Map<string, ModelFocusRelation>;
}

interface ModelSvgColors {
  nodeBorder: string;
  nodeBackground: string;
  headerBackground: string;
  focusHeaderBackground: string;
  focusHeaderText: string;
  inboundHeaderBackground: string;
  outboundHeaderBackground: string;
  rowBorder: string;
  typeText: string;
  fkBadge: string;
}

/**
 * reads the custom properties `_model.scss` emits from `_color-map.scss`
 * (`$model-js-colors`), so this stays in sync with the stylesheet instead of
 * hardcoding colors that can drift from it. called lazily, never at module
 * load time, since the styles aren't guaranteed ready until then.
 */
function getModelSvgColors(): ModelSvgColors {
  const container = document.querySelector('.model-container') ?? document.documentElement;
  return {
    nodeBorder: getCssVariable('model-node-border', container, '#999'),
    nodeBackground: getCssVariable('white', container, '#fff'),
    headerBackground: getCssVariable('model-node-header-background', container, '#f0f0f0'),
    focusHeaderBackground: getCssVariable('primary', container, '#4674a7'),
    focusHeaderText: getCssVariable('white', container, '#fff'),
    inboundHeaderBackground: getCssVariable('model-node-header-inbound', container, '#c8ece6'),
    outboundHeaderBackground: getCssVariable('model-node-header-outbound', container, '#f8ddbf'),
    rowBorder: getCssVariable('model-node-row-border', container, '#e5e5e5'),
    typeText: getCssVariable('placeholder', container, '#888'),
    fkBadge: getCssVariable('model-fk-badge', container, '#b04a2a'),
  };
}

// no _model.scss counterpart yet (react-flow's own default edge stroke, not
// something chaise's stylesheet defines), so this stays a plain constant.
const EDGE_COLOR = '#999';

const PADDING = 20;

const HEADER_FONT_SIZE = 12;

/**
 * the "both" header fill, a gradient like the on screen one (_model.scss)
 */
const BOTH_GRADIENT_ID = 'model-export-both';

/**
 * the legend's band at the bottom of the page, in pt
 */
const LEGEND = {
  HEIGHT: 14,
  GAP: 10,
  SWATCH: 10,
  FONT_SIZE: 9,
  // rough Helvetica width per character at FONT_SIZE
  CHAR_WIDTH: 5,
  ITEM_GAP: 14,
} as const;

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * the width of header text in the PDF's own font metrics
 */
type MeasureHeaderText = (text: string) => number;

/**
 * `text` cut with an ellipsis to fit `maxWidth`, since svg text can't end in one by itself
 */
function fitText(text: string, maxWidth: number, measure: MeasureHeaderText): string {
  if (measure(text) <= maxWidth) return text;
  let end = text.length - 1;
  while (end > 0 && measure(`${text.slice(0, end)}…`) > maxWidth) end -= 1;
  return `${text.slice(0, end)}…`;
}

/**
 * the header's lines, cut to the box's width the way the screen does it: on one line
 * the schema part gives way before the table name. measured with real font widths;
 * the character estimate that sized the box runs short for capitals.
 */
function headerLines(node: ModelTableNodeModel, width: number, measure: MeasureHeaderText): string[] {
  const { schemaPart, tablePart, lineCount } = getNodeHeader(node.data.table);
  const maxWidth = width - NODE_SIZING.HEADER_EXTRA_WIDTH;
  if (lineCount === 2) return [fitText(schemaPart, maxWidth, measure), fitText(tablePart, maxWidth, measure)];

  const full = schemaPart + tablePart;
  if (measure(full) <= maxWidth) return [full];
  for (let end = schemaPart.length - 1; end > 0; end -= 1) {
    const shortened = `${schemaPart.slice(0, end)}…${tablePart}`;
    if (measure(shortened) <= maxWidth) return [shortened];
  }
  return [fitText(tablePart, maxWidth, measure)];
}

/**
 * one table box: border/background rect, header band, and a row per visible
 * column. header and rows are clipped to a rounded rect so corners match the
 * on screen node (which relies on `overflow: hidden` for the same effect).
 * `index` keeps clip ids unique; ids made from table names could collide.
 */
function nodeToSvg(
  node: ModelTableNodeModel,
  index: number,
  options: ModelPdfExportOptions,
  colors: ModelSvgColors,
  measure: MeasureHeaderText
): string {
  const { detail, focusTableId, focusRelations } = options;
  const { x, y } = node.position;
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  const columns = visibleColumns(node.data.table, detail);
  const clipId = `model-export-clip-${index}`;

  const lines = headerLines(node, width, measure);
  const headerHeight = getNodeHeaderHeight(lines.length);
  // the lines are centered in the header, HEADER_LINE_HEIGHT apart
  const firstLineY = y + (headerHeight - lines.length * NODE_SIZING.HEADER_LINE_HEIGHT) / 2 + NODE_SIZING.HEADER_LINE_HEIGHT / 2;

  // same colors as the on screen header classes in table-node.tsx
  const relation = focusRelations.get(node.id);
  let headerFill = colors.headerBackground;
  let headerTextFill = '';
  if (node.id === focusTableId) {
    headerFill = colors.focusHeaderBackground;
    headerTextFill = ` fill="${colors.focusHeaderText}"`;
  } else if (relation === 'inbound') {
    headerFill = colors.inboundHeaderBackground;
  } else if (relation === 'outbound') {
    headerFill = colors.outboundHeaderBackground;
  } else if (relation === 'both') {
    headerFill = `url(#${BOTH_GRADIENT_ID})`;
  }

  const headerTexts = lines
    .map((line, i) => `
      <text x="${x + width / 2}" y="${firstLineY + i * NODE_SIZING.HEADER_LINE_HEIGHT}" font-size="${HEADER_FONT_SIZE}" font-weight="bold"
        text-anchor="middle" alignment-baseline="middle"${headerTextFill}>${escapeXml(line)}</text>
    `)
    .join('');

  const rows = columns
    .map((col, i) => {
      const rowY = y + headerHeight + i * NODE_SIZING.ROW_HEIGHT;
      const nameX = x + 10;
      const typeX = x + width - 10;
      const textY = rowY + NODE_SIZING.ROW_HEIGHT / 2;

      // a rough estimate; an exact measurement would need a canvas/DOM text-measure pass
      const badgeX = nameX + col.name.length * NODE_SIZING.CHAR_WIDTH + 5;
      const fkBadge =
        col.isForeignKey && detail !== ModelDetailLevel.KEYS
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
        <rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="${headerFill}" />
        ${headerTexts}
        ${rows}
      </g>
    </g>
  `;
}

/**
 * one crow's foot marker def for the export svg, mirroring marker-defs.tsx
 * (same ERD_MARKERS spec, so canvas and PDF cannot drift apart)
 */
function erdMarkerToSvg(shape: ERDMarkerShape): string {
  const spec = ERD_MARKERS.SHAPES[shape];
  const circle = 'circle' in spec
    ? `<circle cx="${spec.circle.cx}" cy="${spec.circle.cy}" r="${spec.circle.r}" fill="none" stroke="${ERD_MARKERS.COLOR}" stroke-width="1.5" />`
    : '';
  const paths = spec.paths
    .map((d) => `<path d="${d}" fill="none" stroke="${ERD_MARKERS.COLOR}" stroke-width="1.5" />`)
    .join('');
  return `
    <marker id="${erdMarkerId(shape)}" viewBox="0 0 ${ERD_MARKERS.WIDTH} ${ERD_MARKERS.HEIGHT}"
      refX="${ERD_MARKERS.WIDTH}" refY="${ERD_MARKERS.REF_Y}" markerWidth="${ERD_MARKERS.WIDTH}"
      markerHeight="${ERD_MARKERS.HEIGHT}" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      ${circle}${paths}
    </marker>
  `;
}

/**
 * same geometry as the on screen edge (floating-edge.tsx): both go through
 * computeEdgePath, so a dragged/rerouted node, parallel fk curves, and
 * self-loops all export exactly as rendered. markers are orient=auto, so end
 * decorations follow the path tangent on curves too. end decorations depend
 * on the display mode, same as the canvas.
 */
function edgeToSvg(edge: ModelEdgeModel, nodesById: Map<string, ModelTableNodeModel>, displayMode: ModelDisplayMode): string {
  const source = nodesById.get(edge.source);
  const target = nodesById.get(edge.target);
  if (!source || !target) return '';

  const sourceRect = { ...source.position, width: source.width ?? 0, height: source.height ?? 0 };
  const targetRect = { ...target.position, width: target.width ?? 0, height: target.height ?? 0 };
  const path = computeEdgePath(sourceRect, targetRect, edge.data);

  const markers = displayMode === ModelDisplayMode.ERD
    ? `marker-start="${erdMarkerUrls(edge.data).markerStart}" marker-end="${erdMarkerUrls(edge.data).markerEnd}"`
    : 'marker-end="url(#model-export-arrow)"';
  return `<path d="${path}" fill="none" stroke="${EDGE_COLOR}" stroke-width="1" ${markers} />`;
}

/**
 * the left-to-right gradient behind a "both" header or swatch
 */
function bothGradientToSvg(id: string, colors: ModelSvgColors): string {
  return `
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${colors.inboundHeaderBackground}" />
      <stop offset="1" stop-color="${colors.outboundHeaderBackground}" />
    </linearGradient>
  `;
}

/**
 * walks the live react-flow nodes/edges (positions included, so dragging and
 * future node removal are reflected automatically) and emits a plain SVG
 * string: rect/text for table boxes, path for edges, no `foreignObject`. that
 * makes it convert cleanly to a vector PDF, unlike react-flow's own DOM.
 */
function nodesToSvg(options: ModelPdfExportOptions, colors: ModelSvgColors, measure: MeasureHeaderText): string {
  const { nodes, edges, displayMode } = options;
  const bounds = getNodesBounds(nodes);
  const viewBox = `${bounds.x - PADDING} ${bounds.y - PADDING} ${bounds.width + PADDING * 2} ${bounds.height + PADDING * 2}`;
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const shapes = Object.keys(ERD_MARKERS.SHAPES) as ERDMarkerShape[];
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" font-family="sans-serif">
      <defs>
        <marker id="model-export-arrow" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${EDGE_COLOR}" />
        </marker>
        ${shapes.map((shape) => erdMarkerToSvg(shape)).join('')}
        ${bothGradientToSvg(BOTH_GRADIENT_ID, colors)}
      </defs>
      ${edges.map((edge) => edgeToSvg(edge, nodesById, displayMode)).join('')}
      ${nodes.map((node, index) => nodeToSvg(node, index, options, colors, measure)).join('')}
    </svg>
  `;
}

/**
 * the on screen legend (relation-legend.tsx) as one row of swatches and labels,
 * sized in pt, or null when it wouldn't show there: outside neighbors mode, or
 * when the focus table isn't among the exported nodes.
 */
function legendToSvg(options: ModelPdfExportOptions, colors: ModelSvgColors): { svg: string; width: number } | null {
  const { nodes, focusTableId, focusRelations } = options;
  if (!focusTableId || !nodes.some((node) => node.id === focusTableId)) return null;

  const present = new Set(nodes.map((node) => focusRelations.get(node.id)));
  const items = [
    { label: FOCUS_TABLE_LEGEND_TEXT.legend, fill: colors.focusHeaderBackground },
    ...FOCUS_RELATION_ORDER.filter((relation) => present.has(relation)).map((relation) => ({
      label: FOCUS_RELATION_TEXT[relation].legend,
      fill: relation === 'inbound'
        ? colors.inboundHeaderBackground
        : relation === 'outbound'
          ? colors.outboundHeaderBackground
          : 'url(#model-export-legend-both)',
    })),
  ];

  // the first swatch's stroke would otherwise be cut by the svg's edge
  const inset = 0.5;
  let x = inset;
  const swatchY = (LEGEND.HEIGHT - LEGEND.SWATCH) / 2;
  const parts = items.map((item) => {
    const part = `
      <rect x="${x}" y="${swatchY}" width="${LEGEND.SWATCH}" height="${LEGEND.SWATCH}" rx="2"
        fill="${item.fill}" stroke="${colors.nodeBorder}" stroke-width="0.75" />
      <text x="${x + LEGEND.SWATCH + 4}" y="${LEGEND.HEIGHT / 2}" font-size="${LEGEND.FONT_SIZE}"
        alignment-baseline="middle">${escapeXml(item.label)}</text>
    `;
    x += LEGEND.SWATCH + 4 + item.label.length * LEGEND.CHAR_WIDTH + LEGEND.ITEM_GAP;
    return part;
  });
  const width = x - LEGEND.ITEM_GAP + inset;

  return {
    width,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${LEGEND.HEIGHT}" font-family="sans-serif">
        <defs>${bothGradientToSvg('model-export-legend-both', colors)}</defs>
        ${parts.join('')}
      </svg>
    `,
  };
}

/**
 * renders the live diagram (current positions, current detail level) to a
 * real vector PDF, text stays selectable/searchable, and triggers a download.
 * v1 scales the whole diagram to fit one Letter landscape page; pagination
 * for large diagrams is a follow-up (see task notes). the legend is drawn
 * separately at a fixed size in a band at the bottom, so it doesn't scale with
 * the diagram.
 */
export async function exportModelToPdf(options: ModelPdfExportOptions): Promise<void> {
  const colors = getModelSvgColors();
  const parse = (svg: string) => new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  // svg2pdf draws the headers' bold sans-serif as helvetica bold
  const measureHeader: MeasureHeaderText = (text) => {
    doc.setFont('helvetica', 'bold');
    return doc.getStringUnitWidth(text) * HEADER_FONT_SIZE;
  };
  const margin = 24;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let height = doc.internal.pageSize.getHeight() - margin * 2;

  const legend = legendToSvg(options, colors);
  if (legend) {
    height -= LEGEND.HEIGHT + LEGEND.GAP;
    await doc.svg(parse(legend.svg), {
      x: margin,
      y: margin + height + LEGEND.GAP,
      width: Math.min(legend.width, width),
      height: LEGEND.HEIGHT,
    });
  }

  await doc.svg(parse(nodesToSvg(options, colors, measureHeader)), { x: margin, y: margin, width, height });
  doc.save('model.pdf');
}
