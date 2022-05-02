import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@chaise/assets/scss/app.scss';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

import { ConfigService } from '@chaise/services/config';

import ChaiseNavbar from '@chaise/components/navbar';
import ErrorModal from '@chaise/components/error-modal';
import ChaiseSpinner from '@chaise/components/spinner';
import Recordset, { RecordsetProps } from '@chaise/components/recordset';
import $log from '@chaise/services/logger';
import AuthnService from '@chaise/services/authn';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@chaise/utils/uri-utils';
import { windowRef } from '@chaise/utils/window-ref';
import TypeUtils from '@chaise/utils/type-utils';
import { updateHeadTitle } from '@chaise/utils/head-injector';
import { getDisplaynameInnerText } from '@chaise/utils/data-utils';
import { LogService } from '@chaise/services/log';
import { LogStackTypes } from '@chaise/models/log';
import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@chaise/models/recordset';
import ErrorPorvider from '@chaise/providers/error';
import useError from '@chaise/hooks/error';
import RecordsetProvider from '@chaise/providers/recordset';
import AlertsProvider from '@chaise/providers/alerts';
import Alerts from '@chaise/components/alerts';

const recordsetSettings = {
  appName: 'recordset',
  appTitle: 'Record Set',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true,
};

const RecordsetApp = (): JSX.Element => {
  const { dispatchError } = useError();
  const [configDone, setConfigDone] = useState(false);
  const [recordsetProps, setRecordsetProps] = useState<RecordsetProps | null>(null);

  useEffect(() => {
    $log.debug('recordset page: useEffect');
    if (configDone) return;

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

    /**
     * - get session
     * - Setup the app (chaise-config, etc)
     * - setup ermrestjs
     */
    let logObject: any = {};
    AuthnService.getSession('').then(() => {
      return ConfigService.configure(recordsetSettings);
    }).then(() => {

      const res = chaiseURItoErmrestURI(windowRef.location);
      if (res.pcid) logObject.pcid = res.pcid;
      if (res.ppid) logObject.ppid = res.ppid;
      if (res.paction) logObject.paction = res.paction; // currently only captures the "applyQuery" action from the show saved query popup
      if (res.queryParams && 'savedQueryRid' in res.queryParams) logObject.sq_rid = res.queryParams.savedQueryRid;
      if (res.isQueryParameter) logObject.cqp = 1;

      return ConfigService.ERMrest.resolve(res.ermrestUri);
    }).then((response: any) => {
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
      setConfigDone(true);
    }).catch((err) => {
      if (TypeUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
        err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
      }
      dispatchError({ error: err, isGlobal: true });
    });
  }, [configDone]);

  const errorFallback = ({ error }: FallbackProps) => {
    $log.log('error fallback of the main error boundary');

    // TODO uncomment
    // ErrorService.logTerminalError(error);
    dispatchError({ error: error, isGlobal: true });

    // the error modal will be displayed so there's no need for the fallback
    return null;
  };

  $log.debug('recordset page: render');

  const recordsetContent = () => {
    if (!configDone || !recordsetProps) {
      return <ChaiseSpinner />;
    }

    return (
      <div className='app-container'>
        <ChaiseNavbar />
        {/* app level alerts */}
        <Alerts />
        <Recordset
          initialReference={recordsetProps.initialReference}
          config={recordsetProps.config}
          logInfo={recordsetProps.logInfo}
          initialPageLimit={recordsetProps.initialPageLimit}
        />
      </div>
    );
  };

  return (
    <>
      <ErrorBoundary
        FallbackComponent={errorFallback}
      >
        {/* app level alerts */}
        <AlertsProvider>
          {recordsetContent()}
        </AlertsProvider>
      </ErrorBoundary>
      <ErrorModal />
    </>
  );
};

ReactDOM.render(
  <ErrorPorvider>
    <React.StrictMode>
      <RecordsetApp />
    </React.StrictMode>
  </ErrorPorvider>,
  document.getElementById('chaise-app-root'),
);
