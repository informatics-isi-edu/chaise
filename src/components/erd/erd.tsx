import '@isrd-isi-edu/chaise/src/assets/scss/_erd.scss';
import '@xyflow/react/dist/style.css';

import { Background, Controls, ReactFlow, useEdgesState, useNodesState, type Edge, type Node } from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';

// components
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { catalogToGraph } from '@isrd-isi-edu/chaise/src/models/erd';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { elkToFlow, graphToElk } from '@isrd-isi-edu/chaise/src/utils/erd-utils';
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

const elk = new ELK();

const ERD = (): JSX.Element => {
  const { dispatchError, errors } = useError();

  /**
   * react-flow with a `nodes` prop is a controlled component: interactions
   * (dragging included) only apply if the change events are folded back into
   * state, which is what these hooks do.
   */
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutDone, setLayoutDone] = useState(false);

  // guard against strict mode calling the effect twice in dev mode
  const setupStarted = useRef<boolean>(false);

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
      .then((introspected: typeof catalog) => {
        const graph = catalogToGraph(introspected);
        return elk.layout(graphToElk(graph)).then((laidOut) => {
          const flow = elkToFlow(graph, laidOut);
          setNodes(flow.nodes);
          setEdges(flow.edges);
          setLayoutDone(true);
        });
      })
      .catch((error: any) => dispatchError({ error }));
  }, []);

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
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                  nodesConnectable={false}
                  edgesReconnectable={false}
                >
                  <Background />
                  <Controls showInteractive={false} />
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

export default ERD;
