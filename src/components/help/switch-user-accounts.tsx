/* eslint-disable react/no-unescaped-entities */

// hooks
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

const SwitchUserAccountsHelp = (): JSX.Element => {
  const { logout, popupLogin } = useAuthn();

  return (
    <div className='switch-user-accounts-container'>
      <h2>Switch to a different user identity</h2>
      <p>If a different identity is used to login unintentionally and you want to go back to your previous identity without loosing your existing work (e.g. the data submission content), please follow the following steps to switch identity.</p>
      <ol>
        <li>Use a different tab to access the navigation bar, then click the "Log out" button in the upper right corner on the navigation bar. Or click <a onClick={() => logout(LogActions.SWITCH_USER_ACCOUNTS_LOGOUT)}>logout</a> here.</li>
        <li>While logging out, please make sure that you also logout from your identity provider (such as Globus, Google, or your institution) as your identity is usually cached by the provider and will automatically be used for login without being prompted.</li>
        <li>Log back in with the intended identity by clicking the "Log In" button in the upper right corner of the navigation bar, or click <a onClick={() => popupLogin(LogActions.SWITCH_USER_ACCOUNTS_WIKI_LOGIN)}>login</a> here.</li>
        <li>Once you are logged in with the intended identity, go back to the on-going tab where you want to resume the work (e.g. data submission tab), and click "Continue" to resume identity.</li>
      </ol>

      <h2>Continue login after session expires</h2>
      <ul><li>To resume your identity after the existing session expires, click the "Log In" button in the upper right corner on the navigation bar, or click <a onClick={() => popupLogin(LogActions.SWITCH_USER_ACCOUNTS_WIKI_LOGIN)}>login</a> here.</li></ul>
    </div>
  );
}

export default SwitchUserAccountsHelp;
