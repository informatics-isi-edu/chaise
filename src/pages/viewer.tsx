import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import Viewer from '@isrd-isi-edu/chaise/src/components/viewer/viewer';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useState, useRef } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// models
import { ViewerProps } from '@isrd-isi-edu/chaise/src/models/viewer';
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { LogAppModes, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { AuthnStorageService } from '@isrd-isi-edu/chaise/src/services/authn-storage';
import { ConfigService, ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { addAppContainerClasses } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { APP_NAMES, ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

const recordeditSettings : ConfigServiceSettings = {
  appName: APP_NAMES.VIEWER,
  appTitle: 'Image Viewer',
  overrideHeadTitle: true,
  overrideImagePreviewBehavior: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true,
  openIframeLinksInTab: true
};

const RecordeditApp = (): JSX.Element => {

  const { addAlert } = useAlert();
  const { session, showPreviousSessionAlert } = useAuthn();
  const { dispatchError, errors } = useError();

  const [viewerProps, setViewerProps] = useState<ViewerProps | null>(null);

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);

  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;

    const logObject: any = {};
    const res = chaiseURItoErmrestURI(windowRef.location);
    if (res.pcid) logObject.pcid = res.pcid;
    if (res.ppid) logObject.ppid = res.ppid;
    if (res.isQueryParameter) logObject.cqp = 1;

    ConfigService.ERMrest.resolve(res.ermrestUri).then((response: any) => {
      let reference = response;
      const location = reference.location;

      // add schema and table name classes to app-container
      addAppContainerClasses(reference, recordeditSettings.appName);

      if (!session && showPreviousSessionAlert()) {
        addAlert(MESSAGE_MAP.previousSession.message, ChaiseAlertType.WARNING, AuthnStorageService.createPromptExpirationToken, true);
      }

      const logStack = [
        LogService.getStackNode(
          LogStackTypes.SET,
          reference.table,
          reference.filterLogInfo,
        ),
      ];
      const logStackPath = LogStackTypes.SET;

      // set the global log stack, log stack path, and logAppMode
      LogService.config(logStack, logStackPath);

      const queryParams = res.queryParams || {};
      setViewerProps({
        queryParams,
        reference,
        logInfo: { logObject, logStack, logStackPath }
      });

    }).catch((err: any) => {
      if (isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
        err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
      }
      dispatchError({ error: err });
    });

  }, []);

  // if there was an error during setup, hide the spinner
  if (!viewerProps && errors.length > 0) {
    return <></>;
  }

  if (!viewerProps) {
    return <ChaiseSpinner />;
  }

  return <Viewer {...viewerProps} />;
};

const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(
  <AppWrapper
    appSettings={recordeditSettings}
    includeAlerts={true}
    includeNavbar={true}
    displaySpinner={true}
  >
    <RecordeditApp />
  </AppWrapper>
);
