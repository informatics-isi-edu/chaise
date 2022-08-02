// hooks
import { createContext, useEffect, useMemo, useState } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { DifferentUserConflictError } from '@isrd-isi-edu/chaise/src/models/errors';
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import { Session } from '@isrd-isi-edu/chaise/src/models/user';
import { LoginModalProps } from '@isrd-isi-edu/chaise/src/providers/error';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import StorageService from '@isrd-isi-edu/chaise/src/utils/storage';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { validateTermsAndConditionsConfig } from '@isrd-isi-edu/chaise/src/utils/config-utils';
import { chaiseDeploymentPath, fixedEncodeURIComponent, queryStringToJSON } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { BUILD_VARIABLES } from '@isrd-isi-edu/chaise/src/utils/constants';

// TODO function types

export const AuthnContext = createContext<{
  createPromptExpirationToken: () => void;
  getSession: (context: string) => Promise<Session | null>;
  isSameSessionAsPrevious: (serverSession: Session | null) => boolean;
  loginInAModal: (notifyErmrestCB: Function, notifyErmrestRejectCB: Function, logAction: string) => void;
  logout: (action: string) => void;
  logoutWithoutRedirect: (action: string) => void;
  popupLogin: (logAction: string | null, postLoginCB?: Function) => void;
  prevSession: Session | null;
  refreshLogin: (action: string) => Promise<string | Error>;
  session: Session | null;
  shouldReloadPageAfterLogin: (serverSession: Session | null) => boolean;
  showPreviousSessionAlert: () => boolean;
  validateSessionBeforeMutation: (cb: any) => void;
} |
  // NOTE: since it can be null, to make sure the context is used properly with
  //       a provider, the useRecordset hook will throw an error if it's null.
  null>(null);

type AuthnProviderProps = {
  children: React.ReactNode,
}

