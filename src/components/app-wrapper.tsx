import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@chaise/assets/scss/app.scss';

import AlertsProvider from '@chaise/providers/alerts';
import ErrorPorvider from '@chaise/providers/error';
import { StrictMode, useEffect, useState } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import ErrorModal from '@chaise/components/error-modal';
import $log from '@chaise/services/logger';
import ChaiseSpinner from '@chaise/components/spinner';
import { ConfigService, ConfigServiceSettings } from '@chaise/services/config';
import AuthnService from '@chaise/services/authn';
import Alerts from '@chaise/components/alerts';
import ChaiseNavbar from '@chaise/components/navbar';
import useError from '@chaise/hooks/error';
import { ConditionalWrapper } from './cond-wrapper';


type AppWrapperProps = {
  children: React.ReactNode,
  appSettings: ConfigServiceSettings,
  /**
   * whether this is a library or not. if library,
   *   - alerts provider and comp will not be added
   *   - navbar will not be added
   *   - spinner will not be displayed while loading
   */
  isLibrary?: boolean
}

const AppWrapperInner = ({ children, appSettings, isLibrary }: AppWrapperProps): JSX.Element => {
  const { dispatchError, error } = useError();
  const [configDone, setConfigDone] = useState(false);

  useEffect(() => {
    /**
     * global error handler for uncaught errors
     */
    window.addEventListener('error', (event) => {
      $log.log('got the error in catch-all');
      dispatchError({ error: event.error, isGlobal: true });
    });
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      $log.log('got the error in catch-all (unhandled rejection)');
      dispatchError({ error: event.reason, isGlobal: true });
    });

    AuthnService.getSession('').then(() => {
      return ConfigService.configure(appSettings);
    }).then(() => {
      setConfigDone(true);
    }).catch((err: any) => {
      dispatchError({ error: err, isGlobal: true });
    });

  }, []); // run it only once on load

  const errorFallback = ({ error }: FallbackProps) => {
    $log.log('error fallback of the main error boundary');

    // TODO uncomment
    // ErrorService.logTerminalError(error);
    dispatchError({ error: error, isGlobal: true });

    // the error modal will be displayed so there's no need for the fallback
    return null;
  };

  // if there was an error during configuration, hide the spinner
  // if it's a library, we don't want any spinners
  if (!configDone && (error || isLibrary)) {
    return <></>
  }

  if (!configDone) {
    return <ChaiseSpinner />
  }

  return (
    <StrictMode>
      <ErrorBoundary
        FallbackComponent={errorFallback}
      >
        <div className='app-container'>
          {!isLibrary &&
            <>
              <ChaiseNavbar />
              <Alerts />
            </>
          }
          {children}
        </div>
      </ErrorBoundary>
      <ErrorModal />
    </StrictMode>
  )
}

/**
 * The app wrapper. it will take care of:
 *  - getting the session
 *  - configuring chaise and ermrestjs
 *  - adding alert and error providers
 *  - showing the navbar
 * @param appSettings
 * @returns
 */
const AppWrapper = ({ children, appSettings, isLibrary }: AppWrapperProps): JSX.Element => {
  return (
    <ErrorPorvider>
      <ConditionalWrapper
        condition={!isLibrary}
        wrapper={children => (
          <AlertsProvider>
            {children}
          </AlertsProvider>
        )}
      >
        <AppWrapperInner appSettings={appSettings}>
          {children}
        </AppWrapperInner>
      </ConditionalWrapper>
    </ErrorPorvider>
  );
};

export default AppWrapper;

