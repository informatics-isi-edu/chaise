import { createContext, useMemo, useState } from 'react';
import $log from '@chaise/services/logger';



// TODO should be updated
interface ChaiseError {
  name?: string;
  message: string;
  isDismissible?: boolean;
  isPopup?: boolean;
  isGlobal?: boolean;
}

interface DispatchErrorPayload {
  error: Error;
  isDismissible?: boolean;
  isGlobal?: boolean;
}

/**
 * The ErrorContext used for accessing the error
 * NOTE the default value is not used since we're using the provider all the times
 */
export const ErrorContext = createContext<{
  error: ChaiseError | null;
  dispatchError: (payload: DispatchErrorPayload) => void;
  hideError: () => void;
}>({
  error: null,
  dispatchError: () => {/* */},
  hideError: () => {/* */}
});

type ErrorProviderProps = {
  children: JSX.Element
}

/**
 * The provider that ensures errors are captured.
 * The whole app should be wrapped in this provider, and then we should
 * use the error hooks for catching or showing errors
 */
export default function ErrorPorvider({ children }: ErrorProviderProps): JSX.Element {
  const [error, setError] = useState<ChaiseError | null>(null);

  const hideError = () => setError(null);

  const dispatchError = (payload: DispatchErrorPayload) => {
    if (error !== null) {
      $log.error('cannot display multiple errors');
      $log.error(payload.error);
      return;
    }

    // TODO should be updated based on what we want to show in the popup
    // the logic of mapping of errors should be added here.
    setError({
      name: payload.error.name,
      message: payload.error.message,
      isDismissible: payload.isDismissible,
      isGlobal: payload.isGlobal
    });
  };

  /**
   * We have to use useMemo here because the object that we're storing
   * has callbacks in it which will change.
   * This will ensure to update the object only when the "error" object has changed.
   */
  const providerValue = useMemo(() => {
    return {
      error,
      dispatchError,
      hideError
    };
  }, [error])

  return (
    <ErrorContext.Provider value={providerValue} >
      {children}
    </ErrorContext.Provider>
  );
}
