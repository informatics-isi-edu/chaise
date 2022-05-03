import '@chaise/assets/scss/_login-app.scss';

// Login Popup App
import 'bootstrap/dist/css/bootstrap.min.css';
import '@chaise/assets/scss/app.scss';

import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

// components
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import ChaiseSpinner from '@chaise/components/spinner';
import AppWrapper from '@chaise/components/app-wrapper';

// services
import AuthnService from '@chaise/services/authn';
import { ConfigService } from '@chaise/services/config';
import { LogActions } from '@chaise/models/log';

// utilities
import { validateTermsAndConditionsConfig } from '@chaise/utils/config-utils';
import { queryStringToJSON } from '@chaise/utils/uri-utils';


const loginSettings = {
  appName: 'login2',
  appTitle: 'Login',
  overrideHeadTitle: false,
  overrideDownloadClickBehavior: false,
  overrideExternalLinkBehavior: false
};

const LoginPopupApp = (): JSX.Element => {
  const cc = ConfigService.chaiseConfig;

  const [showInstructions, setShowInstructions] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const authnRes = AuthnService.session;

    const validConfig = validateTermsAndConditionsConfig(cc.termsAndConditionsConfig);
    let hasGroup = false;

    // only check if the user has the group if the config is valid
    if (validConfig && authnRes) {
      // if the user does have the defined group, continue with auto close and reload of the application
      hasGroup = authnRes.attributes.filter(function (attr) {
        return attr.id === cc.termsAndConditionsConfig.groupId;
      }).length > 0;
    }

    // if the config is invalid, don't require group membership to continue automatically
    if (!validConfig || hasGroup) {
      const queryString = queryStringToJSON(window.location.search);
      if (queryString.referrerid && (typeof queryString.action === 'undefined') && window.opener) {
        //For child window
        window.opener.postMessage(window.location.search, window.opener.location.href);


        // POST /ermrest/catalog/registry/entity/CFDE:user_profile?onconflict=skip
        // Content-Type: application/json
        //
        // [
        //     {"id": "...", "display_name": "...", "full_name": "..."}
        // ]
        // TODO: 
        const userProfilePath = '/ermrest/catalog/registry/entity/CFDE:user_profile?onconflict=skip';

        // if hasGroup is true, then authnRes has to be defined
        if (validConfig && authnRes) {
          const rows = [{
            'id': authnRes.client.id,
            'display_name': authnRes.client.display_name,
            'full_name': authnRes.client.full_name
          }]

          // we only want to force adding to this group if the termsAndConditionsConfig is defined
          // TODO: this should be it's own configuration property
          //    - should it be part of termsAndConditionsConfig
          //    - or it's own property since this could be for a separate feature request
          //       - (having user profiles but not require a specific globus group for login)
          ConfigService.http.post(window.location.origin + userProfilePath, rows).then((response: any) => {
            window.close();
          }).catch((error: any) => {
            // NOTE: this should almost never happen
            // I think this shouldn't "close the window" automatically
            // if a user reports this hanging around, we need to identify what error caused it
            // should be easy since the error will be logged with context pointing to login2 i believe
            console.log(error);
            console.log('error creating user');
          });
        } else {
          window.close();
        }
      }
    } else {
      // show the instructions if the user doesn't have the required group
      setShowInstructions(!hasGroup);
      // if this login process is used for verifying group membership, that group is REQUIRED to have an active login
      // log the user out if they don't have the group
      AuthnService.logoutWithoutRedirect(LogActions.VERIFY_GLOBUS_GROUP_LOGOUT);
    }
  }, []);

  const reLogin = () => {
    setShowSpinner(true);
    AuthnService.refreshLogin(LogActions.VERIFY_GLOBUS_GROUP_LOGIN).then((redirectUrl: any) => {
      setShowSpinner(false);

      window.location = redirectUrl;
    });
  }

  const renderInstructions = () => {
    if (!showInstructions) return;

    const groupName = '"' + cc.termsAndConditionsConfig.groupName + '"';
    return (
      <div className='login2-container main-container'>
        <h2>Sign up for personalized dashboard features</h2>
        <p>To access the personalized dashboard features, membership in the {groupName} group is required. Click the <b>Sign Up </b>
          button to join the group. Using the <b>Sign Up</b> button will open a Globus group enrollment page in a separate tab or window.
          After completing enrollment on that page, come back and click the <b>Proceed</b> button to begin using the new features of this site.
        </p>
        <div className='btn-container'>
          <OverlayTrigger
            placement='bottom-start'
            overlay={<Tooltip>Click to sign up for {cc.termsAndConditionsConfig.groupName}.</Tooltip>}
          >
            <a className='chaise-btn chaise-btn-primary'
              href={cc.termsAndConditionsConfig.joinUrl}
              target='_blank'
              rel='noreferrer'>Sign Up
            </a>
          </OverlayTrigger>
          <OverlayTrigger
            placement='bottom-start'
            overlay={<Tooltip>Click to proceed to the application after joining the group.</Tooltip>}
          >
            <button className='chaise-btn chaise-btn-secondary'
              onClick={() => reLogin()}
            >Proceed
            </button>
          </OverlayTrigger>
        </div>
        {showSpinner && <ChaiseSpinner />}
      </div>
    )
  }

  return (
    <div className='app-container container-fluid row'>
      {renderInstructions()}
    </div>
  );
};

ReactDOM.render(
  <AppWrapper
    appSettings={loginSettings}
    includeAlerts={false}
    includeNavbar={false}
    displaySpinner={true}
  >
    <LoginPopupApp />
  </AppWrapper>,
  document.getElementById('chaise-app-root'),
);