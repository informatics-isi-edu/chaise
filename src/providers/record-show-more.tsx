import { createContext, useState, type JSX, type ReactNode } from 'react';
import { createStore, type StoreApi } from 'zustand/vanilla';

/**
 * Per-row state for the record main section show more/less feature. Shared by
 * the entity-key rail and the value cell of the same row.
 */
export type ShowMoreState = {
  /** whether the value is currently expanded past `maxHeight` */
  expanded: boolean;
  /** whether the value's natural height exceeds `maxHeight` */
  overflowing: boolean;
  /** clip threshold (px) from the `visible_cell_height` annotation */
  maxHeight: number;
  setExpanded: (value: boolean) => void;
  setOverflowing: (value: boolean) => void;
};

type ShowMoreStore = StoreApi<ShowMoreState>;

/**
 * Creates a store instance for one row. Each row gets its own store so
 * expanding one row never affects another (zustand scoped-store pattern).
 */
const createShowMoreStore = (maxHeight: number): ShowMoreStore =>
  createStore<ShowMoreState>((set) => ({
    expanded: false,
    overflowing: false,
    maxHeight,
    setExpanded: (value) => set({ expanded: value }),
    setOverflowing: (value) => set({ overflowing: value }),
  }));

/**
 * The context distributes the store reference (stable), not the state values,
 * so the provider never re-renders when the state changes. Access it through
 * the useShowMoreStore hook, not directly.
 */
export const ShowMoreContext = createContext<ShowMoreStore | null>(null);

/**
 * Provides a fresh show-more store to one record main section row. Only rows
 * whose column has a valid `visible_cell_height` should be wrapped.
 */
export const ShowMoreRowProvider = ({
  maxHeight,
  children,
}: {
  maxHeight: number;
  children: ReactNode;
}): JSX.Element => {
  // lazy initializer: the store is created once per row and never replaced
  const [store] = useState(() => createShowMoreStore(maxHeight));
  return <ShowMoreContext.Provider value={store}>{children}</ShowMoreContext.Provider>;
};
