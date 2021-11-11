import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import '@chaise/assets/scss/app.scss';

import React  from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from '@chaise/store/store';
import FontAwesome from '@chaise/services/fontawesome';
import Spinner from '@chaise/components/spinner';

const RecordSetApp = (): JSX.Element => {

  FontAwesome.addRecordsetFonts();

  return (
    <div>
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

    </div>
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
