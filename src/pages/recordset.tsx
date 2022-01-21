import 'bootstrap/dist/css/bootstrap.min.css';
import '@chaise/assets/scss/app.scss';

import React, { useEffect }  from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ErrorBoundary, FallbackProps} from 'react-error-boundary'

import { store } from '@chaise/store/store';
import { useAppDispatch } from '@chaise/store/hooks';
import { showError } from '@chaise/store/slices/error';

import FontAwesome from '@chaise/services/fontawesome';

import Navbar from '@chaise/components/navbar';
import ErrorTest from '@chaise/components/error-test';
import ErrorModal from '@chaise/components/error-modal';
import ExampleComponent from '@chaise/components/example';

const RecordSetApp = (): JSX.Element => {

  const dispatch = useAppDispatch();

  FontAwesome.addRecordsetFonts();

  useEffect(() => {
    window.addEventListener("error", (event) => {
      console.log("got the error in catch-all");
      dispatch(showError({error: event.error, isGlobal: true}));
      return true;
    });

    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      console.log("got the error in catch-all (unhandled rejection)");
      dispatch(showError({error: event.reason, isGlobal: true}));
    });
  });

  return (
    <>
    <ErrorBoundary
      // the onerror will catch the error and show the proper error
      FallbackComponent={() => null}
    >
      <Navbar />
      <div>This is the recordset app</div>
      <div>
        fontawesome works: <FontAwesomeIcon icon="coffee" />
      </div>
      <div className="alert alert-primary">
        Bootstrap works!
      </div>
      <Button>bootstrap button</Button>
      <div>
        <ExampleComponent app="recordset" />
      </div>
      <div>
        <br/><br/>
        Test error handling:
        <ErrorTest/>
      </div>
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


// TODO
// windowRef.onerror = function (msg, url, lineNo, columnNo, error) {
//   if (!error) return;
//   useAppDispatch(showError({object: error}));
// };

// windowRef.onunhandledrejection = function(e) {
//   // useAppDispatch(showError(object: e.reason));
// };
