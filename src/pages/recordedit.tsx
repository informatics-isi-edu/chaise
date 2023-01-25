import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import Recordedit, { RecordeditProps } from '@isrd-isi-edu/chaise/src/components/recordedit/recordedit';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useState, useRef } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// models
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { LogAppModes, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { appModes } from '@isrd-isi-edu/chaise/src/models/recordedit';

// services
import { AuthnStorageService } from '@isrd-isi-edu/chaise/src/services/authn-storage';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { addAppContainerClasses, updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { APP_NAMES, ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

const recordeditSettings = {
  appName: APP_NAMES.RECORDEDIT,
  appTitle: 'Recordedit',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true
};

const RecordeditApp = (): JSX.Element => {

  const { addAlert } = useAlert();
  const { session, showPreviousSessionAlert, popupLogin } = useAuthn();
  const { dispatchError, errors } = useError();

  const [recordeditProps, setRecordeditProps] = useState<RecordeditProps | null>(null);

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
      let appMode = appModes.CREATE;
      let reference = response;
      const location = reference.location;

      if (location.filter || location.facets) {
        appMode = res.queryParams.prefill ? appModes.CREATE : (res.queryParams.copy ? appModes.COPY : appModes.EDIT);
      } else if (res.queryParams.limit) {
        appMode = appModes.EDIT;
      }

      if (appMode === appModes.EDIT) {
        reference = response.contextualize.entryEdit;
      } else if (appMode === appModes.CREATE || appMode === appModes.COPY) {
        reference = response.contextualize.entryCreate;
      }

      // add schema and table name classes to app-container
      addAppContainerClasses(reference, recordeditSettings.appName);

      if (!session && showPreviousSessionAlert()) {
        addAlert(MESSAGE_MAP.previousSession.message, ChaiseAlertType.WARNING, AuthnStorageService.createPromptExpirationToken, true);
      }


      let logAppMode = LogAppModes.EDIT;
      if (appMode === appModes.COPY) {
        logAppMode = LogAppModes.CREATE_COPY;
      } else if (appMode === appModes.CREATE) {
        if (res.queryParams.invalidate && res.queryParams.prefill) {
          logAppMode = LogAppModes.CREATE_PRESELECT;
        } else {
          logAppMode = LogAppModes.CREATE;
        }
      }

      const logStack = [
        LogService.getStackNode(
          LogStackTypes.SET,
          reference.table,
          reference.filterLogInfo,
        ),
      ];
      const logStackPath = LogStackTypes.SET;

      // // set the global log stack and log stack path
      LogService.config(logStack, logStackPath);

      const queryParams = res.queryParams || {};
      setRecordeditProps({
        reference, appMode, queryParams,
        logInfo: { logAppMode, logObject, logStack, logStackPath }
      });

    }).catch((err: any) => {
      if (isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
        err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
      }
      dispatchError({ error: err });
    });

  }, []);

  // if there was an error during setup, hide the spinner
  if (!recordeditProps && errors.length > 0) {
    return <></>;
  }

  if (!recordeditProps) {
    return <ChaiseSpinner />;
  }

  return <Recordedit {...recordeditProps} />;
};

// TODO: make sure this is what we want
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
