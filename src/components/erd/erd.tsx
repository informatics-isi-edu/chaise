import '@isrd-isi-edu/chaise/src/assets/scss/_erd.scss';
import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import Dropdown from 'react-bootstrap/Dropdown';

// components
import ErdChecklist from '@isrd-isi-edu/chaise/src/components/erd/checklist';
import ERDFloatingEdge from '@isrd-isi-edu/chaise/src/components/erd/floating-edge';
import ERDTableNode from '@isrd-isi-edu/chaise/src/components/erd/table-node';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type JSX } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { catalogToGraph, type ERDGraph } from '@isrd-isi-edu/chaise/src/models/erd';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { useErdStore, ERDBaseLayoutAlgorithm, ERDDetailLevel } from '@isrd-isi-edu/chaise/src/providers/erd';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import { elkToFlow, graphToElk, type ERDTableNodeModel } from '@isrd-isi-edu/chaise/src/utils/erd-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

/*
 * elkjs is ~1.5MB, so it's lazy-loaded to keep it out of the initial payload. the fetch
 * starts right away (module evaluation) so it downloads in parallel with the catalog request.
 */
const elkPromise = import('elkjs/lib/elk.bundled.js').then((mod) => new mod.default());

/**
 * registered at module level: an inline object would change identity on every
 * render and make react-flow re-create all nodes.
 */
const nodeTypes = { erdTable: ERDTableNode };

/**
 * same reasoning as nodeTypes: module level, not inline.
 */
const edgeTypes = { erdFloating: ERDFloatingEdge };

const DETAIL_LEVEL_LABELS: Record<ERDDetailLevel, string> = {
  [ERDDetailLevel.NAMES]: 'Table Names',
  [ERDDetailLevel.KEYS]: 'Keys',
  [ERDDetailLevel.KEYS_FKS]: 'Keys + Foreign Keys',
  [ERDDetailLevel.FULL]: 'All Columns',
};

/**
 * display names as ELK itself titles them (minus the 'ELK ' prefix), see
 * https://eclipse.dev/elk/reference/algorithms.html
 */
const BASE_LAYOUT_LABELS: Record<ERDBaseLayoutAlgorithm, string> = {
  [ERDBaseLayoutAlgorithm.LAYERED]: 'Layered',
  [ERDBaseLayoutAlgorithm.STRESS]: 'Stress',
  [ERDBaseLayoutAlgorithm.FORCE]: 'Force',
  [ERDBaseLayoutAlgorithm.MRTREE]: 'Mr. Tree',
  [ERDBaseLayoutAlgorithm.RADIAL]: 'Radial',
  [ERDBaseLayoutAlgorithm.RECTPACKING]: 'Rectangle Packing',
};

