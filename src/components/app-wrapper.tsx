import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@isrd-isi-edu/chaise/src/assets/scss/app.scss';

// hooks
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { StrictMode, useEffect, useState } from 'react';
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
import { CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { clickHref } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { isSameOrigin } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import NavbarProvider from '@isrd-isi-edu/chaise/src/providers/navbar';

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
   * If instead of showing the generic chaise spinner you want to show a
   * spinner without any text, pass the container that you want to shwo the spinner
   * inside of.
   */
  smallSpinnerContainer?: HTMLElement,
  /**
   * whether we should ignore hash change, or reload the page on hash change
   */
  ignoreHashChange?: boolean,
  /**
   * whether we should fetch the session on load or not
   * (useful when testing locally and webauthn is not available)
   */
  dontFetchSession?: boolean
}

const AppWrapperInner = ({
  children,
  appSettings,
  includeAlerts,
  includeNavbar,
  displaySpinner,
  ignoreHashChange,
  dontFetchSession,
  smallSpinnerContainer
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

    new Promise((resolve, reject) => {
      if (dontFetchSession) {
        resolve(null);
      } else {
        getSession('').then((response) => resolve(response)).catch((err) => reject(err));
      }
    }).then((response: any) => {
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
    if (settings.overrideImagePreviewBehavior) overrideImagePreviewBehavior();


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
          clickHref(element.href, true);
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

  /**
   * add the listener for the chaise-image-preview to zoom in/out
   */
  const overrideImagePreviewBehavior = () => {
    addClickListener('.chaise-image-preview', function (e: Event, element: HTMLAnchorElement) {
      e.preventDefault();
      e.stopPropagation();

      const img = element.querySelector('img');

      /**
       * TODO this feels hacky
       */
      const maxHeight = img ? img.getAttribute('image-preview-max-height') : null;

      if (element.classList.contains(CLASS_NAMES.IMAGE_PREVIEW_ZOOMED_IN)) {
        element.classList.remove(CLASS_NAMES.IMAGE_PREVIEW_ZOOMED_IN);
        if (maxHeight && img) {
          element.style.maxHeight = 'unset';
          img.style.maxHeight = maxHeight;
        }
      } else {
        element.classList.add(CLASS_NAMES.IMAGE_PREVIEW_ZOOMED_IN);
        if (maxHeight && img) {
          element.style.maxHeight = maxHeight;
          img.style.maxHeight = 'unset';
        }
      }
    });
  };

  const renderSpinner = () => {
    if (!displaySpinner && !smallSpinnerContainer) return <></>;

    /**
     * in some cases (navbar app), we want to show a small spinner that fits the container
     */
    if (smallSpinnerContainer) {
      const containerHeight = smallSpinnerContainer && smallSpinnerContainer.offsetHeight !== 0 ? smallSpinnerContainer.offsetHeight : 0;
      if (containerHeight === 0) {
        return <></>;
      }

      /**
       * - the height/width of spinner is half of the container so we have enough padding
       * above and below.
       * - I added the max and minimum to make sure we're not showing a very small or very
       * large spinner.
       * - the border-width is calculated by interpolating based on the min and max values.
       */
      const minHeight = 15, maxHeight = 40, minBorderWidth = 2, maxBorderWidth = 5;

      let height = containerHeight / 2, borderWidth;

      // we don't have enough space to show a proper spinner (do we want to try anyways?)
      // realisticly this won't happen. the only way that we fall into this case
      // is if data-modelers chose a very small height which means not preserving
      // enough space for the text that is going to be displayed on the navbar.
      if (height < minHeight) {
        return <></>;
      }

      // we don't want to show a giant spinner
      if (height >= maxHeight) {
        height = maxHeight;
        borderWidth = maxBorderWidth;
      }
      // bw = ((max_bw-min_bw)/(max_h - min_h)) * (h - min_h)) + min_bw
      else {
        borderWidth = ((maxBorderWidth-minBorderWidth)/(maxHeight-minHeight)) * (height-minHeight);
        borderWidth += minBorderWidth;
      }

      const spinnerStyles = {
        height: `${height}px`,
        width: `${height}px`,
        borderWidth: `${borderWidth}px`
      }
      return (
        <div className='chaise-app-wrapper-sm-spinner'>
          <div className='spinner-border text-light' role='status' style={spinnerStyles}>
            <span className='sr-only'>Loading...</span>
          </div>
        </div>
      )
    }

    return <ChaiseSpinner />;
  }

  return (
    <StrictMode>
      <ErrorBoundary
        FallbackComponent={errorFallback}
      >
        {/* show spinner if we're waiting for configuration and there are no error during configuration */}
        {errors.length === 0 && !configDone && renderSpinner()}
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
  ignoreHashChange,
  dontFetchSession,
  smallSpinnerContainer
}: AppWrapperProps): JSX.Element => {
  return (
    <ErrorProvider>
      <AuthnProvider>
        <NavbarProvider>
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
            dontFetchSession={dontFetchSession}
            smallSpinnerContainer={smallSpinnerContainer}
          >
            {children}
          </AppWrapperInner>
        </ConditionalWrapper>
        </NavbarProvider>
      </AuthnProvider>
    </ErrorProvider>
  );
};

export default AppWrapper;

