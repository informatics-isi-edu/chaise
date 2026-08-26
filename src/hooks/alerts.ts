import { useContext } from 'react';
import { useStore } from 'zustand';

import { AlertsContext, type AlertsState } from '@isrd-isi-edu/chaise/src/providers/alerts';

/**
 * useAlert hook to be used for accessing the alerts of the nearest
 * AlertsProvider (the app-wide one, or a local one in e.g. modals).
 * subscribes to the whole store, so consumers re-render when alerts change.
 * the returned actions are stable identities and safe to use in dependency
 * arrays (see the note on createAlertsStore in providers/alerts.tsx).
 */
export default function useAlert(): AlertsState {
  const store = useContext(AlertsContext);
  if (!store) {
    throw new Error('No AlertsProvider found when calling useAlert');
  }
  return useStore(store);
}
