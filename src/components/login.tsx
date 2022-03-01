import React, { useEffect, useState } from 'react'

import { ConfigService } from '@chaise/services/config';
import AuthenService from '@chaise/services/authen';

import { useAppDispatch } from '@chaise/store/hooks';
import { loginUser } from '@chaise/store/slices/authen';

import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';

const ChaiseLogin = (): JSX.Element => {
  const dispatch = useAppDispatch();
  // instantiate type to ChaiseUser
  const [authenRes, setAuthenRes] = useState<ChaiseUser>();
  const [isLoaded, setIsLoaded] = useState(false);

  var cc = ConfigService.chaiseConfig;

  useEffect(() => {
    if (!isLoaded) {
      // TODO: fill in context
      AuthenService.getSession("").then(function (response) {
        setAuthenRes(response);
        setIsLoaded(true);
        console.log("before store: ", response);
        // TODO: ingest response and create User and Client objects

        if (response) {
          dispatch(loginUser(response));
        }
      });
    }
  });

  const handleLoginClick = () => {
    AuthenService.popupLogin(null, null);
  }

  const handeLogoutClick = () => {
    // TODO: implement logout
    console.log("logout");
  }

  const openProfile = () => {
    console.log("open profile");
  }

  const logDropdownOpen = () => {
    // TODO: log dropdown opened
    console.log("dropdown opened")
  }

  const showSignupLink = () => {
    if (!cc.signUpURL) return;

    return (<Nav.Link id="signup-link" className="navbar-nav" href={cc.signUpUrl}>Sign Up</Nav.Link>)
  }

  const displayName = () => {
    if (!authenRes) return;

    return authenRes.client.full_name || authenRes.client.display_name || authenRes.client.email || authenRes.client.id;
  }

  const renderMenuChildren = () => {

    // TODO check cc.loggedInMenu
    return (<>
      <NavDropdown.Item id="profile-link" onClick={openProfile}>My Profile</NavDropdown.Item>
      <NavDropdown.Item id="logout-link" onClick={handeLogoutClick}>Log Out</NavDropdown.Item>
    </>)

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
  }

  const renderLoginDropdown = () => {
    if (!authenRes && isLoaded) {
      return (<>
        {showSignupLink()}
        <Nav.Link id="login-link" className="navbar-nav" onClick={handleLoginClick}>Log In</Nav.Link>
      </>)
    }

    // TODO: fix onClick={logDropdownOpen}
    // TODO: add logged in user tooltip
    return (<NavDropdown title={displayName()} className="navbar-nav username-display">
      {renderMenuChildren()}
    </NavDropdown>)

  }

  return (<>
      {renderLoginDropdown()}
  </>)

}

export default ChaiseLogin;
