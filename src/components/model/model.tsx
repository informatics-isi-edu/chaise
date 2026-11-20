import '@isrd-isi-edu/chaise/src/assets/scss/_model.scss';
import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
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
import ModelChecklist from '@isrd-isi-edu/chaise/src/components/model/checklist';
import ErdMarkerDefs from '@isrd-isi-edu/chaise/src/components/model/marker-defs';
import ModelRelationLegend from '@isrd-isi-edu/chaise/src/components/model/relation-legend';
import ModelScopeDropdown from '@isrd-isi-edu/chaise/src/components/model/scope-dropdown';
import ModelFloatingEdge from '@isrd-isi-edu/chaise/src/components/model/floating-edge';
import ModelTableNode from '@isrd-isi-edu/chaise/src/components/model/table-node';
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
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import type { Catalog } from '@isrd-isi-edu/ermrestjs/src/models/catalog';
import { catalogToGraph, type ModelGraph } from '@isrd-isi-edu/chaise/src/models/model-app';
import { CustomError } from '@isrd-isi-edu/chaise/src/models/errors';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import {
  useModelStore,
  ModelBaseLayoutAlgorithm,
  ModelDetailLevel,
  ModelDisplayMode,
} from '@isrd-isi-edu/chaise/src/providers/model';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import {
  elkToFlow,
  getFocusRelations,
  getFocusTableIds,
  getLaidOutBounds,
  getModelAppURL,
  graphToElk,
  resolveScopeFromURL,
  SIMPLIFIED_ARROW_MARKER,
  type ModelEdgeModel,
  type ModelTableNodeModel,
} from '@isrd-isi-edu/chaise/src/utils/model-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { getCatalogId } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
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
const nodeTypes = { modelTable: ModelTableNode };

/**
 * same reasoning as nodeTypes: module level, not inline.
 */
const edgeTypes = { modelFloating: ModelFloatingEdge };

const DISPLAY_MODE_LABELS: Record<ModelDisplayMode, string> = {
  [ModelDisplayMode.SIMPLIFIED]: 'Simplified',
  [ModelDisplayMode.ERD]: 'ERD-like',
};

const DETAIL_LEVEL_LABELS: Record<ModelDetailLevel, string> = {
  [ModelDetailLevel.NAMES]: 'Table names',
  [ModelDetailLevel.KEYS]: 'Keys',
  [ModelDetailLevel.KEYS_FKS]: 'Keys + foreign keys',
  [ModelDetailLevel.FULL]: 'All columns',
};

/**
 * both lists' empty state when the focus table has no neighbors
 */
const NO_NEIGHBORS_MESSAGE = 'This table has no neighbors.';

/**
 * display names as ELK itself titles them (minus the 'ELK ' prefix), see
 * https://eclipse.dev/elk/reference/algorithms.html
 */
const BASE_LAYOUT_LABELS: Record<ModelBaseLayoutAlgorithm, string> = {
  [ModelBaseLayoutAlgorithm.LAYERED]: 'Layered',
  [ModelBaseLayoutAlgorithm.STRESS]: 'Stress',
  [ModelBaseLayoutAlgorithm.FORCE]: 'Force',
  [ModelBaseLayoutAlgorithm.MRTREE]: 'Mr. Tree',
  [ModelBaseLayoutAlgorithm.RADIAL]: 'Radial',
  [ModelBaseLayoutAlgorithm.RECTPACKING]: 'Rectangle Packing',
};

/**
 * Returns a copy of `set` with `ids` added or removed
 * @param checked whether to add or remove the ids
 */
function withMany(set: Set<string>, ids: string[], checked: boolean): Set<string> {
  const next = new Set(set);
  ids.forEach((id) => {
    if (checked) next.add(id);
    else next.delete(id);
  });
  return next;
}

/**
 * whether two sets hold the same ids
 */
function sameMembers(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && Array.from(a).every((id) => b.has(id));
}

/**
 * what's checked in catalog mode, saved when entering focus mode so leaving it restores the same view
 */
interface CatalogSelection {
  schemas: Set<string>;
  tableIds: Set<string>;
}

