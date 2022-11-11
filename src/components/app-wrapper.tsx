import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@isrd-isi-edu/chaise/src/assets/scss/app.scss';

// hooks
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { StrictMode, useEffect, useRef, useState } from 'react';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseNavbar from '@isrd-isi-edu/chaise/src/components/navbar/navbar';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import { ConditionalWrapper } from '@isrd-isi-edu/chaise/src/components/cond-wrapper';
import ErrorModal from '@isrd-isi-edu/chaise/src/components/modals/error-modal';
import ExternalLinkModal from '@isrd-isi-edu/chaise/src/components/modals/external-link-modal';
import LoginModal from '@isrd-isi-edu/chaise/src/components/modals/login-modal';

// models
import { ForbiddenAssetAccess, UnauthorizedAssetAccess } from '@isrd-isi-edu/chaise/src/models/errors';

// providers
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import AuthnProvider from '@isrd-isi-edu/chaise/src/providers/authn';
import ErrorProvider from '@isrd-isi-edu/chaise/src/providers/error';

// services
import { ConfigService, ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { addClickListener } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { clickHref } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { isSameOrigin } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';



type AppWrapperProps = {
  /**
   * The app content
   */
  children: React.ReactNode,
  /**
   * app-specific settings
   */
  appSettings: ConfigServiceSettings,
  /**
   * whether we should add alerts provider and alerts comp
   */
  includeAlerts?: boolean,
  /**
   * whether we should add navbar
   */
  includeNavbar?: boolean,
  /**
   * whether we should display spinner while waiting for config service
   * or just show the content.
   */
  displaySpinner?: boolean,
  /**
   * whether we should ignore hash change, or reload the page on hash change
   */
  ignoreHashChange?: boolean
}

const AppWrapperInner = ({
  children,
  appSettings,
  includeAlerts,
  includeNavbar,
  displaySpinner,
  ignoreHashChange
}: AppWrapperProps): JSX.Element => {
  const { dispatchError, logTerminalError, errors } = useError();
  const [configDone, setConfigDone] = useState(false);
  const [externalLink, setExternalLink] = useState<string>('');

  const { getSession, session } = useAuthn();

  useEffect(() => {
    const onError = (event: any) => {
      dispatchError({ error: event.error });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      dispatchError({ error: event.reason });
    };
    const onHashChange = () => {
      if (ignoreHashChange) return;
      windowRef.location.reload();
    };

    /**
     * global error handler for uncaught errors
     */
    windowRef.addEventListener('error', onError);
    windowRef.addEventListener('unhandledrejection', onUnhandledRejection);

    /**
     * reload the page when users change the hash portion of the URL
     */
    windowRef.addEventListener('hashchange', onHashChange);

    getSession('').then((response: any) => {
      return ConfigService.configure(appSettings, response);
    }).then(() => {
      setConfigDone(true);
    }).catch((err: any) => {
      dispatchError({ error: err });
    });

    return () => {
      windowRef.removeEventListener('error', onError);
      windowRef.removeEventListener('unhandledrejection', onUnhandledRejection);
      windowRef.removeEventListener('hashchange', onHashChange);
    }

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
    logTerminalError(error);
    dispatchError({ error: error });

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
          let ermrestError = ConfigService.ERMrest.responseToError(exception);
          if (ermrestError instanceof ConfigService.ERMrest.UnauthorizedError) {
            ermrestError = new UnauthorizedAssetAccess();
          } else if (ermrestError instanceof ConfigService.ERMrest.ForbiddenError) {
            ermrestError = new ForbiddenAssetAccess(session);
          }

          // If an error occurs while a user is trying to download the file, allow them to dismiss the dialog
          dispatchError({ error: ermrestError, isDismissible: true });
        }).finally(function () {
          // remove the spinner
          element.innerHTML = element.innerHTML.slice(0, element.innerHTML.indexOf(spinnerHTML));
        });
      }
    });
  }

  return (
    <StrictMode>
      <ErrorBoundary
        FallbackComponent={errorFallback}
      >
        {/* show spinner if we're waiting for configuration and there are no error during configuration */}
        {(displaySpinner && !configDone && errors.length === 0) && <ChaiseSpinner />}
        {configDone &&
          <div className='app-container'>
            {(includeNavbar || includeAlerts) &&
              <div className='app-header-container'>
                {includeNavbar && <ChaiseNavbar />}
                {includeAlerts && <Alerts />}
              </div>
            }
            {children}
            {externalLink && <ExternalLinkModal link={externalLink} onClose={() => setExternalLink('')} />}
          </div>
        }
      </ErrorBoundary>
      <LoginModal />
      <ErrorModal />
    </StrictMode>
  )
}

/**
 * The app wrapper. it will take care of:
 *  - getting the session
 *  - configuring chaise and ermrestjs
 *  - adding error providers
 * The following are the optional things that we can ask
 * app-wrapper to do:
 *  - showing the navbar
 *  - showing alerts
 *
 * By default we will also reload the page on hash change, if
 * that's not desirable use the ignoreHashChange prop
 *
 * @param appSettings
 * @returns
 */
const AppWrapper = ({
  children,
  appSettings,
  includeNavbar,
  includeAlerts,
  displaySpinner,
  ignoreHashChange
}: AppWrapperProps): JSX.Element => {
  return (
    <ErrorProvider>
      <AuthnProvider>
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
            ignoreHashChange={ignoreHashChange}
          >
            {children}
          </AppWrapperInner>
        </ConditionalWrapper>
      </AuthnProvider>
    </ErrorProvider>
  );
};

export default AppWrapper;

