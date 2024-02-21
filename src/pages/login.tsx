import '@isrd-isi-edu/chaise/src/assets/scss/_login-app.scss';

import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';

// hooks
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService, ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { validateTermsAndConditionsConfig } from '@isrd-isi-edu/chaise/src/utils/config-utils';
import { queryStringToJSON } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { APP_NAMES, ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';


const loginSettings : ConfigServiceSettings = {
  appName: APP_NAMES.LOGIN,
  appTitle: 'Login',
  overrideHeadTitle: true,
  overrideImagePreviewBehavior: false,
  overrideDownloadClickBehavior: false,
  overrideExternalLinkBehavior: false
};

export type loginForm = {
  username: string,
  password: string
}

const LoginPopupApp = (): JSX.Element => {
  const cc = ConfigService.chaiseConfig;

  const { logoutWithoutRedirect, refreshLogin, session } = useAuthn();

  const [showInstructions, setShowInstructions] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);

  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;

    const validConfig = validateTermsAndConditionsConfig(cc.termsAndConditionsConfig);
    let hasGroup = false;

    // only check if the user has the group if the config is valid
    if (validConfig && session) {
      // if the user does have the defined group, continue with auto close and reload of the application
      hasGroup = session.attributes.filter(function (attr) {
        return attr.id === cc.termsAndConditionsConfig.groupId;
      }).length > 0;
    }

    // if the config is invalid, don't require group membership to continue automatically
    if (!validConfig || hasGroup) {
      const qString = queryStringToJSON(windowRef.location.search);
      if (qString.referrerid && (typeof qString.action === 'undefined') && windowRef.opener) {
        //For child window
        windowRef.opener.postMessage(windowRef.location.search, windowRef.opener.location.href);

        // Create the user in 'user_profile" table with `onconflict=skip` if user exists already
        // POST /ermrest/catalog/registry/entity/CFDE:user_profile?onconflict=skip
        // Content-Type: application/json
        //
        // [
        //     {"id": "...", "display_name": "...", "full_name": "..."}
        // ]
        const userProfilePath = '/ermrest/catalog/registry/entity/CFDE:user_profile?onconflict=skip';

        // if hasGroup is true, then session has to be defined
        if (validConfig && session) {
          const rows = [{
            'id': session.client.id,
            'display_name': session.client.display_name,
            'full_name': session.client.full_name
          }]

          // we only want to force adding to this group if the termsAndConditionsConfig is defined
          // TODO: this should be it's own configuration property
          //    - should it be part of termsAndConditionsConfig
          //    - or it's own property since this could be for a separate feature request
          //       - (having user profiles but not require a specific globus group for login)
          ConfigService.http.post(windowRef.location.origin + userProfilePath, rows).then((response: any) => {
            windowRef.close();
          }).catch((error: any) => {
            // NOTE: this should almost never happen
            //     will happen in any deployment that turns this feature on before we rework the
            //      property definition to include the "userProfile Path" as a configuration property
            // if a user reports this hanging around, we need to identify what error caused it
            // should be easy since the error will be logged with context pointing to login I believe
            console.log(error);
            console.log('error creating user');
          });
        } else {
          windowRef.close();
        }
      }
    } else {
      // show the instructions if the user doesn't have the required group
      setShowInstructions(!hasGroup);
      // if this login process is used for verifying group membership, that group is REQUIRED to have an active login
      // log the user out if they don't have the group
      logoutWithoutRedirect(LogActions.VERIFY_GLOBUS_GROUP_LOGOUT);
    }
  }, []);

  const reLogin = () => {
    setShowSpinner(true);
    refreshLogin(LogActions.VERIFY_GLOBUS_GROUP_LOGIN).then((redirectUrl: any) => {
      setShowSpinner(false);

      windowRef.location = redirectUrl;
    });
  }

  const renderInstructions = () => {
    if (!showInstructions) return;

    const groupName = '"' + cc.termsAndConditionsConfig.groupName + '"';
    return (
      <div className='login-container main-container'>
        <h2>Sign up for personalized dashboard features</h2>
        <p>To access the personalized dashboard features, membership in the {groupName} group is required. Click the <b>Sign Up </b>
          button to join the group. Using the <b>Sign Up</b> button will open a Globus group enrollment page in a separate tab or window.
          After completing enrollment on that page, come back and click the <b>Proceed</b> button to begin using the new features of this site.
        </p>
        <div className='btn-container'>
          <ChaiseTooltip
            placement='bottom-start'
            tooltip={<>Click to sign up for {cc.termsAndConditionsConfig.groupName}.</>}
          >
            <a className='chaise-btn chaise-btn-primary'
              href={cc.termsAndConditionsConfig.joinUrl}
              target='_blank'
              rel='noreferrer'>Sign Up
            </a>
          </ChaiseTooltip>
          <ChaiseTooltip
            placement='bottom-start'
            tooltip='Click to proceed to the application after joining the group.'
          >
            <button className='chaise-btn chaise-btn-secondary'
              onClick={() => reLogin()}
            >Proceed
            </button>
          </ChaiseTooltip>
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

const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(
  <AppWrapper appSettings={loginSettings} displaySpinner>
    <LoginPopupApp />
  </AppWrapper>
);
