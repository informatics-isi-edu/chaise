import '@isrd-isi-edu/chaise/src/assets/scss/_erd.scss';
import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react';
import Dropdown from 'react-bootstrap/Dropdown';

// components
import ErdChecklist from '@isrd-isi-edu/chaise/src/components/erd/checklist';
import ErdMarkerDefs from '@isrd-isi-edu/chaise/src/components/erd/marker-defs';
import ERDFloatingEdge from '@isrd-isi-edu/chaise/src/components/erd/floating-edge';
import ERDTableNode from '@isrd-isi-edu/chaise/src/components/erd/table-node';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { catalogToGraph, type ERDGraph } from '@isrd-isi-edu/chaise/src/models/erd';
import { CustomError } from '@isrd-isi-edu/chaise/src/models/errors';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import {
  useErdStore,
  ERDBaseLayoutAlgorithm,
  ERDDetailLevel,
  ERDDisplayMode,
} from '@isrd-isi-edu/chaise/src/providers/erd';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import {
  elkToFlow,
  graphToElk,
  type ERDEdgeModel,
  type ERDTableNodeModel,
} from '@isrd-isi-edu/chaise/src/utils/erd-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import {
  attachContainerHeightSensors,
  getCssVariable,
} from '@isrd-isi-edu/chaise/src/utils/ui-utils';

// lazy-load elk since it's a large standalone file that only this component needs
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

