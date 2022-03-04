import React from 'react';
import { ConfigService } from '@chaise/services/config';
import AuthnService from '@chaise/services/authn';

import { useAppSelector } from '@chaise/store/hooks';
import { RootState } from '@chaise/store/store';

import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';

import TypeUtils from '@chaise/utils/type-utils';

const ChaiseLogin = (): JSX.Element => {
  // get the user from the store
  const authnRes = useAppSelector((state: RootState) => state.authn);

  const cc = ConfigService.chaiseConfig;

  const handleLoginClick = () => {
    AuthnService.popupLogin(null, null);
  };

  const handeLogoutClick = () => {
    // TODO: implement logout
    console.log('logout');
  };

  const openProfile = () => {
    console.log('open profile');
  };

  const logDropdownOpen = () => {
    // TODO: log dropdown opened
    console.log('dropdown opened');
  };

  const showSignupLink = () => {
    if (!cc.signUpURL) return;

    return (<Nav.Link id="signup-link" className="navbar-nav" href={cc.signUpUrl}>Sign Up</Nav.Link>);
  };

  const displayName = () => {
    if (!TypeUtils.isStringAndNotEmpty(authnRes.client.id)) return;

    return authnRes.client.full_name || authnRes.client.display_name || authnRes.client.email || authnRes.client.id;
  };

  const renderMenuChildren = () =>

    // TODO check cc.loggedInMenu
    (
      <>
        <NavDropdown.Item id="profile-link" onClick={openProfile}>My Profile</NavDropdown.Item>
        <NavDropdown.Item id="logout-link" onClick={handeLogoutClick}>Log Out</NavDropdown.Item>
      </>
    );

  // return children.map((child: any, index: number) => {
  //   if (!MenuUtils.canShow(child)) return;

  //   // create an unclickable header
  //   if (child.header == true && !child.children && !child.url) {
  //     return (<NavDropdown.Header key={index} className="chaise-dropdown-header">{child.name}</NavDropdown.Header>);
  //   }

  //   // TODO: onClick logging
  //   if ((!child.children && child.url) || !MenuUtils.canEnable(child)) {
  //     return (<NavDropdown.Item
  //       key={index}
  //       href={child.url}
  //       target={child.newTab ? '_blank' : '_self'}
  //       className={MenuUtils.menuItemClasses(child, true)}
  //       dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}
  //     >
  //     </NavDropdown.Item>);
  //   }

  //   if (child.children && MenuUtils.canEnable(child)) {
  //     return (<Dropdown key={index} drop='end'>
  //       <Dropdown.Toggle as='a' variant="dark" className={MenuUtils.menuItemClasses(child, true)} dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}></Dropdown.Toggle>
  //       <Dropdown.Menu>
  //         {renderMenuChildren(child.children)}
  //       </Dropdown.Menu>
  //     </Dropdown>)
  //     // TODO: navbar-header-container
  //   }

  //   return (<></>);
  // });

  const renderLoginDropdown = () => {
    if (!TypeUtils.isStringAndNotEmpty(authnRes.client.id)) {
      return (
        <>
          {showSignupLink()}
          <Nav.Link id="login-link" className="navbar-nav" onClick={handleLoginClick}>Log In</Nav.Link>
        </>
      );
    }

    // TODO: fix onClick={logDropdownOpen}
    // TODO: add logged in user tooltip
    return (
      <NavDropdown title={displayName()} className="navbar-nav username-display" style={{ marginLeft: (cc.resolverImplicitCatalog === null || cc.hideGoToRID === true) ? 'auto' : '' }}>
        {renderMenuChildren()}
      </NavDropdown>
    );
  };

  return (
    <>
      {renderLoginDropdown()}
    </>
  );
};

export default ChaiseLogin;
