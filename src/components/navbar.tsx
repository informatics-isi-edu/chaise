import React from 'react'

import Login from '@chaise/components/login';

const Navbar = (): JSX.Element => {
  return (<header id="navheader" className="row">
    <nav id="mainnav" className="navbar navbar-inverse" role="navigation">
      <div className="navbar-collapse navbar-inverse" id="fb-navbar-main-collapse">
      <Login />
      </div>
    </nav>
  </header>)

}

export default Navbar;
