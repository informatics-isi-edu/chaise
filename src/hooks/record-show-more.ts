import { useContext } from 'react';
import { useStore } from 'zustand';
import {
  ShowMoreContext,
  type ShowMoreState,
} from '@isrd-isi-edu/chaise/src/providers/record-show-more';

/**
 * useShowMoreStore hook to be used for accessing the show-more store of a
 * record main section row (see ShowMoreRowProvider).
 *
 * Unlike the context-based hooks (useRecord, useRecordset, ...), this hook
 * takes a selector and components re-render only when their selected slice
 * changes:
 *
 *   const expanded = useShowMoreStore((state) => state.expanded);
 *
 * for list of properties take a look at ShowMoreState
 */
function useShowMoreStore<T>(selector: (state: ShowMoreState) => T): T {
  const store = useContext(ShowMoreContext);
  if (!store) {
    throw new Error('No ShowMoreRowProvider found when calling ShowMoreContext');
  }
  return useStore(store, selector);
}

export default useShowMoreStore;