const ERDInner = (): JSX.Element => {
  const { dispatchError, errors } = useError();
  const { addAlert, removeAllAlerts } = useAlert();
  const { fitView } = useReactFlow();

  const detail = useErdStore((state) => state.detail);
  const setDetail = useErdStore((state) => state.setDetail);

  const baseLayout = useErdStore((state) => state.baseLayout);
  const setBaseLayout = useErdStore((state) => state.setBaseLayout);

  const visibleSchemas = useErdStore((state) => state.visibleSchemas);
  const setVisibleSchemas = useErdStore((state) => state.setVisibleSchemas);

  const visibleTableIds = useErdStore((state) => state.visibleTableIds);
  const setVisibleTableIds = useErdStore((state) => state.setVisibleTableIds);

  /**
   * react-flow with a `nodes` prop is a controlled component: interactions
   * (dragging included) only apply if the change events are folded back into
   * state, which is what these hooks do.
   */
  const [nodes, setNodes, onNodesChange] = useNodesState<ERDTableNodeModel>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutDone, setLayoutDone] = useState(false);

  // true from the moment any relayout() call (or the remove-overlaps action)
  // starts until it settles. neither elk nor react-flow expose their own
  // progress, this is just our own flag.
  const [isRelayouting, setIsRelayouting] = useState(false);

  // which table (if any) is focused by click. kept separate from nodes/edges
  // state, which stays "clean" for dragging, relayout, and pdf export
  // (export deliberately ignores focus and always exports the full diagram).
  const [focusedTableId, setFocusedTableId] = useState<string | null>(null);

  const [toolbarOpen, setToolbarOpen] = useState(true);

  const connectedTableIds = useMemo(() => {
    if (!focusedTableId) return null;
    const ids = new Set<string>();
    edges.forEach((edge) => {
      if (edge.source === focusedTableId) ids.add(edge.target);
      if (edge.target === focusedTableId) ids.add(edge.source);
    });
    return ids;
  }, [edges, focusedTableId]);

  // nodes/edges as actually rendered: same objects, with a className
  // stamped on based on the current focus. react-flow applies Node/Edge
  // className to their wrapper elements itself, so table-node.tsx and
  // floating-edge.tsx need no changes for this.
  const displayNodes = useMemo(() => {
    if (!focusedTableId) return nodes;
    return nodes.map((node) => ({
      ...node,
      className: node.id === focusedTableId ? 'erd-node-focused' : connectedTableIds?.has(node.id) ? '' : 'erd-node-dimmed',
    }));
  }, [nodes, focusedTableId, connectedTableIds]);

  const displayEdges = useMemo(() => {
    if (!focusedTableId) return edges;
    return edges.map((edge) => {
      const connected = edge.source === focusedTableId || edge.target === focusedTableId;
      return {
        ...edge,
        className: connected ? 'erd-edge-highlighted' : 'erd-edge-dimmed',
        // marker fill doesn't follow the path's CSS stroke color, has to be set directly
        markerEnd: connected ? { type: MarkerType.ArrowClosed, color: '#4674a7' } : edge.markerEnd,
      };
    });
  }, [edges, focusedTableId]);

  const handleNodeClick: NodeMouseHandler<ERDTableNodeModel> = useCallback((_event, node) => {
    setFocusedTableId((current) => (current === node.id ? null : node.id));
  }, []);

  const handlePaneClick = useCallback(() => setFocusedTableId(null), []);

  // the introspected graph, kept so detail changes don't refetch the catalog
  const graphRef = useRef<ERDGraph | null>(null);

  // guard against strict mode calling the effect twice in dev mode
  const setupStarted = useRef<boolean>(false);

  /**
   * elk can throw on pathological inputs (dense/cyclic graphs, certain
   * algorithms on large catalogs), so failure here is expected often enough
   * to handle in one place rather than at every call site. it's recoverable
   * (pick a different algorithm), so it surfaces as a dismissible alert
   * rather than the blocking ErrorModal, and it never rejects: whatever was
   * on screen before (nothing, on the very first layout) stays as-is.
   */
  const relayout = useCallback(
    (
      graph: ERDGraph,
      level: ERDDetailLevel,
      algorithm: ERDBaseLayoutAlgorithm,
      schemas: Set<string>,
      tableIds: Set<string>
    ) => {
      setIsRelayouting(true);
      // any alert from a previous attempt no longer applies to this one
      removeAllAlerts();
      return elkPromise
        .then((elk) => elk.layout(graphToElk(graph, level, algorithm, schemas, tableIds)))
        .then((laidOut) => {
          const flow = elkToFlow(graph, laidOut);
          setNodes(flow.nodes);
          setEdges(flow.edges);
          // wait for react-flow to pick up the new nodes before framing them
          window.requestAnimationFrame(() => fitView());
        })
        .catch((error: unknown) => {
          $log.error('elk layout failed', error);
          addAlert(
            `Could not lay out the diagram with the "${BASE_LAYOUT_LABELS[algorithm]}" algorithm. ` +
              'Try a different layout algorithm from the Layout dropdown.',
            ChaiseAlertType.WARNING
          );
        })
        .finally(() => {
          setLayoutDone(true);
          setIsRelayouting(false);
        });
    },
    [fitView, setNodes, setEdges, addAlert, removeAllAlerts]
  );

  /**
   * one-shot action, not persisted state: seeds sporeOverlap with whatever is
   * actually on screen right now (including manual dragging), not a fresh
   * pass over the graph, which never has positions to de-overlap from. picking
   * a new detail level or base algorithm later does not re-apply this.
   */
  const handleRemoveOverlaps = useCallback(() => {
    if (!graphRef.current) return;
    setIsRelayouting(true);
    elkPromise
      .then((elk) => elk.layout({
        id: 'root',
        layoutOptions: { 'elk.algorithm': 'sporeOverlap' },
        children: nodes.map((node) => ({
          id: node.id,
          x: node.position.x,
          y: node.position.y,
          width: node.width ?? 0,
          height: node.height ?? 0,
        })),
        edges: edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
      }))
      .then((laidOut) => {
        const flow = elkToFlow(graphRef.current as ERDGraph, laidOut);
        setNodes(flow.nodes);
        setEdges(flow.edges);
        window.requestAnimationFrame(() => fitView());
      })
      .catch(() => {
        addAlert(
          'Could not automatically resolve overlapping tables. Try a different layout algorithm, ' +
            'or drag tables apart manually.',
          ChaiseAlertType.WARNING
        );
      })
      .finally(() => setIsRelayouting(false));
  }, [nodes, edges, fitView, setNodes, setEdges, addAlert]);

  const handleExportPdf = useCallback(() => {
    // jspdf/svg2pdf are only needed here, so the whole export module is fetched on first use
    import('@isrd-isi-edu/chaise/src/utils/erd-pdf-export')
      .then(({ exportErdToPdf }) => exportErdToPdf(nodes, edges, detail))
      .catch((error: any) => dispatchError({ error }));
  }, [nodes, edges, detail, dispatchError]);

  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [allSchemas, setAllSchemas] = useState<string[]>([]);

  const handleToggleSchema = useCallback(
    (schema: string) => {
      const next = new Set(visibleSchemas);
      if (next.has(schema)) {
        next.delete(schema);
      } else {
        next.add(schema);
      }
      setVisibleSchemas(next);
    },
    [visibleSchemas, setVisibleSchemas]
  );

  // same pattern as allSchemas: set once at load, static afterward. keeps
  // the schema field around so the table checklist can be scoped to
  // currently visible schemas, unlike allSchemas this isn't rendered as-is.
  const [allTables, setAllTables] = useState<{ id: string; schema: string }[]>([]);

  // tables whose schema is currently hidden are dropped from the list they'd
  // show a checkbox for; that state is already fully explained by the schema
  // checklist, showing them here too would just be a second, confusing
  // control for the same thing.
  const visibleSchemaTableItems = useMemo(
    () =>
      allTables
        .filter((table) => visibleSchemas.has(table.schema))
        .map((table) => ({ id: table.id, label: table.id }))
        // id is "schema:name", so this also groups by schema before alphabetizing within it
        .sort((a, b) => a.id.localeCompare(b.id)),
    [allTables, visibleSchemas]
  );

  const handleToggleTable = useCallback(
    (tableId: string) => {
      const next = new Set(visibleTableIds);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      setVisibleTableIds(next);
    },
    [visibleTableIds, setVisibleTableIds]
  );

  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;

    /**
     * app-wrapper resolved the catalog based on the location hash (or
     * chaise-config's defaultCatalog) before this component rendered. if it's
     * missing, neither was available.
     */
    const catalog = ConfigService.catalog;
    if (!catalog) {
      dispatchError({
        error: new Error(
          'No catalog specified. Use a url like /chaise/erd/#<catalog-id>, or define a defaultCatalog in chaise-config.'
        ),
      });
      return;
    }

    /**
     * app-wrapper fetches the catalog without its schemas (dontFetchSchema=true),
     * so ask for it again without that flag. the catalog is cached, so this only
     * adds the /schema request.
     */
    catalog.server.catalogs
      .get(catalog.id)
      .then((cat: typeof catalog) => {
        graphRef.current = catalogToGraph(cat);
        setCatalogId(graphRef.current.catalogId);
        updateHeadTitle(`Data Model #${graphRef.current.catalogId}`);

        const schemas = new Set(Object.values(graphRef.current.tables).map((table) => table.schema));
        setVisibleSchemas(schemas);
        setAllSchemas(Array.from(schemas).sort());

        const tables = Object.values(graphRef.current.tables).map((table) => ({
          id: `${table.schema}:${table.name}`,
          schema: table.schema,
        }));
        setAllTables(tables);
        setVisibleTableIds(new Set(tables.map((table) => table.id)));

        const initial = useErdStore.getState();
        return relayout(
          graphRef.current,
          initial.detail,
          initial.baseLayout,
          initial.visibleSchemas,
          initial.visibleTableIds
        );
      })
      .catch((error: unknown) => dispatchError({ error }));
  }, []);

  /**
   * detail level, base algorithm, or which schemas/tables are visible all
   * change the whole arrangement, so any of them re-runs the layout. manual
   * repositioning is lost by design (remove-overlaps is the exception,
   * see handleRemoveOverlaps).
   */
  useEffect(() => {
    if (!graphRef.current || !layoutDone) return;
    void relayout(graphRef.current, detail, baseLayout, visibleSchemas, visibleTableIds);
  }, [detail, baseLayout, visibleSchemas, visibleTableIds]);

  /**
   * chaise sets the height of bottom-panel-container in js, not css, so the
   * container chain (and with it the react-flow canvas) has no height until
   * the sensors are attached.
   */
  useLayoutEffect(() => {
    const resizeSensors = attachContainerHeightSensors();
    return () => {
      resizeSensors?.forEach((rs) => rs.detach());
    };
  }, []);

  // if there was an error during setup, hide everything
  if (errors.length > 0 && !layoutDone) {
    return <></>;
  }

  return (
    <div className='app-content-container erd-container'>
      {/* this is just for consistency with all apps (height logic needs it): */}
      <div className='top-panel-container'></div>
      <div className='bottom-panel-container'>
        {/* this is just for consistency with all apps (css rules need it): */}
        <div className='side-panel-resizable close-panel'></div>
        <div className='main-container'>
          <div className='main-body'>
            <div className='erd-canvas'>
              {!layoutDone ? (
                <ChaiseSpinner />
              ) : (
                <>
                {isRelayouting && (
                  <div className='erd-loading-overlay'>
                    <ChaiseSpinner />
                  </div>
                )}
                <ReactFlow
                  nodes={displayNodes}
                  edges={displayEdges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={handleNodeClick}
                  onPaneClick={handlePaneClick}
                  fitView
                  nodesConnectable={false}
                  edgesReconnectable={false}
                  onlyRenderVisibleElements={true}
                  // default is 0.5, too shallow to fit a large catalog; fitView
                  // and manual zoom both get clamped by this
                  minZoom={0.05}
                >
                  <Background />
                  <Controls showInteractive={false} />
                  <Panel position='top-center' className='erd-title'>
                    <h3>Catalog {catalogId} Data Model</h3>
                  </Panel>
                  {!toolbarOpen ? (
                    <Panel position='top-left' className='erd-toolbar-collapsed'>
                      <ChaiseTooltip placement='top' tooltip='Click to show settings'>
                        <button type='button' className='chaise-btn chaise-btn-tertiary' onClick={() => setToolbarOpen(true)}>
                          <span className='chaise-btn-icon chaise-icon chaise-sidebar-open' />
                          <span>Show settings</span>
                        </button>
                      </ChaiseTooltip>
                    </Panel>
                  ) : (
                  <Panel position='top-left' className='erd-toolbar'>
                    <div className='erd-toolbar-header'>
                      <h3 className='erd-toolbar-title'>Settings</h3>
                      <ChaiseTooltip placement='top' tooltip='Click to hide settings'>
                        <button type='button' className='chaise-btn chaise-btn-tertiary' onClick={() => setToolbarOpen(false)}>
                          <span className='chaise-btn-icon chaise-icon chaise-sidebar-close' />
                          <span>Hide settings</span>
                        </button>
                      </ChaiseTooltip>
                    </div>
                    <div className='erd-toolbar-row'>
                      <label>Detail</label>
                      <ChaiseTooltip placement='right' tooltip='How many columns to show per table.'>
                        <span className='chaise-icon chaise-info'></span>
                      </ChaiseTooltip>
                      <Dropdown
                        className='chaise-dropdown'
                        onSelect={(level) => setDetail(level as ERDDetailLevel)}
                      >
                        <Dropdown.Toggle className='chaise-btn chaise-btn-secondary'>
                          {DETAIL_LEVEL_LABELS[detail]}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {Object.entries(DETAIL_LEVEL_LABELS).map(([level, label]) => (
                            <Dropdown.Item key={level} eventKey={level} active={detail === level}>
                              {label}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div className='erd-toolbar-row'>
                      <label>Layout</label>
                      <ChaiseTooltip placement='right' tooltip='Which algorithm arranges the tables.'>
                        <span className='chaise-icon chaise-info'></span>
                      </ChaiseTooltip>
                      <Dropdown
                        className='chaise-dropdown'
                        onSelect={(algorithm) => setBaseLayout(algorithm as ERDBaseLayoutAlgorithm)}
                      >
                        <Dropdown.Toggle className='chaise-btn chaise-btn-secondary'>
                          {BASE_LAYOUT_LABELS[baseLayout]}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {Object.entries(BASE_LAYOUT_LABELS).map(([algorithm, label]) => (
                            <Dropdown.Item key={algorithm} eventKey={algorithm} active={baseLayout === algorithm}>
                              {label}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div className='erd-toolbar-row'>
                      <ChaiseTooltip placement='top' tooltip='Spread out overlapping tables in the current layout.'>
                        <button type='button' className='chaise-btn chaise-btn-secondary' onClick={handleRemoveOverlaps}>
                          <span className='chaise-btn-icon fa-solid fa-object-ungroup' />
                          <span>Remove Overlaps</span>
                        </button>
                      </ChaiseTooltip>
                      <ChaiseTooltip placement='top' tooltip='Download the current diagram as a PDF.'>
                        <button type='button' className='chaise-btn chaise-btn-secondary' onClick={handleExportPdf}>
                          <span className='chaise-btn-icon fa-solid fa-file-export' />
                          <span>Export PDF</span>
                        </button>
                      </ChaiseTooltip>
                    </div>
                    <ErdChecklist
                      title='Schemas'
                      items={allSchemas.map((schema) => ({ id: schema, label: schema }))}
                      checkedIds={visibleSchemas}
                      onToggle={handleToggleSchema}
                      emptyMessage='No schemas found.'
                    />
                    <ErdChecklist
                      title='Tables'
                      items={visibleSchemaTableItems}
                      checkedIds={visibleTableIds}
                      onToggle={handleToggleTable}
                      emptyMessage='No tables to show. Select a schema above.'
                    />
                  </Panel>
                  )}
                </ReactFlow>
                </>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

/**
 * useReactFlow (used for fitView after re-layout) needs a ReactFlowProvider
 * above the component that calls it.
 */
const ERD = (): JSX.Element => (
  <ReactFlowProvider>
    <ERDInner />
  </ReactFlowProvider>
);

export default ERD;
