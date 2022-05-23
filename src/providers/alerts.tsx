import { createContext, useMemo, useState } from 'react';
import { Variant } from 'react-bootstrap/esm/types';

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
  message: string,
  type: ChaiseAlertType
  onRemove?: () => void,
};

type AddAlertFunction = (
  message: string,
  type: ChaiseAlertType,
  onRemove?: () => void,

) => ChaiseAlert;

type RemoveAlertFunction = (
  alert: ChaiseAlert
) => void;

export const AlertsContext = createContext<{
  alerts: ChaiseAlert[],
  addAlert: AddAlertFunction,
  removeAlert: RemoveAlertFunction
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

  /**
   * create add an alert
   * @param message the message that will be displayed
   * @param type type of message
   * @param onRemove the callback that will be called when the users remove the alert.
   * @return the newly created alert
   */
  const addAlert: AddAlertFunction = (message: string, type: ChaiseAlertType, onRemove?: () => void) => {
    const newAlert = { message, type, onRemove };
    setAlerts(alerts.concat(newAlert));
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


  const providerValue = useMemo(() => {
    return {
      alerts,
      addAlert,
      removeAlert
    }
  }, [alerts]);

  return (
    <AlertsContext.Provider value={providerValue}>
      {children}
    </AlertsContext.Provider>
  )
}