const ModelInner = (): JSX.Element => {
  const { dispatchError, errors } = useError();
  const { addAlert, removeAllAlerts } = useAlert();
  const { fitBounds } = useReactFlow();

  const displayMode = useModelStore((state) => state.displayMode);
  const setDisplayMode = useModelStore((state) => state.setDisplayMode);

  const detail = useModelStore((state) => state.detail);
  const setDetail = useModelStore((state) => state.setDetail);

  const baseLayout = useModelStore((state) => state.baseLayout);
  const setBaseLayout = useModelStore((state) => state.setBaseLayout);

  const visibleSchemas = useModelStore((state) => state.visibleSchemas);
  const setVisibleSchemas = useModelStore((state) => state.setVisibleSchemas);

  const visibleTableIds = useModelStore((state) => state.visibleTableIds);
  const setVisibleTableIds = useModelStore((state) => state.setVisibleTableIds);

  const focusTableId = useModelStore((state) => state.focusTableId);
  const setFocusTableId = useModelStore((state) => state.setFocusTableId);

  const setFocusRelations = useModelStore((state) => state.setFocusRelations);

  //-------------------  state:   --------------------//

  /**
   * react-flow with a `nodes` prop is a controlled component: interactions
   * (dragging included) only apply if the change events are folded back into
   * state, which is what these hooks do.
   */
  const [nodes, setNodes, onNodesChange] = useNodesState<ModelTableNodeModel>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ModelEdgeModel>([]);
  // set by setup once the graph and the first scope are ready; the relayout effect then draws
  const [isGraphReady, setIsGraphReady] = useState(false);
  // set once the first layout is done
  const [isInitialized, setIsInitialized, isInitializedRef] = useStateRef(false);

  const [isRelayouting, setIsRelayouting] = useState(false);

  const [highlightedTableId, setHighlightedTableId] = useState<string | null>(null);

  const [toolbarOpen, setToolbarOpen] = useState(true);

  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [allSchemas, setAllSchemas] = useState<string[]>([]);

  // same pattern as allSchemas: set by applyScope. keeps the schema field
  // around so the table checklist can be scoped to currently visible schemas,
  // unlike allSchemas this isn't rendered as-is.
  const [allTables, setAllTables] = useState<{ id: string; schema: string }[]>([]);

  // kept here rather than in the checklists, which unmount when the toolbar collapses
  const [schemaFilterText, setSchemaFilterText] = useState('');
  const [tableFilterText, setTableFilterText] = useState('');

  // every table in the catalog's diagram, for the scope dropdown; set once at load
  const [catalogTableIds, setCatalogTableIds] = useState<string[]>([]);

  /*
   * the tables in the last committed layout: the legend lists only their kinds, and a failed
   * layout reads the ref to tell whether they still match
   */
  const [drawnTableIds, setDrawnTableIds, drawnTableIdsRef] = useStateRef<Set<string>>(new Set());

  //-------------------  refs:   --------------------//

  // the introspected graph, kept so detail changes don't refetch the catalog
  const graphRef = useRef<ModelGraph | null>(null);

  // guard against strict mode calling the effect twice in dev mode
  const setupStarted = useRef<boolean>(false);

  /*
   * every layout takes the next number and only the latest may commit. elk's
   * queue keeps its own results in order, but the empty-diagram path in
   * relayout skips it, so an older queued layout could land after it.
   */
  const layoutRequestRef = useRef<number>(0);

  // the catalog with its schemas (not ConfigService.catalog, which differs after a snapshot version correction)
  const catalogRef = useRef<Catalog | null>(null);

  /**
   * keep track of the selection, so we can get back to it when model scope changes
   */
  const catalogSelectionRef = useRef<CatalogSelection | null>(null);

  //-------------------  derived values:   --------------------//

  // a highlighted table that has since been hidden must not dim everything that's left
  const activeHighlightId = useMemo(
    () => (highlightedTableId && nodes.some((node) => node.id === highlightedTableId) ? highlightedTableId : null),
    [nodes, highlightedTableId]
  );

  const connectedTableIds = useMemo(() => {
    if (!activeHighlightId) return null;
    const ids = new Set<string>();
    edges.forEach((edge) => {
      if (edge.source === activeHighlightId) ids.add(edge.target);
      if (edge.target === activeHighlightId) ids.add(edge.source);
    });
    return ids;
  }, [edges, activeHighlightId]);

  // nodes/edges as actually rendered: same objects, with a className
  // stamped on based on the current highlight. react-flow applies Node/Edge
  // className to their wrapper elements itself, so table-node.tsx and
  // floating-edge.tsx need no changes for this.
  const displayNodes = useMemo(() => {
    if (!activeHighlightId) return nodes;
    return nodes.map((node) => ({
      ...node,
      className:
        node.id === activeHighlightId
          ? 'model-node-highlighted'
          : connectedTableIds?.has(node.id)
            ? ''
            : 'model-node-dimmed',
    }));
  }, [nodes, activeHighlightId, connectedTableIds]);

  const displayEdges = useMemo(() => {
    if (!activeHighlightId) return edges;
    /*
     * marker fill doesn't follow the path's CSS stroke color, so read the same color-map
     * value the highlighted stroke uses (see $model-js-colors in _model.scss)
     */
    const highlightColor = getCssVariable(
      'primary',
      document.querySelector('.model-container') ?? undefined,
      '#4674a7'
    );
    return edges.map((edge) => {
      const connected = edge.source === activeHighlightId || edge.target === activeHighlightId;
      return {
        ...edge,
        className: connected ? 'model-edge-highlighted' : 'model-edge-dimmed',
        /*
         * the ERD display mode picks its own (crow's foot) markers in
         * floating-edge.tsx off data.highlighted, so the arrow recolor only
         * applies to the simplified mode
         */
        markerEnd: connected && displayMode === ModelDisplayMode.SIMPLIFIED
          ? { ...SIMPLIFIED_ARROW_MARKER, color: highlightColor }
          : edge.markerEnd,
        data: edge.data && { ...edge.data, highlighted: connected },
      };
    });
  }, [edges, activeHighlightId, displayMode]);

  // tables whose schema is currently hidden are dropped from the list they'd
  // show a checkbox for; that state is already fully explained by the schema
  // checklist, showing them here too would just be a second, confusing
  // control for the same thing.
  const tableItems = useMemo(
    () =>
      allTables
        .filter((table) => visibleSchemas.has(table.schema))
        .map((table) => ({ id: table.id, label: table.id }))
        // id is "schema:name", so this also groups by schema before alphabetizing within it
        .sort((a, b) => a.id.localeCompare(b.id)),
    [allTables, visibleSchemas]
  );

  const schemaItems = useMemo(() => allSchemas.map((schema) => ({ id: schema, label: schema })), [allSchemas]);

  //-------------------  callbacks:   --------------------//

  const handleNodeClick: NodeMouseHandler<ModelTableNodeModel> = useCallback((_event, node) => {
    setHighlightedTableId((current) => (current === node.id ? null : node.id));
  }, []);

  const handlePaneClick = useCallback(() => setHighlightedTableId(null), []);

  /**
   * scope the diagram to a table's neighborhood (see getFocusTableIds), or to
   * the whole catalog when scopeTableId is null. resets both lists, what's
   * checked in them, and the click highlight, which may point outside the new
   * set. every layout, the first one included, goes through the relayout
   * effect.
   */
  const applyScope = useCallback(
    (
      graph: ModelGraph,
      /**
       * the table id that will be focused, or null to show the whole catalog.
       */
      scopeTableId: string | null,
      /**
       * the previous state
       */
      prevState?: {
        /**
         * the catalog view saved when the user last left catalog mode (null when the page opened on a focus url)
         */
        catalogSelection: CatalogSelection | null;
        /**
         * the table in focus before this switch
         */
        focusTableId: string | null;
      }
    ) => {
      const tableIds = scopeTableId
        ? getFocusTableIds(graph, scopeTableId)
        : new Set(Object.keys(graph.tables));
      // the lists only control the neighbors; the focus table is always drawn (graphToElk)
      if (scopeTableId) tableIds.delete(scopeTableId);
      const tables = Array.from(tableIds, (id) => ({ id, schema: graph.tables[id].schema }));
      const sortedSchemas = Array.from(new Set(tables.map((table) => table.schema))).sort();

      let schemas: Set<string>;
      let checkedTableIds = tableIds;
      if (scopeTableId) {
        schemas = new Set(sortedSchemas);
      } else if (prevState?.catalogSelection) {
        schemas = prevState.catalogSelection.schemas;
        checkedTableIds = prevState.catalogSelection.tableIds;
      } else if (prevState?.focusTableId) {
        // the page opened on a focus url, so nothing was saved; stay near the table that was in focus
        schemas = new Set([graph.tables[prevState.focusTableId].schema]);
      } else {
        /*
         * only the first schema starts checked: large catalogs would otherwise
         * pay a slow first layout over everything before the user trims it
         */
        schemas = new Set(sortedSchemas.slice(0, 1));
      }

      setAllSchemas(sortedSchemas);
      setAllTables(tables);
      setFocusTableId(scopeTableId);
      setFocusRelations(scopeTableId ? getFocusRelations(graph, scopeTableId) : new Map());
      setVisibleSchemas(schemas);
      setVisibleTableIds(checkedTableIds);
      setHighlightedTableId(null);
      updateHeadTitle(`Data Model #${graph.catalogId}${scopeTableId ? `: ${scopeTableId}` : ''}`);
    },
    [setFocusTableId, setFocusRelations, setVisibleSchemas, setVisibleTableIds]
  );

  /**
   * the single way the scope changes after setup: the scope dropdown pushes a
   * history entry; back/forward and hand-edited hashes don't.
   * state comes from the store, not this render, since the hashchange listener
   * outlives renders.
   */
  const navigateToScope = useCallback(
    (scopeTableId: string | null, push: boolean) => {
      const graph = graphRef.current;
      if (!graph) return;
      const { focusTableId: currentFocusTableId, visibleSchemas: schemas, visibleTableIds: tableIds } =
        useModelStore.getState();
      if (scopeTableId === currentFocusTableId) return;

      if (currentFocusTableId === null) {
        catalogSelectionRef.current = { schemas, tableIds };
      }
      // before applyScope, so its head title lands on the new history entry
      if (push) {
        windowRef.history.pushState(null, '', getModelAppURL(scopeTableId ? graph.tables[scopeTableId] : null));
      }
      setSchemaFilterText('');
      setTableFilterText('');
      applyScope(graph, scopeTableId, {
        catalogSelection: catalogSelectionRef.current,
        focusTableId: currentFocusTableId,
      });
    },
    [applyScope]
  );

  // a stable callback, so the memoized scope dropdown doesn't re-render with the diagram
  const handleScopeSelect = useCallback((tableId: string | null) => navigateToScope(tableId, true), [navigateToScope]);

  /**
   * frame freshly laid out nodes. fitView frames only what react-flow has measured when it resolves,
   * which races the new nodes' measurement, so it could frame a subset and leave the rest off-screen
   * (and, with onlyRenderVisibleElements, unrendered). fitBounds uses elk's sizes directly. the first
   * layout is framed by <ReactFlow fitView>, since react-flow only mounts once it's done.
   */
  const frameNodes = useCallback(
    (laidOutNodes: ModelTableNodeModel[]) => {
      if (!isInitializedRef.current) return;
      // after react-flow has the new nodes, so the old ones don't flash at the new zoom
      window.requestAnimationFrame(() => void fitBounds(getLaidOutBounds(laidOutNodes)));
    },
    [fitBounds, isInitializedRef]
  );

  const relayout = useCallback(
    async (
      graph: ModelGraph,
      displayMode: ModelDisplayMode,
      level: ModelDetailLevel,
      algorithm: ModelBaseLayoutAlgorithm,
      schemas: Set<string>,
      tableIds: Set<string>,
      focusTableId: string | null
    ) => {
      const requestId = ++layoutRequestRef.current;
      const isCurrent = () => requestId === layoutRequestRef.current;
      setIsRelayouting(true);
      // any alert from a previous attempt no longer applies to this one
      removeAllAlerts();
      let includedIds: Set<string> | null = null;
      try {
        const elkGraph = graphToElk(graph, displayMode, level, algorithm, schemas, tableIds, focusTableId);
        includedIds = new Set((elkGraph.children ?? []).map((child) => child.id));
        if (includedIds.size === 0) {
          // nothing to place, and radial throws on an empty graph
          setNodes([]);
          setEdges([]);
        } else {
          const elk = await elkPromise;
          const laidOut = await elk.layout(elkGraph);
          if (!isCurrent()) return;
          const flow = elkToFlow(graph, laidOut);
          setNodes(flow.nodes);
          setEdges(flow.edges);
          frameNodes(flow.nodes);
        }
        setDrawnTableIds(includedIds);
      } catch (error) {
        $log.error('elk layout failed', error);
        if (!isCurrent()) return;
        /*
         * after a focus switch, the old tables would stay drawn under the new
         * lists and title. when only the algorithm changed they're still right.
         */
        if (!includedIds || !sameMembers(includedIds, drawnTableIdsRef.current)) {
          setNodes([]);
          setEdges([]);
          setDrawnTableIds(new Set());
        }
        addAlert(
          `Could not lay out the diagram with the "${BASE_LAYOUT_LABELS[algorithm]}" algorithm. ` +
            'Try a different layout algorithm from the Layout dropdown.',
          ChaiseAlertType.WARNING
        );
      }
      setIsInitialized(true);
      setIsRelayouting(false);
    },
    [frameNodes, setNodes, setEdges, addAlert, removeAllAlerts, setDrawnTableIds, drawnTableIdsRef, setIsInitialized]
  );

  /**
   * one-shot action, not persisted state: seeds sporeOverlap with whatever is
   * actually on screen right now (including manual dragging), not a fresh
   * pass over the graph, which never has positions to de-overlap from. picking
   * a new detail level or base algorithm later does not re-apply this.
   */
  const handleRemoveOverlaps = useCallback(() => {
    if (!graphRef.current) return;
    const requestId = ++layoutRequestRef.current;
    const isCurrent = () => requestId === layoutRequestRef.current;
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
        if (!isCurrent()) return;
        const flow = elkToFlow(graphRef.current as ModelGraph, laidOut);
        setNodes(flow.nodes);
        setEdges(flow.edges);
        frameNodes(flow.nodes);
      })
      .catch(() => {
        if (!isCurrent()) return;
        addAlert(
          'Could not automatically resolve overlapping tables. Try a different layout algorithm, ' +
            'or drag tables apart manually.',
          ChaiseAlertType.WARNING
        );
      })
      .finally(() => {
        if (isCurrent()) setIsRelayouting(false);
      });
  }, [nodes, edges, frameNodes, setNodes, setEdges, addAlert]);

  const handleExportPdf = useCallback(() => {
    // read here rather than subscribing this component to them; Export is disabled mid-relayout, so they match `nodes`
    const { focusTableId: exportFocusTableId, focusRelations } = useModelStore.getState();
    // jspdf/svg2pdf are only needed here, so the whole export module is fetched on first use
    import('@isrd-isi-edu/chaise/src/utils/model-pdf-export')
      .then(({ exportModelToPdf }) =>
        exportModelToPdf({ nodes, edges, detail, displayMode, focusTableId: exportFocusTableId, focusRelations })
      )
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

  const handleSetManyTables = useCallback(
    (tableIds: string[], checked: boolean) => setVisibleTableIds(withMany(visibleTableIds, tableIds, checked)),
    [visibleTableIds, setVisibleTableIds]
  );

  const handleSetManySchemas = useCallback(
    (schemas: string[], checked: boolean) => setVisibleSchemas(withMany(visibleSchemas, schemas, checked)),
    [visibleSchemas, setVisibleSchemas]
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
          'No catalog specified. The model app needs to know which data model to display.',
          undefined,
          undefined,
          undefined,
          // shown behind "Show Error Details", rendered as plain text
          'Use a url like /chaise/model/#catalog-id, or define a defaultCatalog in chaise-config.'
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
        const graph = catalogToGraph(cat);
        graphRef.current = graph;
        catalogRef.current = cat;
        // "schema:name" ids, so this groups by schema before alphabetizing within it
        setCatalogTableIds(Object.keys(graph.tables).sort((a, b) => a.localeCompare(b)));
        setCatalogId(graph.catalogId);
        // throws for a url table that can't be focused, landing in the catch below
        applyScope(graph, resolveScopeFromURL(cat, graph));
        setIsGraphReady(true);
      })
      .catch((error: unknown) => dispatchError({ error }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * back/forward between the entries navigateToScope pushes, and hand-edited hashes.
   * only a table switch within the loaded catalog is handled in place; anything
   * else reloads, so it takes the normal load path and error page. an error
   * dispatched after load would be terminal, with the old diagram under it.
   * app-wrapper's own reload on hash change is off, see pages/model.tsx.
   */
  useEffect(() => {
    const onHashChange = () => {
      const graph = graphRef.current;
      const catalog = catalogRef.current;
      // until setup finishes, including after a setup error, reload so the new hash takes the load path
      if (!isInitialized || !graph || !catalog || getCatalogId() !== ConfigService.catalogID) {
        windowRef.location.reload();
        return;
      }
      let scopeTableId: string | null;
      try {
        scopeTableId = resolveScopeFromURL(catalog, graph);
      } catch {
        windowRef.location.reload();
        return;
      }
      navigateToScope(scopeTableId, false);
    };
    windowRef.addEventListener('hashchange', onHashChange);
    return () => windowRef.removeEventListener('hashchange', onHashChange);
  }, [navigateToScope, isInitialized]);

  /**
   * every layout, the first one included. detail level, base algorithm, or which
   * schemas/tables are visible all change the whole arrangement, so any of them
   * re-runs the layout. manual repositioning is lost by design (remove-overlaps
   * is the exception, see handleRemoveOverlaps).
   * the first layout runs here too, not in setup: a second one right after it
   * would replace the nodes before react-flow measured their handles, and their
   * edges would never draw.
   */
  useEffect(() => {
    if (!graphRef.current || !isGraphReady) return;
    void relayout(graphRef.current, displayMode, detail, baseLayout, visibleSchemas, visibleTableIds, focusTableId);
  }, [isGraphReady, displayMode, detail, baseLayout, visibleSchemas, visibleTableIds, focusTableId, relayout]);

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
    <div className='app-content-container model-container'>
      {/* this is just for consistency with all apps (height logic needs it): */}
      <div className='top-panel-container'></div>
      <div className='bottom-panel-container'>
        {/* this is just for consistency with all apps (css rules need it): */}
        <div className='side-panel-resizable close-panel'></div>
        <div className='main-container'>
          <div className='main-body'>
            <div className='model-canvas'>
              {!isInitialized ? (
                <ChaiseSpinner />
              ) : (
                <>
                  <ErdMarkerDefs />
                  {isRelayouting && (
                    <div className='model-loading-overlay'>
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
                    // the default (Backspace) would delete the selected table from the diagram
                    deleteKeyCode={null}
                    fitView
                    nodesConnectable={false}
                    edgesReconnectable={false}
                    onlyRenderVisibleElements={true}
                    // default is 0.5, too shallow to fit a large catalog; fitView
                    // and manual zoom both get clamped by this
                    minZoom={0.05}
                  >
                    <Background />
                    {/* the legend sits beside the zoom buttons */}
                    <Panel position='bottom-left' className='model-bottom-left'>
                      <Controls showInteractive={false} orientation='horizontal' />
                      <ModelRelationLegend drawnTableIds={drawnTableIds} />
                    </Panel>
                    <Panel position='top-center' className='model-title'>
                      <h3>
                        Catalog {catalogId} Data Model
                        {focusTableId && <>: <code>{focusTableId}</code> and its neighbors</>}
                      </h3>
                    </Panel>
                    {!toolbarOpen ? (
                      <Panel position='top-left' className='model-toolbar-collapsed'>
                        <ChaiseTooltip placement='bottom-start' tooltip='Click to show settings'>
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
                      <Panel position='top-left' className='model-toolbar'>
                        <div className='model-toolbar-header'>
                          <h3 className='model-toolbar-title'>Settings</h3>
                          <ChaiseTooltip placement='bottom-start' tooltip='Click to hide settings'>
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
                        <div className='model-toolbar-row'>
                          <ChaiseTooltip
                            placement='bottom-start'
                            tooltip={
                              'Choose to explore the whole catalog (i.e. all tables) or focus on a specific table ' +
                              'with its neighbors and relationships shown.'
                            }
                          >
                            <label id='model-scope-label' className='chaise-icon-for-tooltip'>Model scope</label>
                          </ChaiseTooltip>
                          <ModelScopeDropdown
                            labelId='model-scope-label'
                            tableIds={catalogTableIds}
                            focusTableId={focusTableId}
                            onSelect={handleScopeSelect}
                          />
                        </div>
                        <div className='model-toolbar-row'>
                          <label>Mode</label>
                          <Dropdown
                            className='chaise-dropdown'
                            onSelect={(opt) => setDisplayMode(opt as ModelDisplayMode)}
                          >
                            <Dropdown.Toggle className='chaise-btn chaise-btn-secondary'>
                              {DISPLAY_MODE_LABELS[displayMode]}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {Object.entries(DISPLAY_MODE_LABELS).map(([opt, label]) => (
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
                        <div className='model-toolbar-row'>
                          <label>Detail</label>
                          <Dropdown
                            className='chaise-dropdown'
                            onSelect={(opt) => setDetail(opt as ModelDetailLevel)}
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
                        <div className='model-toolbar-row'>
                          <label>Layout</label>
                          <Dropdown
                            className='chaise-dropdown'
                            onSelect={(opt) =>
                              setBaseLayout(opt as ModelBaseLayoutAlgorithm)
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
                        <div className='model-toolbar-row'>
                          <ChaiseTooltip
                            placement='bottom-start'
                            tooltip='Spread out overlapping tables in the current layout.'
                          >
                            <button
                              type='button'
                              className='model-remove-overlaps-btn chaise-btn chaise-btn-secondary'
                              onClick={handleRemoveOverlaps}
                              // the overlay blocks the mouse, not the keyboard; this would replace the running layout
                              disabled={isRelayouting}
                            >
                              <span className='chaise-btn-icon fa-solid fa-object-ungroup' />
                              <span>Remove overlaps</span>
                            </button>
                          </ChaiseTooltip>
                        </div>
                        <div className='model-toolbar-row'>
                          <ChaiseTooltip
                            placement='bottom-start'
                            tooltip='Download the current diagram as a PDF.'
                          >
                            <button
                              type='button'
                              className='model-export-pdf-btn chaise-btn chaise-btn-secondary'
                              onClick={handleExportPdf}
                              // like remove overlaps: the overlay doesn't stop the keyboard mid-layout
                              disabled={isRelayouting}
                            >
                              <span className='chaise-btn-icon fa-solid fa-file-export' />
                              <span>Export PDF</span>
                            </button>
                          </ChaiseTooltip>
                        </div>
                        <ModelChecklist
                          title='Schemas'
                          itemName='schema'
                          itemsName='schemas'
                          className='model-schemas-checklist'
                          items={schemaItems}
                          checkedIds={visibleSchemas}
                          onToggle={handleToggleSchema}
                          onSetMany={handleSetManySchemas}
                          filterText={schemaFilterText}
                          onFilterTextChange={setSchemaFilterText}
                          emptyMessage={focusTableId ? NO_NEIGHBORS_MESSAGE : 'No schemas found.'}
                        />
                        {/* in neighbors mode the focus table is drawn but not listed, so the counts say "neighboring" */}
                        <ModelChecklist
                          title={focusTableId ? 'Neighboring tables' : 'Tables'}
                          itemName={focusTableId ? 'neighboring table' : 'table'}
                          itemsName={focusTableId ? 'neighboring tables' : 'tables'}
                          className='model-tables-checklist'
                          items={tableItems}
                          checkedIds={visibleTableIds}
                          onToggle={handleToggleTable}
                          onSetMany={handleSetManyTables}
                          filterText={tableFilterText}
                          onFilterTextChange={setTableFilterText}
                          emptyMessage={
                            focusTableId && allTables.length === 0
                              ? NO_NEIGHBORS_MESSAGE
                              : 'No tables to show. Select a schema above.'
                          }
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
 * useReactFlow (used for fitBounds after re-layout) needs a ReactFlowProvider
 * above the component that calls it.
 */
const Model = (): JSX.Element => (
  <ReactFlowProvider>
    <ModelInner />
  </ReactFlowProvider>
);

export default Model;