const DISPLAY_MODEL_LABELS: Record<ERDDisplayMode, string> = {
  [ERDDisplayMode.ERD]: 'ERD',
  [ERDDisplayMode.SIMPLIFIED]: 'Simplified',
};

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

  const displayMode = useErdStore((state) => state.displayMode);
  const setDisplayMode = useErdStore((state) => state.setDisplayMode);

  const detail = useErdStore((state) => state.detail);
  const setDetail = useErdStore((state) => state.setDetail);

  const baseLayout = useErdStore((state) => state.baseLayout);
  const setBaseLayout = useErdStore((state) => state.setBaseLayout);

  const visibleSchemas = useErdStore((state) => state.visibleSchemas);
  const setVisibleSchemas = useErdStore((state) => state.setVisibleSchemas);

  const visibleTableIds = useErdStore((state) => state.visibleTableIds);
  const setVisibleTableIds = useErdStore((state) => state.setVisibleTableIds);

  //-------------------  state:   --------------------//

  /**
   * react-flow with a `nodes` prop is a controlled component: interactions
   * (dragging included) only apply if the change events are folded back into
   * state, which is what these hooks do.
   */
  const [nodes, setNodes, onNodesChange] = useNodesState<ERDTableNodeModel>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ERDEdgeModel>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isRelayouting, setIsRelayouting] = useState(false);
  const [focusedTableId, setFocusedTableId] = useState<string | null>(null);
  const [toolbarOpen, setToolbarOpen] = useState(true);

  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [allSchemas, setAllSchemas] = useState<string[]>([]);

  // same pattern as allSchemas: set once at load, static afterward. keeps
  // the schema field around so the table checklist can be scoped to
  // currently visible schemas, unlike allSchemas this isn't rendered as-is.
  const [allTables, setAllTables] = useState<{ id: string; schema: string }[]>([]);

  //-------------------  refs:   --------------------//

  // the introspected graph, kept so detail changes don't refetch the catalog
  const graphRef = useRef<ERDGraph | null>(null);

  // guard against strict mode calling the effect twice in dev mode
  const setupStarted = useRef<boolean>(false);

  //-------------------  derived values:   --------------------//

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
      className:
        node.id === focusedTableId
          ? 'erd-node-focused'
          : connectedTableIds?.has(node.id)
            ? ''
            : 'erd-node-dimmed',
    }));
  }, [nodes, focusedTableId, connectedTableIds]);

  const displayEdges = useMemo(() => {
    if (!focusedTableId) return edges;
    /*
     * marker fill doesn't follow the path's CSS stroke color, so read the same color-map
     * value the highlighted stroke uses (see $erd-js-colors in _erd.scss)
     */
    const highlightColor = getCssVariable(
      'primary',
      document.querySelector('.erd-container') ?? undefined,
      '#4674a7'
    );
    return edges.map((edge) => {
      const connected = edge.source === focusedTableId || edge.target === focusedTableId;
      return {
        ...edge,
        className: connected ? 'erd-edge-highlighted' : 'erd-edge-dimmed',
        /*
         * the ERD display mode picks its own (crow's foot) markers in
         * floating-edge.tsx off data.highlighted, so the arrow recolor only
         * applies to the simplified mode
         */
        markerEnd: connected && displayMode === ERDDisplayMode.SIMPLIFIED
          ? { type: MarkerType.ArrowClosed, color: highlightColor }
          : edge.markerEnd,
        data: edge.data && { ...edge.data, highlighted: connected },
      };
    });
  }, [edges, focusedTableId, displayMode]);

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

  //-------------------  callbacks:   --------------------//

  const handleNodeClick: NodeMouseHandler<ERDTableNodeModel> = useCallback((_event, node) => {
    setFocusedTableId((current) => (current === node.id ? null : node.id));
  }, []);

  const handlePaneClick = useCallback(() => setFocusedTableId(null), []);

  const relayout = useCallback(
    async (
      graph: ERDGraph,
      displayMode: ERDDisplayMode,
      level: ERDDetailLevel,
      algorithm: ERDBaseLayoutAlgorithm,
      schemas: Set<string>,
      tableIds: Set<string>,
    ) => {
      setIsRelayouting(true);
      // any alert from a previous attempt no longer applies to this one
      removeAllAlerts();
      try {
        const elk = await elkPromise;
        const laidOut = await elk.layout(graphToElk(graph, displayMode, level, algorithm, schemas, tableIds));
        const flow = elkToFlow(graph, laidOut);
        setNodes(flow.nodes);
        setEdges(flow.edges);
        // wait for react-flow to pick up the new nodes before framing them
        window.requestAnimationFrame(() => fitView());
      } catch (error) {
        $log.error('elk layout failed', error);
        addAlert(
          `Could not lay out the diagram with the "${BASE_LAYOUT_LABELS[algorithm]}" algorithm. ` +
            'Try a different layout algorithm from the Layout dropdown.',
          ChaiseAlertType.WARNING
        );
      }
      setIsInitialized(true);
      setIsRelayouting(false);
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
      .then((elk) =>
        elk.layout({
          id: 'root',
          layoutOptions: { 'elk.algorithm': 'sporeOverlap' },
          children: nodes.map((node) => ({
            id: node.id,
            x: node.position.x,
            y: node.position.y,
            width: node.width ?? 0,
            height: node.height ?? 0,
          })),
          /*
           * ids are prefixed because constraint-based edge ids can collide with node ids
           * in elk's flat id space; they're throwaway (elkToFlow rebuilds edges from the
           * graph). self-loops don't affect placement, so they're left out.
           */
          edges: edges
            .filter((edge) => edge.source !== edge.target)
            .map((edge) => ({
              id: `edge:${edge.id}`,
              sources: [edge.source],
              targets: [edge.target],
            })),
        })
      )
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
      .then(({ exportErdToPdf }) => exportErdToPdf(nodes, edges, detail, displayMode))
      .catch((error: unknown) => dispatchError({ error }));
  }, [nodes, edges, detail, displayMode, dispatchError]);

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

  //-------------------  effects:   --------------------//

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
        error: new CustomError(
          'No Catalog',
          'No catalog specified. Use a url like `/chaise/mv/#catalog-id`, or define a `defaultCatalog` in chaise-config.'
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

        const schemas = new Set(
          Object.values(graphRef.current.tables).map((table) => table.schema)
        );
        const sortedSchemas = Array.from(schemas).sort();
        // only the first schema starts checked: large catalogs would otherwise
        // pay a slow first layout over everything before the user trims it
        setVisibleSchemas(new Set(sortedSchemas.slice(0, 1)));
        setAllSchemas(sortedSchemas);

        const tables = Object.values(graphRef.current.tables).map((table) => ({
          id: `${table.schema}:${table.name}`,
          schema: table.schema,
        }));
        setAllTables(tables);
        setVisibleTableIds(new Set(tables.map((table) => table.id)));

        const initial = useErdStore.getState();
        return relayout(
          graphRef.current,
          initial.displayMode,
          initial.detail,
          initial.baseLayout,
          initial.visibleSchemas,
          initial.visibleTableIds
        );
      })
      .catch((error: unknown) => dispatchError({ error }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * detail level, base algorithm, or which schemas/tables are visible all
   * change the whole arrangement, so any of them re-runs the layout. manual
   * repositioning is lost by design (remove-overlaps is the exception,
   * see handleRemoveOverlaps).
   */
  useEffect(() => {
    if (!graphRef.current || !isInitialized) return;
    void relayout(graphRef.current, displayMode, detail, baseLayout, visibleSchemas, visibleTableIds);
  }, [isInitialized, displayMode, detail, baseLayout, visibleSchemas, visibleTableIds, relayout]);

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


  //-------------------  render logic:   --------------------//

  // if there was an error during setup, hide everything
  if (errors.length > 0 && !isInitialized) {
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
              {!isInitialized ? (
                <ChaiseSpinner />
              ) : (
                <>
                  <ErdMarkerDefs />
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
                          <button
                            type='button'
                            className='chaise-btn chaise-btn-tertiary'
                            onClick={() => setToolbarOpen(true)}
                          >
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
                            <button
                              type='button'
                              className='chaise-btn chaise-btn-tertiary chaise-sidebar-open'
                              onClick={() => setToolbarOpen(false)}
                            >
                              <span className='chaise-btn-icon chaise-icon chaise-sidebar-close' />
                              <span>Hide settings</span>
                            </button>
                          </ChaiseTooltip>
                        </div>
                        <div className='erd-toolbar-row'>
                          <label>Display Mode</label>
                          <Dropdown
                            className='chaise-dropdown'
                            onSelect={(opt) => setDisplayMode(opt as ERDDisplayMode)}
                          >
                            <Dropdown.Toggle className='chaise-btn chaise-btn-secondary'>
                              {DISPLAY_MODEL_LABELS[displayMode]}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {Object.entries(DISPLAY_MODEL_LABELS).map(([opt, label]) => (
                                <Dropdown.Item
                                  key={opt}
                                  eventKey={opt}
                                  active={displayMode === opt}
                                >
                                  {label}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                        <div className='erd-toolbar-row'>
                          <label>Detail</label>
                          <Dropdown
                            className='chaise-dropdown'
                            onSelect={(opt) => setDetail(opt as ERDDetailLevel)}
                          >
                            <Dropdown.Toggle className='chaise-btn chaise-btn-secondary'>
                              {DETAIL_LEVEL_LABELS[detail]}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {Object.entries(DETAIL_LEVEL_LABELS).map(([opt, label]) => (
                                <Dropdown.Item
                                  key={opt}
                                  eventKey={opt}
                                  active={detail === opt}
                                >
                                  {label}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                        <div className='erd-toolbar-row'>
                          <label>Layout</label>
                          <Dropdown
                            className='chaise-dropdown'
                            onSelect={(opt) =>
                              setBaseLayout(opt as ERDBaseLayoutAlgorithm)
                            }
                          >
                            <Dropdown.Toggle className='chaise-btn chaise-btn-secondary'>
                              {BASE_LAYOUT_LABELS[baseLayout]}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {Object.entries(BASE_LAYOUT_LABELS).map(([opt, label]) => (
                                <Dropdown.Item
                                  key={opt}
                                  eventKey={opt}
                                  active={baseLayout === opt}
                                >
                                  {label}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                        <div className='erd-toolbar-row'>
                          <ChaiseTooltip
                            placement='top'
                            tooltip='Spread out overlapping tables in the current layout.'
                          >
                            <button
                              type='button'
                              className='erd-remove-overlaps-btn chaise-btn chaise-btn-secondary'
                              onClick={handleRemoveOverlaps}
                            >
                              <span className='chaise-btn-icon fa-solid fa-object-ungroup' />
                              <span>Remove Overlaps</span>
                            </button>
                          </ChaiseTooltip>
                        </div>
                        <div className='erd-toolbar-row'>
                          <ChaiseTooltip
                            placement='top'
                            tooltip='Download the current diagram as a PDF.'
                          >
                            <button
                              type='button'
                              className='erd-export-pdf-btn chaise-btn chaise-btn-secondary'
                              onClick={handleExportPdf}
                            >
                              <span className='chaise-btn-icon fa-solid fa-file-export' />
                              <span>Export PDF</span>
                            </button>
                          </ChaiseTooltip>
                        </div>
                        <ErdChecklist
                          title='Schemas'
                          className='erd-schemas-checklist'
                          items={allSchemas.map((schema) => ({ id: schema, label: schema }))}
                          checkedIds={visibleSchemas}
                          onToggle={handleToggleSchema}
                          emptyMessage='No schemas found.'
                        />
                        <ErdChecklist
                          title='Tables'
                          className='erd-tables-checklist'
                          items={visibleSchemaTableItems}
                          checkedIds={visibleTableIds}
                          onToggle={handleToggleTable}
                          emptyMessage='No tables to show. Select a schema above.'
                        />
                      </Panel>
                    )}

                    <MiniMap pannable zoomable />
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
