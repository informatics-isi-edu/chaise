import '@isrd-isi-edu/chaise/src/assets/scss/_erd.scss';
import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';

// components
import ERDTableNode from '@isrd-isi-edu/chaise/src/components/erd/table-node';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { catalogToGraph, type ERDGraph } from '@isrd-isi-edu/chaise/src/models/erd';

// providers
import { useErdStore, type ERDDetailLevel, type ERDLayoutAlgorithm } from '@isrd-isi-edu/chaise/src/providers/erd';

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

const DETAIL_LEVELS: ERDDetailLevel[] = ['names', 'keys', 'full'];

const LAYOUT_ALGORITHMS: ERDLayoutAlgorithm[] = ['layered', 'stress', 'force', 'mrtree', 'radial', 'disco'];

const ERDInner = (): JSX.Element => {
  const { dispatchError, errors } = useError();
  const { fitView } = useReactFlow();

  const detail = useErdStore((state) => state.detail);
  const setDetail = useErdStore((state) => state.setDetail);

  const layout = useErdStore((state) => state.layout);
  const setLayout = useErdStore((state) => state.setLayout);

  /**
   * react-flow with a `nodes` prop is a controlled component: interactions
   * (dragging included) only apply if the change events are folded back into
   * state, which is what these hooks do.
   */
  const [nodes, setNodes, onNodesChange] = useNodesState<ERDTableNodeModel>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutDone, setLayoutDone] = useState(false);

  // the introspected graph, kept so detail changes don't refetch the catalog
  const graphRef = useRef<ERDGraph | null>(null);

  // guard against strict mode calling the effect twice in dev mode
  const setupStarted = useRef<boolean>(false);

  const relayout = useCallback(
    (graph: ERDGraph, level: ERDDetailLevel, algorithm: ERDLayoutAlgorithm) => {
      return elk.layout(graphToElk(graph, level, algorithm)).then((laidOut) => {
        const flow = elkToFlow(graph, laidOut);
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setLayoutDone(true);
        // wait for react-flow to pick up the new nodes before framing them
        window.requestAnimationFrame(() => fitView());
      });
    },
    [fitView, setNodes, setEdges]
  );

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
        return relayout(graphRef.current, initial.detail, initial.layout);
      })
      .catch((error: any) => dispatchError({ error }));
  }, []);

  /**
   * node sizes change with the detail level, and the algorithm changes the
   * whole arrangement, so either one re-runs the layout. manual
   * repositioning is lost by design.
   */
  useEffect(() => {
    if (!graphRef.current || !layoutDone) return;
    relayout(graphRef.current, detail, layout).catch((error: any) => dispatchError({ error }));
  }, [detail, layout]);

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
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                  nodesConnectable={false}
                  edgesReconnectable={false}
                  onlyRenderVisibleElements={true}
                >
                  <Background />
                  <Controls showInteractive={false} />
                  <Panel position='top-right' className='erd-toolbar'>
                    <div className='chaise-btn-group'>
                      {DETAIL_LEVELS.map((level) => (
                        <button
                          key={level}
                          type='button'
                          className={`chaise-btn chaise-btn-secondary${detail === level ? ' active' : ''}`}
                          onClick={() => setDetail(level)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <div className='chaise-btn-group'>
                      {LAYOUT_ALGORITHMS.map((algorithm) => (
                        <button
                          key={algorithm}
                          type='button'
                          className={`chaise-btn chaise-btn-secondary${layout === algorithm ? ' active' : ''}`}
                          onClick={() => setLayout(algorithm)}
                        >
                          {algorithm}
                        </button>
                      ))}
                    </div>
                    <div className='chaise-btn-group'>
                      <button type='button' className='chaise-btn chaise-btn-secondary' onClick={handleExportPdf}>
                        Export PDF
                      </button>
                    </div>
                  </Panel>
                </ReactFlow>
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
