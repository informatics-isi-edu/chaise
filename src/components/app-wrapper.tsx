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
import { addClickListener } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import ExternalLinkModal from '@isrd-isi-edu/chaise/src/components/modals/external-link-modal';
import { isSameOrigin } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { clickHref } from '@isrd-isi-edu/chaise/src/utils/ui-utils';


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
  const { dispatchError, logTerminalError, errors } = useError();
  const [configDone, setConfigDone] = useState(false);
  const [externalLink, setExternalLink] = useState<string>('');

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

  /**
   * override download and external link behaviors
   */
  useEffect(() => {
    if (!configDone) return;

    const settings = ConfigService.appSettings;

    if (settings.overrideExternalLinkBehavior) overrideExternalLinkBehavior();
    if (settings.overrideDownloadClickBehavior) overrideDownloadClickBehavior();

  }, [configDone]);

  const errorFallback = ({ error }: FallbackProps) => {
    $log.log('error fallback of the main error boundary');

    logTerminalError(error);
    dispatchError({ error: error, isGlobal: true });

    // the error modal will be displayed so there's no need for the fallback
    return null;
  };

  /**
   * show a modal if users click on an external link
   */
  const overrideExternalLinkBehavior = () => {
    addClickListener('a.external-link', (e: Event, element: HTMLAnchorElement) => {
      e.preventDefault();
      setExternalLink(element.href);
    });
  };

  /**
   * send a header request if we have to check download links
   * TODO should be tested
   */
  const overrideDownloadClickBehavior = () => {
    addClickListener('a.asset-permission', function (e: Event, element: HTMLAnchorElement) {
      e.preventDefault();

      const spinnerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      `;
      //show spinner
      element.innerHTML += spinnerHTML;

      // if same origin, verify authorization
      if (isSameOrigin(element.href)) {
        const config = { skipRetryBrowserError: true, skipHTTP401Handling: true };

        // make a HEAD request to check if the user can fetch the file
        ConfigService.http.head(element.href, config).then(function () {
          clickHref(element.href);
        }).catch(function (exception: any) {
          const ermrestError = ConfigService.ERMrest.responseToError(exception);

          // TODO requires error mapping
          // if (ermrestError instanceof ConfigService.ERMrest.UnauthorizedError) {
          //   ermrestError = new Errors.UnauthorizedAssetAccess();
          // } else if (ermrestError instanceof ConfigService.ERMrest.ForbiddenError) {
          //   ermrestError = new Errors.ForbiddenAssetAccess();
          // }

          // If an error occurs while a user is trying to download the file, allow them to dismiss the dialog
          // ErrorService.handleException(ermrestError, true);
          dispatchError({ error: ermrestError, isDismissible: true });
        }).finally(function () {
          // remove the spinner
          element.innerHTML = element.innerHTML.slice(0, element.innerHTML.indexOf(spinnerHTML));
        });
      }
    });
  }

  // if there was an error during configuration, hide the spinner
  // if it's a library, we don't want any spinners
  if (!configDone && (errors.length > 0 || !displaySpinner)) {
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
          {externalLink && <ExternalLinkModal link={externalLink} onClose={() => setExternalLink('')} />}
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

