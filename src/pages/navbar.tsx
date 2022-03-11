// Navbar App
import 'bootstrap/dist/css/bootstrap.min.css';

import '@chaise/assets/scss/app.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from '@chaise/store/store';

import ChaiseNavbar from '@chaise/components/navbar';

const NavbarApp = (): JSX.Element => {

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
  document.getElementById('chaise-navbar-app-root'),
);
