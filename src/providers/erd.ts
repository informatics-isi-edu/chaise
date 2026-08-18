import { create } from 'zustand';

/**
 * how much of each table is drawn, mirroring the `--detail` levels of the
 * deriva-er-diagram python CLI:
 *   names: just the table name
 *   keys:  key and foreign-key columns only
 *   full:  every (non-system) column
 */
export type ERDDetailLevel = 'names' | 'keys' | 'full';

/**
 * elk layout algorithm ids, verified against what this installed elkjs build
 * actually registers (elk.knownLayoutAlgorithms()), not just the readme,
 * which lists a 'disco' algorithm this build doesn't have. 'layered' suits
 * mostly-acyclic fk graphs and is the default; the rest are here to compare.
 */
export type ERDLayoutAlgorithm =
  | 'layered'
  | 'stress'
  | 'force'
  | 'mrtree'
  | 'radial'
  | 'rectpacking'
  | 'sporeOverlap'
  | 'sporeCompaction';

interface ERDStore {
  detail: ERDDetailLevel;
  setDetail: (detail: ERDDetailLevel) => void;

  layout: ERDLayoutAlgorithm;
  setLayout: (layout: ERDLayoutAlgorithm) => void;
}

/**
 * app-wide singleton store (zustand `create` flavor). read with a selector so
 * components only re-render on the slice they use:
 *   const detail = useErdStore((state) => state.detail);
 */
export const useErdStore = create<ERDStore>((set) => ({
  detail: 'keys',
  setDetail: (detail) => set({ detail }),

  layout: 'layered',
  setLayout: (layout) => set({ layout }),
}));
