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
import ELK from 'elkjs/lib/elk.bundled.js';
import Dropdown from 'react-bootstrap/Dropdown';

// components
import ERDFloatingEdge from '@isrd-isi-edu/chaise/src/components/erd/floating-edge';
import ERDTableNode from '@isrd-isi-edu/chaise/src/components/erd/table-node';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type JSX } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { catalogToGraph, type ERDGraph } from '@isrd-isi-edu/chaise/src/models/erd';

// providers
import { useErdStore, type ERDBaseLayoutAlgorithm, type ERDDetailLevel } from '@isrd-isi-edu/chaise/src/providers/erd';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { elkToFlow, graphToElk, type ERDTableNodeModel } from '@isrd-isi-edu/chaise/src/utils/erd-utils';
import { exportErdToPdf } from '@isrd-isi-edu/chaise/src/utils/erd-pdf-export';
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

const elk = new ELK();

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
  names: 'Names',
  keys: 'Keys',
  keysFks: 'Keys + FKeys',
  full: 'Full',
};

/**
 * display names as ELK itself titles them (minus the 'ELK ' prefix), see
 * https://eclipse.dev/elk/reference/algorithms.html
 */
const BASE_LAYOUT_LABELS: Record<ERDBaseLayoutAlgorithm, string> = {
  layered: 'Layered',
  stress: 'Stress',
  force: 'Force',
  mrtree: 'Mr. Tree',
  radial: 'Radial',
  rectpacking: 'Rectangle Packing',
};

const ERDInner = (): JSX.Element => {
  const { dispatchError, errors } = useError();
  const { fitView } = useReactFlow();

  const detail = useErdStore((state) => state.detail);
  const setDetail = useErdStore((state) => state.setDetail);

  const baseLayout = useErdStore((state) => state.baseLayout);
  const setBaseLayout = useErdStore((state) => state.setBaseLayout);

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

  const relayout = useCallback(
    (graph: ERDGraph, level: ERDDetailLevel, algorithm: ERDBaseLayoutAlgorithm) => {
      setIsRelayouting(true);
      return elk
        .layout(graphToElk(graph, level, algorithm))
        .then((laidOut) => {
          const flow = elkToFlow(graph, laidOut);
          setNodes(flow.nodes);
          setEdges(flow.edges);
          setLayoutDone(true);
          // wait for react-flow to pick up the new nodes before framing them
          window.requestAnimationFrame(() => fitView());
        })
        .finally(() => setIsRelayouting(false));
    },
    [fitView, setNodes, setEdges]
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
    elk
      .layout({
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
      })
      .then((laidOut) => {
        const flow = elkToFlow(graphRef.current as ERDGraph, laidOut);
        setNodes(flow.nodes);
        setEdges(flow.edges);
        window.requestAnimationFrame(() => fitView());
      })
      .catch((error: any) => dispatchError({ error }))
      .finally(() => setIsRelayouting(false));
  }, [nodes, edges, fitView, setNodes, setEdges, dispatchError]);

  const handleExportPdf = useCallback(() => {
    exportErdToPdf(nodes, edges, detail).catch((error: any) => dispatchError({ error }));
  }, [nodes, edges, detail, dispatchError]);

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
        const initial = useErdStore.getState();
        return relayout(graphRef.current, initial.detail, initial.baseLayout);
      })
      .catch((error: any) => dispatchError({ error }));
  }, []);

  /**
   * node sizes change with the detail level, and the algorithm changes the
   * whole arrangement, so either one re-runs the layout. manual
   * repositioning is lost by design (remove-overlaps is the exception,
   * see handleRemoveOverlaps).
   */
  useEffect(() => {
    if (!graphRef.current || !layoutDone) return;
    relayout(graphRef.current, detail, baseLayout).catch((error: any) => dispatchError({ error }));
  }, [detail, baseLayout]);

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
                  <Panel position='top-right' className='erd-toolbar'>
                    <div className='chaise-btn-group'>
                      {Object.entries(DETAIL_LEVEL_LABELS).map(([level, label]) => (
                        <button
                          key={level}
                          type='button'
                          className={`chaise-btn chaise-btn-secondary${detail === level ? ' active' : ''}`}
                          onClick={() => setDetail(level as ERDDetailLevel)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
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
                    <div className='chaise-btn-group'>
                      <button type='button' className='chaise-btn chaise-btn-secondary' onClick={handleRemoveOverlaps}>
                        Remove Overlaps
                      </button>
                    </div>
                    <div className='chaise-btn-group'>
                      <button type='button' className='chaise-btn chaise-btn-secondary' onClick={handleExportPdf}>
                        Export PDF
                      </button>
                    </div>
                  </Panel>
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
