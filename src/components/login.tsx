import AuthenService from '@chaise/services/authen';

import { useAppSelector } from '@chaise/store/hooks';
import { RootState } from '@chaise/store/store';

import Dropdown from 'react-bootstrap/Dropdown';
import { TypeUtils } from '@chaise/utils/utils';

const Login = (): JSX.Element => {

  // get the user from the store
  const authenRes = useAppSelector((state: RootState) => state.authen);

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
    if (!TypeUtils.isStringAndNotEmpty(authenRes.client.id)) return;

    return authenRes.client.full_name || authenRes.client.display_name || authenRes.client.email || authenRes.client.id;
  }

  const loginDropdown = () => {
    if (!TypeUtils.isStringAndNotEmpty(authenRes.client.id)) {
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
