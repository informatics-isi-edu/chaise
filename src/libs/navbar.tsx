// Navbar App
import 'bootstrap/dist/css/bootstrap.min.css';

import '@chaise/assets/scss/app.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import ChaiseNavbar from '@chaise/components/navbar';

// TODO should use the appwrapper

const NavbarApp = (): JSX.Element => {

  return (
    <div>
      <ChaiseNavbar />
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <NavbarApp />
  </React.StrictMode>,
  document.getElementById('chaise-navbar-app-root'),
);