export default function AuthnProvider({ children }: AuthnProviderProps): JSX.Element {
  // authn API no longer communicates through ermrest, removing the need to check for ermrest location
  const serviceURL: string = windowRef.location.origin;
  const LOCAL_STORAGE_KEY = 'session'; // name of object session information is stored under
  const PROMPT_EXPIRATION_KEY = 'promptExpiration'; // name of key for prompt expiration value
  const PREVIOUS_SESSION_KEY = 'previousSession'; // name of key for previous session boolean

  const { dispatchError, hideLoginModal, showLoginModal, setLoginFunction } = useError();
  const [session, setSession] = useState<Session | null>(null); // current session object
  const [prevSession, setPrevSession] = useState<Session | null>(null); // previous session object
  const _changeCbs: any = {};
  let _counter = 0;

  useEffect(() => {
    setLoginFunction(() => {
      loginInAModal(function (response: any) {
        if (shouldReloadPageAfterLogin(session)) {
          window.location.reload();
        } else if (!isSameSessionAsPrevious(response)) {
          dispatchError({ error: new DifferentUserConflictError(session, prevSession) });
        }
      }, null, LogActions.LOGIN_LOGIN_MODAL)
    })
  }, [])

  const _executeListeners = () => {
    for (const k in _changeCbs) {
      _changeCbs[k]();
    }
  };

  /**
   * Functions that interact with the StorageService tokens
   * There are 3 keys stored under the LOCAL_STORAGE_KEY object, PROMPT_EXPIRATION_KEY, PREVIOUS_SESSION_KEY
   */

  // returns data stored in loacal storage for `keyName`
  const _getKeyFromStorage = (keyName: string) => {
    return StorageService.getStorage(LOCAL_STORAGE_KEY)[keyName];
  };

  // create value in storage with `keyName` and `value`
  const _setKeyInStorage = (keyName: string, value: string | boolean) => {
    const data = {} as any;

    data[keyName] = value;

    StorageService.updateStorage(LOCAL_STORAGE_KEY, data);
  };

  // verifies value exists for `keyName`
  const _keyExistsInStorage = (keyName: string) => {
    const sessionStorage = StorageService.getStorage(LOCAL_STORAGE_KEY);

    return (sessionStorage && sessionStorage[keyName]);
  };

  // removes the key/value pair at `keyName`
  const _removeKeyFromStorage = (keyName: string) => {
    if (_keyExistsInStorage(keyName)) {
      StorageService.deleteStorageValue(LOCAL_STORAGE_KEY, keyName);
    }
  };

  // creates an expiration token with `keyName`
  const _createToken = (keyName: string) => {
    const data = {} as any;
    const hourFromNow = new Date();
    hourFromNow.setHours(hourFromNow.getHours() + 1);

    data[keyName] = hourFromNow.getTime();

    StorageService.updateStorage(LOCAL_STORAGE_KEY, data);
  };

  // checks if the expiration token with `keyName` has expired
  const _expiredToken = (keyName: string) => {
    const sessionStorage = StorageService.getStorage(LOCAL_STORAGE_KEY);

    return (sessionStorage && new Date().getTime() > sessionStorage[keyName]);
  };

  // extends the expiration token with `keyName` if it hasn't expired
  const _extendToken = (keyName: string) => {
    if (_keyExistsInStorage(keyName) && !_expiredToken(keyName)) {
      _createToken(keyName);
    }
  };

  const createPromptExpirationToken = () => {
    _createToken(PROMPT_EXPIRATION_KEY);
  }

  // if there's a previous login token AND
  // the prompt expiration token does not exist OR it has expired
  const showPreviousSessionAlert = () => {
    return (_keyExistsInStorage(PREVIOUS_SESSION_KEY) && (!_keyExistsInStorage(PROMPT_EXPIRATION_KEY) || _expiredToken(PROMPT_EXPIRATION_KEY)));
  }

  const isSameSessionAsPrevious = (sessionParam: Session | null) => {
    return (prevSession?.client.id === sessionParam?.client.id);
  }

  // Checks for a session or previous session being set, if neither allow the page to reload
  // the page will reload after login when the page started with no user
  //  can become null if getSession is called and the session has timed out or the user logged out
  const shouldReloadPageAfterLogin = (sessionParam: Session | null) => {
    if (sessionParam === null && prevSession === null) return true;
    return false;
  };

  /**
   * opens a window dialog for logging in
   */
  const popupLogin = (logAction: string | null, postLoginCB?: Function) => {
    if (!postLoginCB) {
      postLoginCB = () => {
        // fetches the session of the user that just logged in
        getSession('').then((response: any) => {
          // TODO: make sure this works how we expect with state variables
          if (!shouldReloadPageAfterLogin(session)) {
            alert(`${response.client.full_name} logged in`);
          } else {
            windowRef.location.reload();
          }
        });
      };
    }

    // make sure the width and height are not bigger than the screen
    const popupWidth = Math.min(800, screen.availWidth);
    const popupHeight = Math.min(750, screen.availHeight)
    const topOffset = 50;

    // left should be in the middle of the screen
    const popupLeft = (screen.availWidth - popupWidth) / 2;
    // top should just have some small offset if there's available space
    const popupTop = (topOffset + popupHeight) < screen.availHeight ? topOffset : 0;

    // open a window with proper position and width and height
    const win = window.open('', '_blank', `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`);

    // focus on the opened window
    win?.focus();

    logInHelper(loginWindowCb, win, postLoginCB, 'popUp', null, logAction);
  };

  // NOTE: sessionParam attached so it can be passed back to callbacks for comparisons since functions execute synchronously
  //       and `session` state variable updates asynchronously sometime during or after these functions are executing
  const logInHelper = (
    logInTypeCb: Function,
    win: any,
    cb: Function,
    type: string,
    rejectCb: Function | null,
    logAction: string | null,
    sessionParam?: Session | null
  ) => {
    const referrerId = (new Date().getTime());

    const cc = ConfigService.chaiseConfig;

    const referrerUrl = `${window.location.origin}${BUILD_VARIABLES.CHAISE_BASE_PATH}login/?referrerid=${referrerId}`;
    const url = `${serviceURL}/authn/preauth?referrer=${fixedEncodeURIComponent(referrerUrl)}`;
    const config: any = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json',
      },
      skipHTTP401Handling: true,
    };

    // TODO in the case of loginInAModal, we're not doing the actual login,
    // but we're still sending the request. Since we need to change this anyways,
    // I decided to not add any log action in that case and instead we should just
    // fix that function.
    if (logAction) {
      config.headers[ConfigService.ERMrest.contextHeaderName] = {
        action: LogService.getActionString(logAction, '', '')
      }
    }
    ConfigService.http.get(url, config).then((response: any) => {
      const data = response.data;

      let login_url = '';
      if (data.redirect_url !== undefined) {
        login_url = data.redirect_url;
      } else if (data.login_form !== undefined) {
        // we want to use the old login flow to login
        // (login in the same window so when login does occur, it changes the same page instead of the page in the window that pops up)
        win = window;
        // prevents the dialog from popping up shortly before the page redirects to login
        type = '';
        const referrer = window.location.href;
        const login_form = data.login_form;
        login_url = `../login?referrer=${fixedEncodeURIComponent(referrer)}`;
        const method = login_form.method;
        const action = fixedEncodeURIComponent(login_form.action);
        let text = '';
        let hidden = '';
        for (let i = 0; i < login_form.input_fields.length; i++) {
          const field = login_form.input_fields[i];
          if (field.type === 'text') {
            text = fixedEncodeURIComponent(field.name);
          } else {
            hidden = fixedEncodeURIComponent(field.name);
          }
        }
        login_url += `&method=${method}&action=${action}&text=${text}&hidden=${hidden}&?referrerid=${referrerId}`;
      }

      const params = {
        login_url,
      };
      if (win) {
        win.location = params.login_url;
      }
      logInTypeCb(params, referrerId, cb, type, rejectCb, sessionParam);
    }, (error: any) => {
      throw ConfigService.ERMrest.responseToError(error);
    });
  };

  // post login callback function
  const loginWindowCb = (params: any, referrerId: string, cb: Function, type: string, rejectCb: Function | null, sessionParam?: Session | null) => {
    if (type.indexOf('modal') !== -1) {
      const title = sessionParam ? MESSAGE_MAP.sessionExpired.title : MESSAGE_MAP.noSession.title;
      const loginModalProps: LoginModalProps = { title: title };

      // var cleanupModal = function (message) {
      //   $interval.cancel(intervalId);
      //   $cookies.remove("chaise-" + referrerId, { path: "/" });
      // }

      loginModalProps.onModalCloseSuccess = () => {
        // cleanupModal("login refreshed");
        getSession('').then((response: any) => {
          hideLoginModal();
          cb(response);
        });
      };

      loginModalProps.onModalClose = (response: any) => {
        // cleanupModal("no login");
        hideLoginModal();
        if (rejectCb) {
          //  ermrestJS throws error if 'response' is not formatted as an Error
          if (typeof response === 'string') {
            response = new Error(response);
          }
          rejectCb(response);
        }
      };

      showLoginModal(loginModalProps);
    }

    /* if browser is IE then add explicit handler to watch for changes in localstorage for a particular
     * variable
     */
    if (false) {
      // if (UriUtils.isBrowserIE()) {
      // $cookies.put("chaise-" + referrerId, true, { path: "/" });
      // var intervalId;
      // var watchChangeInReferrerId = function () {
      //   if (!$cookies.get("chaise-" + referrerId)) {
      //     $interval.cancel(intervalId);
      //     if (typeof cb == 'function') {
      //       if (type.indexOf('modal') !== -1) {
      //         intervalId = $interval(watchChangeInReferrerId, 50);
      //         modalInstance.close("Done");
      //         cb();
      //         closed = true;
      //       } else {
      //         cb();
      //       }
      //     }
      //     return;
      //   }
      // }
    } else {
      window.addEventListener('message', (args) => {
        if (args && args.data && (typeof args.data === 'string')) {
          console.log('do local storage things');
          _setKeyInStorage(PREVIOUS_SESSION_KEY, true);
          _removeKeyFromStorage(PROMPT_EXPIRATION_KEY);
          const obj = queryStringToJSON(args.data);
          if (obj.referrerid == referrerId && (typeof cb === 'function')) {
            if (type.indexOf('modal') !== -1) {
              // modalInstance.close("Done");
              cb();
              closed = true;
            } else {
              cb();
            }
          }
        }
      });
    }
  };

  /**
   * Will return a promise that is resolved with the session.
   * It will also call the _executeListeners() functions and sets the session.
   * If we couldn't fetch the session, it will resolve with `null`.
   *
   * @param  {string=} context undefined or "401"
   */
  const getSession = (context: string) => {
    const config = {
      skipHTTP401Handling: true,
      headers: {} as any,
    };

    // config.headers[ERMrest.contextHeaderName] = {
    //   action: logService.getActionString(logService.logActions.SESSION_RETRIEVE, "", "")
    // }

    /**
     * NOTE: the following is for future implementation when we decide to verify session against the cookie object
     * see if there's a token before doing any decision making
     *
     * if there's no webauthnCookie || no cookieFromStorage, login flow
     *
     * if there's a webauthnCookie user was logged in at some point on this machine, check to see if it matches _cookie
     *  - if NOT match page was used by someone that's not the current webauthn cookie holder, check webauthnCookie matches cookieFromStorage
     *    - if match, check cookieFromStorage.expires is not expired
     *      - if expired, login flow
     *      - if not expired, use local storage session
     *    - if NOT match, shouldn't happen unless cookie in browser is updated without chaise
     *  - if match user had a session on this page, make sure session.expires is not expired
     *    - if not expired, TODO leasing idea
     *    - if expired, login timeout warning
     *
     * no webauthn
     * if there's a cookieFromStorage user was here before, see if it is expired
     *  - if expired
     * */

    return ConfigService.http.get(`${serviceURL}/authn/session`, config).then((response: any) => {
      if (context === '401' && shouldReloadPageAfterLogin(response)) {
        // window.location.reload();
        return response.data;
      }

      // keep track of only the first session, so when a timeout occurs, we can compare the sessions
      // when a new session is fetched after timeout, check if the identities are the same
      if (!prevSession) {
        setPrevSession(response.data);
      }

      if (!session) {
        // only update session if no session is set
        _setSession(response.data);
      }

      _executeListeners();
      return response.data;
    }).catch((err: any) => {
      // $log.warn(ERMrest.responseToError(err));

      _setSession(null);
      _executeListeners();
      return null;
    });
  };

  const logout = (action: string) => {
    const cc = ConfigService.chaiseConfig;
    const logoutURL = cc['logoutURL'] ? cc['logoutURL'] : '/';

    let url = serviceURL + '/authn/session';
    url += '?logout_url=' + fixedEncodeURIComponent(logoutURL);

    let config: any = {
      skipHTTP401Handling: true,
      headers: {}
    };

    config.headers[ConfigService.ERMrest.contextHeaderName] = {
      action: LogService.getActionString(action, '', '')
    }

    ConfigService.http.delete(url, config).then((response: any) => {
      StorageService.deleteStorageNamespace(LOCAL_STORAGE_KEY);
      windowRef.location = response.data.logout_url;
    }, (error: any) => {
      // if the logout fails for some reason, send the user to the logout url as defined above
      windowRef.location = logoutURL;
    });
  }

  const logoutWithoutRedirect = (action: string) => {
    const logoutConfig: any = {
      skipHTTP401Handling: true,
      headers: {}
    };

    logoutConfig.headers[windowRef.ERMrest.contextHeaderName] = {
      action: LogService.getActionString(action, '', '')
    };

    // logout without redirecting the user
    ConfigService.http.delete(serviceURL + '/authn/session/', logoutConfig).then((response: any) => {
      StorageService.deleteStorageNamespace(LOCAL_STORAGE_KEY);

    }).catch((error: any) => {
      // this is a 404 error when session doesn't exist and the user tries to logout
      // don't throw the error since this means the user is already logged out
      console.log(error);
    });
  }

  const refreshLogin = (action: string) => {
    // get referrerid from browser url
    const referrerId = queryStringToJSON(window.location.search).referrerid,
      preauthReferrer = window.location.origin + chaiseDeploymentPath() + 'login/?referrerid=' + referrerId,
      redirectUrl = serviceURL + '/authn/preauth/?referrer=' + fixedEncodeURIComponent(preauthReferrer);

    const loginConfig: any = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json'
      },
      skipHTTP401Handling: true
    };

    loginConfig.headers[windowRef.ERMrest.contextHeaderName] = {
      action: LogService.getActionString(action, '', '')
    }

    return ConfigService.http.get(redirectUrl, loginConfig).then((response: any) => {
      const data = response.data;

      // redirect_url is supposed to be the same as preauthReferrer
      if (data.redirect_url === undefined) {
        data.redirect_url = preauthReferrer;
      }

      return data.redirect_url;
    }).catch((error: any) => {

      return error;
    });

  }

  const _setSession = (inp: any) => {
    if (!inp) {
      setSession(null);
      return;
    }

    // decorate the session
    const attributes: any[] = [];
    inp.attributes.forEach((attr: any) => {
      // NOTE: the current assumption is that everything in session.attributes is a globus group or an identity
      // a globus group if:
      //   - display_name is defined
      //   - display_name is not the same as the user's display_name
      //   - current id is not in the identities array
      if (attr.display_name && attr.display_name !== inp.client.display_name && inp.client.identities.indexOf(attr.id) === -1) {
        if (attr.id.indexOf('https://auth.globus.org/') === 0) {
          // assume id is always "https://auth.globus.org/ff766864-a03f-11e5-b097-22000aef184d"
          attr.webpage = 'https://app.globus.org/groups/' + attr.id.substring(24) + '/about';
          attr.type = 'globus_group';
        }

      }

      if (inp.client.identities.includes(attr.id)) attr.type = 'identity';
      // attributes without a type (!globus_group and !identity) are not expected and won't be given a type

      let matchIdx = null;
      // determine if 'attr' exists in $session.attributes
      matchIdx = attributes.findIndex((targetAttr) => {
        return targetAttr.id === attr.id;
      });

      // merge if the attribute already exists, push otherwise
      if (matchIdx !== -1) {
        Object.assign(attributes[matchIdx], attr);
      } else {
        attributes.push(attr);
      }
    });

    // sort the newly created atrtibutes array by display_name
    attributes.sort((a, b) => {
      if (a.display_name && b.display_name) return a.display_name.localeCompare(b.display_name);
    });

    inp.attributes = attributes;

    // TODO we have to ensure that the given input follows the same type..
    // so the app doesn't blow up
    // (if authn backend service changes its response, chaise should still work)
    setSession(inp)
  }

  // Makes a request to fetch the most recent session from the server
  // verifies if that is the same as when the page loaded before calling `cb`
  const validateSessionBeforeMutation = (cb: any) => {
    const handleDiffUser = (serverSession: any) => {
      // modalInstance comes from error modal controller to close the modal after logging in, but before checking to throw an error again
      const checkSession = () => {
        // check if login state resolved
        getSession('').then((response: any) => {
          if (!response || !isSameSessionAsPrevious(response)) {
            handleDiffUser(response)
          } else {
            cb();
          }
        });
      }

      let errorCB = checkSession;

      if (!serverSession) {
        // for continuing in the modal if there is a user
        errorCB = () => {
          popupLogin(LogActions.SWITCH_USER_ACCOUNTS_LOGIN, () => {
            checkSession();
          });
        }
      }

      dispatchError({ error: new DifferentUserConflictError(serverSession, prevSession, errorCB) });
    }

    // Checks if an error needs to be thrown because the user is different and continues execution if the login state is resolved
    // a session must exist before calling this function
    const validateSessionSubmit = (serverSession: any) => {
      if (!isSameSessionAsPrevious(serverSession)) {
        handleDiffUser(serverSession);
      } else {
        // we have a session now and it's the same as when the app started
        cb();
      }
    }

    getSession('').then((response: any) => {
      if (!response) {
        const onSuccess = (serverSession: any) => {
          validateSessionSubmit(serverSession);
        }

        const onError = (err: any) => {
          // NOTE: user didn't login, what's the error ?
          // same error message as duplicate user except "anon"
          handleDiffUser(response);
        }

        // should be modal login
        logInHelper(loginWindowCb, '', onSuccess, 'modal', onError, LogActions.SWITCH_USER_ACCOUNTS_LOGIN, response);
      } else {
        validateSessionSubmit(response);
      }
    });
  };

  /**
   * TODO technically this function should even ask for preauthn in logInHelper
   * This function opens a modal dialog which has a link for login
   * the callback for this function has a race condition because the login link in the modal uses `loginInAPopUp`
   * that function uses the embedded `reloadCb` as the callback for the actual login window closing.
   * these 2 callbacks trigger in the order of `popupCb` first then `modalCb` where modalCb is ignored more often than not
   * @param {Function} notifyErmrestCB - runs after the login process has been complete
   */
  const loginInAModal = (notifyErmrestCB: Function, notifyErmrestRejectCB: Function | null, logAction: string) => {
    logInHelper(loginWindowCb, '', notifyErmrestCB, 'modal', notifyErmrestRejectCB, logAction);
  }

  const providerValue = useMemo(() => {
    return {
      createPromptExpirationToken,
      getSession,
      isSameSessionAsPrevious,
      loginInAModal,
      logout,
      logoutWithoutRedirect,
      popupLogin,
      prevSession,
      refreshLogin,
      session,
      shouldReloadPageAfterLogin,
      showPreviousSessionAlert,
      validateSessionBeforeMutation
    }
  }, [session]);

  return (
    <AuthnContext.Provider value={providerValue}>
      {children}
    </AuthnContext.Provider>
  )
} // end provider

