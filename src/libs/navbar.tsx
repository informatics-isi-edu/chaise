// Navbar App
import 'bootstrap/dist/css/bootstrap.min.css';

import '@isrd-isi-edu/chaise/src/assets/scss/app.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import ChaiseNavbar from '@isrd-isi-edu/chaise/src/components/navbar';

// TODO should use the appwrapper

const NavbarLib = (): JSX.Element => {

  return (
    <div>
      <ChaiseNavbar />
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <NavbarLib />
  </React.StrictMode>,
  document.getElementById('chaise-navbar-app-root'),
);
