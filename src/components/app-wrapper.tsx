import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@isrd-isi-edu/chaise/src/assets/scss/app.scss';

import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import ErrorPorvider from '@isrd-isi-edu/chaise/src/providers/error';
import { StrictMode, useEffect, useState } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import ErrorModal from '@isrd-isi-edu/chaise/src/components/error-modal';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import { ConfigService, ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';
import AuthnService from '@isrd-isi-edu/chaise/src/services/authn';
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseNavbar from '@isrd-isi-edu/chaise/src/components/navbar';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import { ConditionalWrapper } from '@isrd-isi-edu/chaise/src/components/cond-wrapper';


type AppWrapperProps = {
  children: React.ReactNode,
  appSettings: ConfigServiceSettings,
  includeAlerts?: boolean,
  includeNavbar?: boolean,
  displaySpinner?: boolean
}

const AppWrapperInner = ({
  children,
  appSettings,
  includeAlerts,
  includeNavbar,
  displaySpinner
}: AppWrapperProps): JSX.Element => {
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
  if (!configDone && (error || !displaySpinner)) {
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
          {includeNavbar && <ChaiseNavbar />}
          {includeAlerts && <Alerts />}
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
const AppWrapper = ({
  children,
  appSettings,
  includeNavbar,
  includeAlerts,
  displaySpinner
}: AppWrapperProps): JSX.Element => {
  return (
    <ErrorPorvider>
      <ConditionalWrapper
        condition={includeAlerts === true}
        wrapper={children => (
          <AlertsProvider>
            {children}
          </AlertsProvider>
        )}
      >
        <AppWrapperInner
          appSettings={appSettings}
          includeAlerts={includeAlerts}
          includeNavbar={includeNavbar}
          displaySpinner={displaySpinner}
        >
          {children}
        </AppWrapperInner>
      </ConditionalWrapper>
    </ErrorPorvider>
  );
};

export default AppWrapper;