// return {

//   /**
//    * Will return a promise that is resolved with the session.
//    * Meant for validating the server session and verify if it's still active or not
//    */
//   validateSession: function () {
//     var config = {
//       skipHTTP401Handling: true,
//       headers: {}
//     };
//     config.headers[ERMrest.contextHeaderName] = {
//       action: logService.getActionString(logService.logActions.SESSION_VALIDATE, "", "")
//     }
//     return ConfigUtils.getHTTPService().get(serviceURL + "/authn/session", config).then(function (response) {
//       if (!_session) {
//         // only update session if no session is set
//         _session = response.data;
//       }
//       return _session;
//     }).catch(function (err) {
//       $log.warn(ERMrest.responseToError(err));

//       _session = null;
//       return _session;
//     });
//   },

//   subscribeOnChange: function (fn) {
//     // To avoid same ids for an instance we add counter
//     var id = new Date().getTime() + (++_counter);

//     if (typeof fn == 'function') {
//       _changeCbs[id] = fn;
//     }
//     return id;
//   },

//   unsubscribeOnChange: function (id) {
//     delete _changeCbs[id];
//   },

//   extendPromptExpirationToken: function () {
//     _extendToken(PROMPT_EXPIRATION_KEY);
//   },
// }
//     }])

// var pathname = window.location.pathname;

