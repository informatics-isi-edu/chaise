import { createContext, useState, type JSX, type ReactNode } from 'react';
import { createStore, type StoreApi } from 'zustand/vanilla';

import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

export enum ChaiseAlertType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * mapping from our definition of alert type to bootstrap version.
 * NOTE our definition of alert type is used as a title. so it should be human-readble
 * for example error instead of danger.
 */
export const CHAISE_ALERT_TYPE_MAPPING: { [key: string]: string } = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

export type ChaiseAlert = {
  message: string | JSX.Element;
  type: ChaiseAlertType;
  onRemove?: () => void;
  isSessionExpiredAlert?: boolean;
};

type AddAlertFunction = (
  /**
   * the message that will be displayed.
   *
   * Notes:
   *  - if it's a string, will be rendered as HTML. so it can have HTML tags.
   */
  message: string | JSX.Element,
  type: ChaiseAlertType,
  onRemove?: () => void,
  isSessionExpiredAlert?: boolean
) => ChaiseAlert;

type RemoveAlertFunction = (alert: ChaiseAlert) => void;

export type AlertsState = {
  alerts: ChaiseAlert[];
  addAlert: AddAlertFunction;
  removeAlert: RemoveAlertFunction;
  addURLLimitAlert: () => void;
  removeURLLimitAlert: () => void;
  addTooManyFormsAlert: (message: string, type: ChaiseAlertType) => void;
  removeTooManyFormsAlert: () => void;
  removeAllAlerts: () => void;
};

type AlertsStore = StoreApi<AlertsState>;

/**
 * one store per AlertsProvider instance (zustand scoped-store pattern, see
 * record-show-more.tsx and the dev-guide). zustand actions are created once
 * per store, so their identities are stable and safe to use in hook
 * dependency arrays, unlike callbacks recreated by a provider component.
 */
const createAlertsStore = (): AlertsStore => {
  /*
   * singleton-alert guards (only one url-limit / too-many-forms alert at a
   * time). closure variables, not store state: nothing renders off of them.
   */
  let urlLimitAlert: ChaiseAlert | null = null;
  let tooManyFormsAlert: ChaiseAlert | null = null;

  return createStore<AlertsState>((set, get) => ({
    alerts: [],

    addAlert: (message, type, onRemove?, isSessionExpiredAlert?) => {
      const newAlert = { message, type, onRemove, isSessionExpiredAlert };
      set((state) => ({ alerts: [...state.alerts, newAlert] }));
      return newAlert;
    },

    removeAlert: (alert) => {
      if (alert.onRemove) alert.onRemove();
      set((state) => ({ alerts: state.alerts.filter((al) => al !== alert) }));
    },

    removeAllAlerts: () => {
      // no-op when empty so callers can clear defensively without re-renders
      if (get().alerts.length === 0) return;
      set({ alerts: [] });
    },

    /**
     * Display the URL limit alert
     * (we want to ensure only one alert is displayed at the time)
     */
    addURLLimitAlert: () => {
      if (urlLimitAlert) return;
      urlLimitAlert = get().addAlert(
        MESSAGE_MAP.URLLimitMessage,
        ChaiseAlertType.WARNING,
        () => (urlLimitAlert = null)
      );
    },

    removeURLLimitAlert: () => {
      if (!urlLimitAlert) return;
      get().removeAlert(urlLimitAlert);
      urlLimitAlert = null;
    },

    /**
     * display the too many forms alert
     * (we want to ensure only one alert is displayed at the time)
     *
     * @param message the alert message to show. this can differ depending on how many forms can still be added
     * @param type the type of alert to show
     */
    addTooManyFormsAlert: (message, type) => {
      if (tooManyFormsAlert) return;
      tooManyFormsAlert = get().addAlert(message, type, () => (tooManyFormsAlert = null));
    },

    removeTooManyFormsAlert: () => {
      if (!tooManyFormsAlert) return;
      get().removeAlert(tooManyFormsAlert);
      tooManyFormsAlert = null;
    },
  }));
};

/**
 * The context distributes the store reference (stable), not the state values,
 * so the provider never re-renders when alerts change. Access it through the
 * useAlert hook, not directly.
 */
export const AlertsContext = createContext<AlertsStore | null>(null);

type AlertsProviderProps = {
  children: ReactNode;
};

/**
 * The provider that ensures errors are captured.
 * The whole app should be wrapped in this provider. and if we need local display of
 * alerts (for example recordset popup, then we should also call the provider again locally).
 * Alerts component can be used to show the errors.
 */
export default function AlertsProvider({ children }: AlertsProviderProps): JSX.Element {
  // lazy initializer: the store is created once and never replaced
  const [store] = useState(() => createAlertsStore());
  return <AlertsContext.Provider value={store}>{children}</AlertsContext.Provider>;
}
