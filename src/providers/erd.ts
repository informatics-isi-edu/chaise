import { create } from 'zustand';

/**
 * how much of each table is drawn. loosely mirrors the `--detail` levels of
 * the deriva-er-diagram python CLI, split further here since "keys" and
 * "keys + foreign keys" turned out to be genuinely different views:
 *   names:   just the table name
 *   keys:    primary key columns only
 *   keysFks: primary key and foreign key columns
 *   full:    every (non-system) column
 */
export type ERDDetailLevel = 'names' | 'keys' | 'keysFks' | 'full';

/**
 * elk layout algorithm ids, verified against what this installed elkjs build
 * actually registers (elk.knownLayoutAlgorithms()), not just the readme,
 * which lists a 'disco' algorithm this build doesn't have. 'layered' suits
 * mostly-acyclic fk graphs and is the default; the rest are here to compare.
 */
export type ERDBaseLayoutAlgorithm = 'layered' | 'stress' | 'force' | 'mrtree' | 'radial' | 'rectpacking';

interface ERDStore {
  detail: ERDDetailLevel;
  setDetail: (detail: ERDDetailLevel) => void;

  baseLayout: ERDBaseLayoutAlgorithm;
  setBaseLayout: (baseLayout: ERDBaseLayoutAlgorithm) => void;
}

/**
 * app-wide singleton store (zustand `create` flavor). read with a selector so
 * components only re-render on the slice they use:
 *   const detail = useErdStore((state) => state.detail);
 */
export const useErdStore = create<ERDStore>((set) => ({
  detail: 'keys',
  setDetail: (detail) => set({ detail }),

  baseLayout: 'layered',
  setBaseLayout: (baseLayout) => set({ baseLayout }),
}));
