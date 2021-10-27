import React  from 'react'

const Login: React.FC<{}> = (): JSX.Element => {

  const handleLoginClick = () => {
        

        // store.dispatch({ type: "reference/setAppState", appState: "Recordedit", referencePath: refPath });
    }

  const renderLogin = () => {
      return (<ul class="nav navbar-nav navbar-right">
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
