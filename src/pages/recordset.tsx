import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import Recordset from '@isrd-isi-edu/chaise/src/components/recordset/recordset';

// hooks
import { useEffect, useRef, useState, type JSX } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode, RecordsetProps } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { AuthnStorageService } from '@isrd-isi-edu/chaise/src/services/authn-storage';
import { ConfigService, ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilties
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { APP_NAMES, RECORDSET_DEFAULT_PAGE_SIZE, ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { addAppContainerClasses, updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { initializeSavingQueries } from '@isrd-isi-edu/chaise/src/utils/config-utils';


const recordsetSettings : ConfigServiceSettings = {
  appName: APP_NAMES.RECORDSET,
  appTitle: 'Recordset',
  overrideHeadTitle: true,
  overrideImagePreviewBehavior: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true
};

const RecordsetApp = (): JSX.Element => {
  const { addAlert } = useAlert()
  const { session, showPreviousSessionAlert } = useAuthn();
  const { dispatchError, errors } = useError();
  const [recordsetProps, setRecordsetProps] = useState<RecordsetProps | null>(null);

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
    if (res.paction) logObject.paction = res.paction; // currently only captures the "applyQuery" action from the show saved query popup
    if (res.queryParams && 'savedQueryRid' in res.queryParams) logObject.sq_rid = res.queryParams.savedQueryRid;
    if (res.isQueryParameter) logObject.cqp = 1;

    ConfigService.ERMrest.resolve(res.ermrestUri).then((response: any) => {
      const reference = response.contextualize.compact;

      // add schema and table name classes to app-container
      addAppContainerClasses(reference, recordsetSettings.appName);

      // NOTE: should be intialized here since we have access to the queryParams and they are removed when recordset is initialized
      const savedQueryObj = initializeSavingQueries(response, res.queryParams);

      updateHeadTitle(getDisplaynameInnerText(reference.displayname));

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

      // set the global log stack and log stack path
      LogService.config(logStack, logStackPath);

      let initialPageLimit = RECORDSET_DEFAULT_PAGE_SIZE;
      if (reference.location.queryParams.limit) {
        initialPageLimit = parseInt(reference.location.queryParams.limit, 10);
      } else if (reference.display.defaultPageSize) {
        initialPageLimit = reference.display.defaultPageSize;
      }

      const chaiseConfig = ConfigService.chaiseConfig;

      const recordsetConfig: RecordsetConfig = {
        viewable: true,
        editable: chaiseConfig.editRecord !== false,
        deletable: chaiseConfig.deleteRecord !== false,
        sortable: true,
        selectMode: RecordsetSelectMode.NO_SELECT,
        disableFaceting: false,
        displayMode: RecordsetDisplayMode.FULLSCREEN,
        // TODO
        // enableFavorites
      };

      const logInfo = {
        logObject,
        logStack: [
          LogService.getStackNode(
            LogStackTypes.SET,
            reference.table,
            reference.filterLogInfo,
          ),
        ],
        logStackPath,
      };

      setRecordsetProps({
        initialReference: reference,
        initialPageLimit,
        config: recordsetConfig,
        logInfo,
        savedQueryConfig: savedQueryObj
      });
    }).catch((err: any) => {
      if (isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
        err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
      }
      dispatchError({ error: err });
    });
  }, []);

  // if there was an error during setup, hide the spinner
  if (!recordsetProps && errors.length > 0) {
    return <></>;
  }

  // const recordsetContent = () => {
  if (!recordsetProps) {
    return <ChaiseSpinner />;
  }

  return (
    <Recordset
      initialReference={recordsetProps.initialReference}
      initialPageLimit={recordsetProps.initialPageLimit}
      config={recordsetProps.config}
      logInfo={recordsetProps.logInfo}
      savedQueryConfig={recordsetProps.savedQueryConfig}
    />
  );
};


const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(
  <AppWrapper appSettings={recordsetSettings} includeAlerts includeNavbar displaySpinner>
    <RecordsetApp />
  </AppWrapper>
);
