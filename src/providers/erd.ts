import { create } from 'zustand';

/**
 * how much of each table is drawn. loosely mirrors the `--detail` levels of
 * the deriva-er-diagram python CLI, split further here since "keys" and
 * "keys + foreign keys" turned out to be genuinely different views.
 */
export enum ERDDetailLevel {
  /** just the table name */
  NAMES = 'names',
  /** primary key columns only */
  KEYS = 'keys',
  /** primary key and foreign key columns */
  KEYS_FKS = 'keysFks',
  /** every (non-system) column */
  FULL = 'full',
}

/**
 * elk layout algorithm ids, verified against what this installed elkjs build
 * actually registers (elk.knownLayoutAlgorithms()), not just the readme,
 * which lists a 'disco' algorithm this build doesn't have. LAYERED suits
 * mostly-acyclic fk graphs and is the default; the rest are here to compare.
 */
export enum ERDBaseLayoutAlgorithm {
  LAYERED = 'layered',
  STRESS = 'stress',
  FORCE = 'force',
  MRTREE = 'mrtree',
  RADIAL = 'radial',
  RECTPACKING = 'rectpacking',
}

interface ERDStore {
  detail: ERDDetailLevel;
  setDetail: (detail: ERDDetailLevel) => void;

  baseLayout: ERDBaseLayoutAlgorithm;
  setBaseLayout: (baseLayout: ERDBaseLayoutAlgorithm) => void;

  visibleSchemas: Set<string>;
  setVisibleSchemas: (schemas: Set<string>) => void;

  // independent of visibleSchemas: a table only shows when both its schema
  // and its own id are checked. same "checked = visible" polarity and same
  // "populate the full set at load" initialization as visibleSchemas.
  visibleTableIds: Set<string>;
  setVisibleTableIds: (tableIds: Set<string>) => void;
}

/**
 * app-wide singleton store (zustand `create` flavor). read with a selector so
 * components only re-render on the slice they use:
 *   const detail = useErdStore((state) => state.detail);
 */
export const useErdStore = create<ERDStore>((set) => ({
  detail: ERDDetailLevel.KEYS,
  setDetail: (detail) => set({ detail }),

  baseLayout: ERDBaseLayoutAlgorithm.LAYERED,
  setBaseLayout: (baseLayout) => set({ baseLayout }),

  visibleSchemas: new Set(),
  setVisibleSchemas: (schemas) => set({ visibleSchemas: schemas }),

  visibleTableIds: new Set(),
  setVisibleTableIds: (tableIds) => set({ visibleTableIds: tableIds }),
}));
