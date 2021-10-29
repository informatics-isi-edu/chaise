import 'bootstrap/dist/css/bootstrap.min.css';
import 'Vendor/fontawesome/fontawesome.min.css';
import Button from 'react-bootstrap/Button';

import 'Assets/scss/app.scss'

import React  from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from 'Store/store';

const RecordSetApp: React.FC<{}> = (): JSX.Element => {
  return (
    <div>
      <div>This is the recordset app</div>
      <div>
        fontawesome works: <i className="fas fa-filter"></i>
      </div>
      <div className="alert alert-primary">
        Bootstrap works!
      </div>
      <Button>bootstrap button</Button>
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
