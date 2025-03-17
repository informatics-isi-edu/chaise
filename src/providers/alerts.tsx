import { createContext, useMemo, useRef, useState, type JSX } from 'react';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

// TODO should we move the types to somewhere else?

export enum ChaiseAlertType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * mapping from our definition of alert type to bootstrap version.
 * NOTE our definition of alert type is used as a title. so it should be human-readble
 * for example error instead of danger.
 */
export const CHAISE_ALERT_TYPE_MAPPING: { [key: string]: string } = {
  'success': 'success',
  'error': 'danger',
  'warning': 'warning',
  'info': 'info'
};


export type ChaiseAlert = {
  message: string | JSX.Element,
  type: ChaiseAlertType
  onRemove?: () => void,
  isSessionExpiredAlert?: boolean
};

type AddAlertFunction = (
  message: string | JSX.Element,
  type: ChaiseAlertType,
  onRemove?: () => void,
  isSessionExpiredAlert?: boolean,
) => ChaiseAlert;

type RemoveAlertFunction = (
  alert: ChaiseAlert
) => void;

export const AlertsContext = createContext<{
  alerts: ChaiseAlert[],
  addAlert: AddAlertFunction,
  removeAlert: RemoveAlertFunction,
  addURLLimitAlert: () => void,
  removeURLLimitAlert: () => void,
  addTooManyFormsAlert:(message: string, type: ChaiseAlertType) => void,
  removeTooManyFormsAlert:() => void,
  removeAllAlerts: () => void,
} |
  // NOTE: since it can be null, to make sure the context is used properly with
  //       a provider, the useRecordset hook will throw an error if it's null.
  null>(null);

type AlertsProviderProps = {
  children: React.ReactNode,
}


/**
 * The provider that ensures errors are captured.
 * The whole app should be wrapped in this provider. and if we need local display of
 * alerts (for example recordset popup, then we should also call the provider again locally).
 * Alerts component can be used to show the errors.
 */
export default function AlertsProvider({ children }: AlertsProviderProps): JSX.Element {
  const [alerts, setAlerts] = useState<ChaiseAlert[]>([]);

  const urlLimitAlert = useRef<ChaiseAlert|null>(null);
  const tooManyFormsAlert = useRef<ChaiseAlert|null>(null);

  /**
   * create add an alert
   * @param message the message that will be displayed
   * @param type type of message
   * @param onRemove the callback that will be called when the users remove the alert.
   * @return the newly created alert
   */
  const addAlert: AddAlertFunction = (
    message: string | JSX.Element, type: ChaiseAlertType, onRemove?: () => void, isSessionExpiredAlert?: boolean
  ) => {
    const newAlert = { message, type, onRemove, isSessionExpiredAlert };
    setAlerts((alerts) => [...alerts, newAlert]);
    return newAlert;
  };

  /**
   * remove a given alert from the list of alerts
   * @param alert the alert that should be removed
   */
  const removeAlert: RemoveAlertFunction = (alert: ChaiseAlert) => {
    setAlerts(
      (prev: ChaiseAlert[]) => {
        if (alert.onRemove) alert.onRemove();
        return prev.filter((al: ChaiseAlert) => {
          return alert !== al;
        })
      }
    )
  };

  const removeAllAlerts = () => {
    setAlerts([]);
  };

  /**
   * Display the URL limit alert
   * (we want to ensure only one alert is displayed at the time)
   */
  const addURLLimitAlert = () => {
    if (urlLimitAlert.current) return;

    urlLimitAlert.current = addAlert(MESSAGE_MAP.URLLimitMessage, ChaiseAlertType.WARNING, () => urlLimitAlert.current = null)
  };

  /**
   * Remove the URL limit alert
   */
  const removeURLLimitAlert = () => {
    if (!urlLimitAlert.current) return;

    removeAlert(urlLimitAlert.current);
    urlLimitAlert.current = null;
  }

  /**
   * display the too many forms alert
   * (we want to ensure only one alert is displayed at the time)
   *
   * @param message the alert message to show. this can differ depending on how many forms can still be added
   * @param type the type of alert to show
   */
  const addTooManyFormsAlert = (message: string, type: ChaiseAlertType) => {
    if (tooManyFormsAlert.current) return;

    tooManyFormsAlert.current = addAlert(message, type, () => tooManyFormsAlert.current = null)
  }

  /**
   * remove too many forms alert
   */
  const removeTooManyFormsAlert = () => {
    if (!tooManyFormsAlert.current) return;

    removeAlert(tooManyFormsAlert.current);
    tooManyFormsAlert.current = null;
  }


  const providerValue = useMemo(() => {
    return {
      alerts,
      addAlert,
      removeAlert,
      removeAllAlerts,
      addURLLimitAlert,
      removeURLLimitAlert,
      addTooManyFormsAlert,
      removeTooManyFormsAlert
    }
  }, [alerts]);

  return (
    <AlertsContext.Provider value={providerValue}>
      {children}
    </AlertsContext.Provider>
  )
}
