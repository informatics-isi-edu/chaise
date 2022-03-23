import '@chaise/utils/wdyr';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@chaise/assets/scss/app.scss';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

import { store } from '@chaise/store/store';
import { useAppDispatch } from '@chaise/store/hooks';
import { showError } from '@chaise/store/slices/error';
import { ConfigService } from '@chaise/services/config';

import ChaiseNavbar from '@chaise/components/navbar';
import ErrorModal from '@chaise/components/error-modal';
import ChaiseSpinner from '@chaise/components/spinner';
import RecordSet, { RecordSetProps } from '@chaise/components/recordset';
import $log from '@chaise/services/logger';
import AuthnService from '@chaise/services/authn';
import { loginUser } from '@chaise/store/slices/authn';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@chaise/utils/uri-utils';
import { windowRef } from '@chaise/utils/window-ref';
import TypeUtils from '@chaise/utils/type-utils';
import { updateHeadTitle } from '@chaise/utils/head-injector';
import { getDisplaynameInnerText } from '@chaise/utils/data-utils';
import { LogService } from '@chaise/services/log';
import { LogStackTypes } from '@chaise/models/log';
import { RecordSetConfig, RecordSetDisplayMode, RecordsetSelectMode } from '@chaise/models/recordset';

const recordsetSettings = {
  appName: 'recordset',
  appTitle: 'Record Set',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true,
};

const RecordSetApp = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const [configDone, setConfigDone] = useState(false);
  const [recordSetProps, setRecordSetProps] = useState<RecordSetProps|null>(null);

  useEffect(() => {
    $log.debug('recordset page: useEffect');
    if (configDone) return;

    /**
     * global error handler for uncaught errors
     */
    window.addEventListener('error', (event) => {
      $log.log('got the error in catch-all');
      dispatch(showError({ error: event.error, isGlobal: true }));
    });
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      $log.log('got the error in catch-all (unhandled rejection)');
      dispatch(showError({ error: event.reason, isGlobal: true }));
    });

    /**
     * - get session
     * - Setup the app (chaise-config, etc)
     * - setup ermrestjs
     */
    let logObject: any = {};
    AuthnService.getSession('').then((response) => {
      if (response) {
        dispatch(loginUser(response));
      }
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

      const recordsetConfig : RecordSetConfig = {
        viewable: true,
        editable: modifyEnabled,
        deletable: modifyEnabled && deleteEnabled,
        sortable: true,
        selectMode: RecordsetSelectMode.NO_SELECT,
        showFaceting,
        facetPanelOpen: showFaceting,
        disableFaceting: false,
        displayMode: RecordSetDisplayMode.FULLSCREEN,
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


      setRecordSetProps({
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
      dispatch(showError({ error: err, isGlobal: true }));
    });
  }, [configDone] );

  const errorFallback = ({ error }: FallbackProps) => {
    $log.log('error fallback of the main error boundary');

    // TODO uncomment
    // ErrorService.logTerminalError(error);
    dispatch(showError({ error, isGlobal: true }));

    // the error modal will be displayed so there's no need for the fallback
    return null;
  };

  $log.debug('recordset page: render');

  const recordsetContent = () => {
    if (!configDone || !recordSetProps) {
      return <ChaiseSpinner />;
    }

    return (
      <div className='app-container'>
        <ChaiseNavbar />
        <RecordSet
          initialReference={recordSetProps.initialReference}
          config={recordSetProps.config}
          logInfo={recordSetProps.logInfo}
          initialPageLimit={recordSetProps.initialPageLimit}
        />
      </div>
    );
  };

  return (
    <>
      <ErrorBoundary
        FallbackComponent={errorFallback}
      >
        {recordsetContent()}
      </ErrorBoundary>
      <ErrorModal />
    </>
  );
};

if (process.env.NODE_ENV === 'development') {
  RecordSetApp.whyDidYouRender = true;
}

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <RecordSetApp />
    </React.StrictMode>
  </Provider>,
  document.getElementById('chaise-app-root'),
);
