import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// hooks
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// model
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import Recordset, { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import { RECORDSET_DEAFULT_PAGE_SIZE, APP_ROOT_ID_NAME } from '@isrd-isi-edu/chaise/src/utils/constants';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

const recordsetSettings = {
  appName: 'recordset',
  appTitle: 'Recordset',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true
};

const RecordsetApp = (): JSX.Element => {
  const { addAlert } = useAlert()
  const { createPromptExpirationToken, session, showPreviousSessionAlert } = useAuthn();
  const { dispatchError, errors } = useError();
  const [recordsetProps, setRecordsetProps] = useState<RecordsetProps | null>(null);

  useEffect(() => {
    const logObject: any = {};
    const res = chaiseURItoErmrestURI(windowRef.location);
    if (res.pcid) logObject.pcid = res.pcid;
    if (res.ppid) logObject.ppid = res.ppid;
    if (res.paction) logObject.paction = res.paction; // currently only captures the "applyQuery" action from the show saved query popup
    if (res.queryParams && 'savedQueryRid' in res.queryParams) logObject.sq_rid = res.queryParams.savedQueryRid;
    if (res.isQueryParameter) logObject.cqp = 1;

    ConfigService.ERMrest.resolve(res.ermrestUri).then((response: any) => {
      const reference = response.contextualize.compact;

      updateHeadTitle(getDisplaynameInnerText(reference.displayname));

      // TODO saved query?

      if (!session && showPreviousSessionAlert()) {
        addAlert(MESSAGE_MAP.previousSession.message, ChaiseAlertType.WARNING, createPromptExpirationToken, true);
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

      let initialPageLimit = RECORDSET_DEAFULT_PAGE_SIZE;
      if (reference.location.queryParams.limit) {
        initialPageLimit = parseInt(reference.location.queryParams.limit, 10);
      } else if (reference.display.defaultPageSize) {
        initialPageLimit = reference.display.defaultPageSize;
      }

      const chaiseConfig = ConfigService.chaiseConfig;
      const modifyEnabled = chaiseConfig.editRecord !== false;
      const deleteEnabled = chaiseConfig.deleteRecord === true;
      const showFaceting = chaiseConfig.showFaceting === true;

      const recordsetConfig: RecordsetConfig = {
        viewable: true,
        editable: modifyEnabled,
        deletable: modifyEnabled && deleteEnabled,
        sortable: true,
        selectMode: RecordsetSelectMode.NO_SELECT,
        showFaceting,
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
      config={recordsetProps.config}
      logInfo={recordsetProps.logInfo}
      initialPageLimit={recordsetProps.initialPageLimit}
    />
  );
};


const root = createRoot(document.getElementById(APP_ROOT_ID_NAME) as HTMLElement);
root.render(
  <AppWrapper
    appSettings={recordsetSettings}
    includeAlerts={true}
    includeNavbar={true}
    displaySpinner={true}
  >
    <RecordsetApp />
  </AppWrapper>
);
