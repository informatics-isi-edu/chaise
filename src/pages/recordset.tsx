// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'Vendor/fontawesome/fontawesome.css'
import 'Assets/scss/app.scss'

import React  from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux';
import { store } from 'Store/store';

const RecordSetApp: React.FC<{}> = (): JSX.Element => {
  return (
    <div>This is the recordset app</div>
  )
}

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <RecordSetApp />
    </React.StrictMode>
  </Provider>,
  document.getElementById("chaise-app-root")
);
