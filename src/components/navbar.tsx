import React from 'react'

import { ConfigService } from '@chaise/services/config';
import Login from '@chaise/components/login';

const Navbar = (): JSX.Element => {
  var cc = ConfigService.chaiseConfig;
  console.log(cc);

  const brandHref = () => {
    return cc.navbarBrandUrl || "/";
  }

  const renderBrandImage = () => {
    if (!cc.navbarBrandImage) return;

    return (<span>
      <img id="brand-image" src={cc.navbarBrandImage}></img>
    </span>)
  }

  const renderBrandingHTML = () => {
    return (<>
      {renderBrandImage()}
      <span id="brand-text">{cc.navbarBrandText}</span>
    </>)
  }

  // TODO: add banner above <nav>
  // TODO: navbar toggle button when it shrinks
  // TODO: log branding
  return (<header id="navheader" className="row">
    <nav id="mainnav" className="navbar navbar-inverse" role="navigation">
      <div className="navbar-header">
        <a className="navbar-brand" href={(brandHref())}>{renderBrandingHTML()}</a>
      </div>
      <div className="navbar-collapse navbar-inverse" id="fb-navbar-main-collapse">
        <Login />
      </div>
    </nav>
  </header>)

}

export default Navbar;
