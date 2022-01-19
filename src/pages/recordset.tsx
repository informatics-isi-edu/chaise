import 'bootstrap/dist/css/bootstrap.min.css';
import '@chaise/assets/scss/app.scss';

import React  from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ErrorBoundary, FallbackProps} from 'react-error-boundary'

import { store } from '@chaise/store/store';
import { useAppDispatch } from '@chaise/store/hooks';
import { showError } from '@chaise/store/slices/error';

import FontAwesome from '@chaise/services/fontawesome';
import { windowRef } from '@chaise/utils/window-ref';

import Spinner from '@chaise/components/spinner';
import Navbar from '@chaise/components/navbar';
import ErrorTest from '@chaise/components/error-test';
import ErrorModal from '@chaise/components/error-modal';

const RecordSetApp = (): JSX.Element => {

  const dispatch = useAppDispatch();

  FontAwesome.addRecordsetFonts();

  const errorFallback = ({ error }: FallbackProps) => {
    dispatch(showError({error: error}));

    // return empty, so only the error modal is displayed
    return null;
  };

  return (
    <>
    <ErrorBoundary
      FallbackComponent={errorFallback}
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
        spinner is working:
        <br/>
        <Spinner/>
      </div>
      <div>
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
