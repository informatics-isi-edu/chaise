// Navbar App
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import '@chaise/assets/scss/app.scss';

import React  from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from '@chaise/store/store';
import FontAwesome from '@chaise/services/fontawesome';

import ChaiseNavbar from '@chaise/components/navbar';

const NavbarApp = (): JSX.Element => {

  FontAwesome.addRecordsetFonts();

  return (
    <div>
      <ChaiseNavbar />
    </div>
  );
};

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <NavbarApp />
    </React.StrictMode>
  </Provider>,
  document.getElementById("chaise-navbar-app-root")
);