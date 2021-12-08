import React  from 'react'
import AuthenService from '@chaise/services/authen';

const Login = (): JSX.Element => {

  const handleLoginClick = () => {
    // logService.logActions.LOGIN_NAVBAR
    AuthenService.popupLogin(null, null);

      // store.dispatch({ type: "reference/setAppState", appState: "Recordedit", referencePath: refPath });
  }

  const renderLogin = () => {
    return (<ul className="nav navbar-nav navbar-right">
      <li>
        <a id="login-link" onClick={handleLoginClick}>Log In</a>
      </li>
    </ul>)
  }

  return (<div style={{"float": "right"}}>
    {renderLogin()}
  </div>)
}

export default Login;
