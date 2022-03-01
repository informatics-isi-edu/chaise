import 'bootstrap/dist/css/bootstrap.min.css';
import '@chaise/assets/scss/app.scss';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

import { store } from '@chaise/store/store';
import { useAppDispatch } from '@chaise/store/hooks';
import { showError } from '@chaise/store/slices/error';

import FontAwesome from '@chaise/services/fontawesome';
import { ConfigService } from '@chaise/services/config';

import ChaiseNavbar from '@chaise/components/navbar';
import ErrorModal from '@chaise/components/error-modal';
import Spinner from '@chaise/components/spinner';
import RecordSet from '@chaise/components/recordset';
import $log from '@chaise/services/logger';
import AuthnService from '@chaise/services/authn';
import { loginUser } from '@chaise/store/slices/authn';

const RecordSetApp = (): JSX.Element => {
  const recordsetSettings = {
    appName: "recordset",
    appTitle: "Record Set",
    overrideHeadTitle: true,
    overrideDownloadClickBehavior: true,
    overrideExternalLinkBehavior: true
  };

  const dispatch = useAppDispatch();
  const [configDone, setConfigDone] = useState(false);

  // add all the font awesomes that are used
  FontAwesome.addRecordsetFonts();

  useEffect(() => {
    if (configDone) return;

    /**
     * global error handler for uncaught errors
     */
    window.addEventListener("error", (event) => {
      $log.log("got the error in catch-all");
      dispatch(showError({ error: event.error, isGlobal: true }));
    });
    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      $log.log("got the error in catch-all (unhandled rejection)");
      dispatch(showError({ error: event.reason, isGlobal: true }));
    });

    /**
     * - get session
     * - Setup the app (chaise-config, etc)
     * - setup ermrestjs
     */
    AuthnService.getSession("").then((response) => {
      if (response) {
        dispatch(loginUser(response));
      }
      return ConfigService.configure(recordsetSettings);
    }).then(() => {
      console.dir(ConfigService.chaiseConfig);
      setConfigDone(true);

      // we should ge the reference
    }).catch((err) => {
      dispatch(showError({ error: err, isGlobal: true }));
    });
  });

  const errorFallback = ({ error }: FallbackProps) => {
    $log.log("error fallback of the main error boundary");

    // TODO context header params
    //ErrorHandler.logTerminalError(error);
    dispatch(showError({ error: error, isGlobal: true }));

    // the error modal will be displayed so there's no need for the fallback
    return null;
  }

  const recordsetContent = () => {
    if (!configDone) {
      return <Spinner />
    }

    return (
      <div className="app-container">
        <ChaiseNavbar />
        <RecordSet />
      </div>
    )

  }

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

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <RecordSetApp />
    </React.StrictMode>
  </Provider>,
  document.getElementById("chaise-app-root")
);
