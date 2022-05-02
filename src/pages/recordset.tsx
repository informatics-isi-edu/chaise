import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import { ConfigService } from '@chaise/services/config';

import ChaiseSpinner from '@chaise/components/spinner';
import Recordset, { RecordsetProps } from '@chaise/components/recordset';
import $log from '@chaise/services/logger';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@chaise/utils/uri-utils';
import { windowRef } from '@chaise/utils/window-ref';
import TypeUtils from '@chaise/utils/type-utils';
import { updateHeadTitle } from '@chaise/utils/head-injector';
import { getDisplaynameInnerText } from '@chaise/utils/data-utils';
import { LogService } from '@chaise/services/log';
import { LogStackTypes } from '@chaise/models/log';
import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@chaise/models/recordset';
import useError from '@chaise/hooks/error';
import AppWrapper from '@chaise/components/app-wrapper';

const recordsetSettings = {
  appName: 'recordset',
  appTitle: 'Record Set',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true
};

const RecordsetApp = (): JSX.Element => {
  const { dispatchError, error } = useError();
  const [recordsetProps, setRecordsetProps] = useState<RecordsetProps | null>(null);

  useEffect(() => {
    $log.debug('recordset page: useEffect');
    let logObject: any = {};
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

      // TODO show the session alert
      // if (!session && Session.showPreviousSessionAlert()) {
      //   AlertsService.addAlert(messageMap.previousSession.message, 'warning', Session.createPromptExpirationToken);
      // }

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

      let initialPageLimit = 25;
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
      if (TypeUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
        err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
      }
      dispatchError({ error: err, isGlobal: true });
    });
  }, []);

  // if there was an error during setup, hide the spinner
  if (!recordsetProps && error) {
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

ReactDOM.render(
  <AppWrapper appSettings={recordsetSettings}>
    <RecordsetApp />
  </AppWrapper>,
  document.getElementById('chaise-app-root'),
);
