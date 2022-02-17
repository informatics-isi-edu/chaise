import React, { useEffect, useState } from 'react'
import AuthenService from '@chaise/services/authen';

import { useAppDispatch } from '@chaise/store/hooks';
import { loginUser } from '@chaise/store/slices/authen';

import Dropdown from 'react-bootstrap/Dropdown';

const Login = (): JSX.Element => {

  const dispatch = useAppDispatch();
  // instantiate type to ChaiseUser
  const [authenRes, setAuthenRes] = useState<ChaiseUser>();
  const [isLoaded, setIsLoaded] = useState(false);

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
    // TODO: change to check for signUpUrl
    if (true) return;

    return (<li>
      <a id="signup-link" ng-href="{{signUpURL}}">Sign Up</a>
    </li>)
  }

  const displayName = () => {
    if (!authenRes) return;

    return authenRes.client.full_name || authenRes.client.display_name || authenRes.client.email || authenRes.client.id;
  }

  const loginDropdown = () => {
    if (!authenRes && isLoaded) {
      return (<>
        {showSignupLink()}
        <li>
          <a id="login-link" onClick={handleLoginClick}>Log In</a>
        </li>
      </>)
    }

    // TODO: fix onClick={logDropdownOpen}
    // TODO: add logged in user tooltip
    // TODO: list of menu options from config
    return (
      <Dropdown as="li">
        <Dropdown.Toggle as="a">
          <span className="username-display">{displayName()}</span>
        </Dropdown.Toggle>

        <Dropdown.Menu className="chaise-login-menu" as="ul">
          <Dropdown.Item as="li" id="profile-link" onClick={openProfile}><a>My Profile</a></Dropdown.Item>
          <Dropdown.Item as="li" id="logout-link" onClick={handeLogoutClick}><a>Log Out</a></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    )

  }

  const renderLogin = () => {
    return (<ul className="nav navbar-nav navbar-right">
      {loginDropdown()}
    </ul>)
  }

  return (<div style={{ "float": "right" }}>
    {renderLogin()}
  </div>)

}

export default Login;