// // If app is not search, viewer and login then attach the unauthorised 401 http handler to ermrestjs

// if (pathname.indexOf('/login') == -1) {

//   angular.module('chaise.authn')

//     .run(['ConfigUtils', 'ERMrest', 'Errors', 'ErrorService', '$injector', '$q', function runRecordEditApp(ConfigUtils, ERMrest, Errors, ErrorService, $injector, $q) {

//       var Session = $injector.get("Session");

//       // Bind callback function by invoking setHTTP401Handler handler passing the callback
//       // This callback will be called whenever 401 HTTP error is encountered unless there is
//       // already login flow in progress
//       ERMrest.setHTTP401Handler(function () {
//         var defer = $q.defer();

//         // Call login in a new modal window to perform authntication
//         // and return a promise to notify ermrestjs that the user has loggedin
//         Session.loginInAModal(function () {

//           // Once the user has logged in fetch the new session and set the session value
//           // and resolve the promise to notify ermrestjs that the user has logged in
//           // and it can continue firing other queued calls
//           Session.getSession("401").then(function (_session) {
//             var prevSession = Session.getPrevSessionValue();
//             // Not sure if this will trigger on page load, if not I think it's safe to run this in all contexts
//             // recordset  - read should throw a 409 if there's a permission issue
//             // record     - same issue with read above
//             //            - p&b add throws a conflict error in most cases, so won't get sent here either (RBK)
//             // recordedit - add/update return here in some cases, and in other cases will return a 409 and ignore this case
//             var differentUser = prevSession && !Session.isSameSessionAsPrevious();

//             // send boolean to communicate in ermrestJS if execution should continue after 401 error thrown and subsequent login
//             defer.resolve(differentUser);

//             // throw Error if login is successful but it's a different user
//             if (differentUser) ErrorService.handleException(new Errors.DifferentUserConflictError(_session, prevSession), false);
//           }, function (exception) {
//             defer.reject(exception);
//           });

//         }, function (response) {
//           // returns to rejectCB in ermrestJS/http.js
//           defer.reject(response);
//         });

//         return defer.promise;
//       });

//     }]);

// }
