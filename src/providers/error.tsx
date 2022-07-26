import { createContext, useMemo, useState } from 'react';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

type LoginModalProps = {
  title: string;
};

interface ChaiseError {
  error: any; // TODO what would be a proper type?
  isDismissible?: boolean;
  isGlobal?: boolean; // TODO should be removed
  skipLogging?: boolean;
  okBtnCallback?: Function;
  closeBtnCallback?: Function;
}

/**
 * The ErrorContext used for accessing the error
 * NOTE the default value is not used since we're using the provider all the times
 */
export const ErrorContext = createContext<{
  errors: ChaiseError[];
  dispatchError: (payload: ChaiseError) => void;
  hideError: (error: ChaiseError) => void;
  logTerminalError: (error: any) => void;
  loginModal: LoginModalProps | null;
  showLoginModal: (props: LoginModalProps) => void;
  hideLoginModal: () => void;
} |
  // NOTE: since it can be null, to make sure the context is used properly with
  //       a provider, the useRecordset hook will throw an error if it's null.
  null>(null);

type ErrorProviderProps = {
  children: JSX.Element
}

/**
 * The provider that ensures errors are captured.
 * The whole app should be wrapped in this provider, and then we should
 * use the error hooks for catching or showing errors
 */
export default function ErrorPorvider({ children }: ErrorProviderProps): JSX.Element {
  const [errors, setErrors] = useState<ChaiseError[]>([]);
  const [dontAllowOtherErrors, setDontAllowOtherErrors] = useState(false);
  const [loginModal, setLoginModal] = useState<null|LoginModalProps>(null);

  const showLoginModal = (props: LoginModalProps)  => {
    if (!loginModal) {
      setLoginModal(props);
    }
  };

  const hideLoginModal = () => {
    setLoginModal(null);
  };

  const hideError = (error: ChaiseError) => {
    setErrors((errors: ChaiseError[]) => errors.filter((e) => e !== error));
  };

  const dispatchError = (payload: ChaiseError) => {
    if (dontAllowOtherErrors) {
      $log.warn('cannot display multiple errors');
      return;
    }

    $log.warn(payload.error);

    // If not authorized, ask user to sign in first
    // NOTE this is for 401 errors that are manually thrown
    //      401 errors that are thrown from ermrestjs are handled by setting the 401Handler
    if (payload.error instanceof windowRef.ERMrest.UnauthorizedError) {
      // TODO 401 handling
      // Unauthorized (needs to login)
      // Session.loginInAModal(function () {
      //   if (Session.shouldReloadPageAfterLogin()) {
      //     window.location.reload();
      //   } else if (!Session.isSameSessionAsPrevious()) {
      //     handleException(new Errors.DifferentUserConflictError(Session.getSessionValue(), Session.getPrevSessionValue()), false);
      //   }
      // });
      return;
    }

    // if not a dismissible error then exception should be suppressed
    const canShowOtherErrors = (
      // in this case ok is behaving like a dissmiss
      payload.error instanceof windowRef.ERMrest.UnsupportedFilters
    );
    if (!payload.isDismissible && !payload.error.showContinueBtn && !payload.error.clickOkToDismiss && !canShowOtherErrors) {
      setDontAllowOtherErrors(true);
    }

    setErrors((errors) => [...errors, payload])
  };

  /**
   * Log the given error as a terminal error
   * @param error
   * @param contextHeaderParams
   * @returns
   */
  const logTerminalError = (error: any) => {
    if (!windowRef.ERMrest) return;
    const ermrestUri = ConfigService.chaiseConfig.ermrestLocation;
    windowRef.ERMrest.logError(error, ermrestUri, ConfigService.contextHeaderParams).then(() => {
      $log.log('logged the error');
    }).catch((err: any) => {
      $log.log('couldn\'t log the error.');
      $log.info(err);
    });
  };

  /**
   * We have to use useMemo here because the object that we're storing
   * has callbacks in it which will change.
   * This will ensure to update the object only when the 'error' object has changed.
   */
  const providerValue = useMemo(() => {
    return {
      errors,
      dispatchError,
      hideError,
      logTerminalError,
      loginModal,
      showLoginModal,
      hideLoginModal
    };
  }, [errors, loginModal])

  return (
    <ErrorContext.Provider value={providerValue} >
      {children}
    </ErrorContext.Provider>
  );
}
