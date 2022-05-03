import axios from 'axios';

import StorageService from '@chaise/utils/storage';
import { ConfigService } from '@chaise/services/config';
import { LogActions, LogReloadCauses } from '@chaise/models/log';
import { LogService } from '@chaise/services/log';

import { MESSAGE_MAP } from '@chaise/utils/message-map';
import { validateTermsAndConditionsConfig } from '@chaise/utils/config-utils';
import { chaiseDeploymentPath, fixedEncodeURIComponent, queryStringToJSON } from '@chaise/utils/uri-utils';
import { windowRef } from '@chaise/utils/window-ref';
import { BUILD_VARIABLES } from '@chaise/utils/constants';
import { Session } from '@chaise/models/user';

export default class AuthnService {
  // authn API no longer communicates through ermrest, removing the need to check for ermrest location
  static serviceURL: string = windowRef.location.origin;

  static LOCAL_STORAGE_KEY = 'session'; // name of object session information is stored under

  static PROMPT_EXPIRATION_KEY = 'promptExpiration'; // name of key for prompt expiration value

  static PREVIOUS_SESSION_KEY = 'previousSession'; // name of key for previous session boolean

  // TODO: how to make these as private variables and private functions
  private static _session: Session | null = null; // current session object

  private static _prevSession: any | null = null; // previous session object

  private static _sameSessionAsPrevious = false;

  private static _changeCbs: any = {};

  private static _counter = 0;

  private static _executeListeners = function () {
    for (const k in AuthnService._changeCbs) {
      AuthnService._changeCbs[k]();
    }
  };

  /**
   * Functions that interact with the StorageService tokens
   * There are 3 keys stored under the LOCAL_STORAGE_KEY object, PROMPT_EXPIRATION_KEY, PREVIOUS_SESSION_KEY
   */

  // returns data stored in loacal storage for `keyName`
  private static _getKeyFromStorage = function (keyName: string) {
    return StorageService.getStorage(AuthnService.LOCAL_STORAGE_KEY)[keyName];
  };

  // create value in storage with `keyName` and `value`
  private static _setKeyInStorage = function (keyName: string, value: string | boolean) {
    const data = {} as any;

    data[keyName] = value;

    StorageService.updateStorage(AuthnService.LOCAL_STORAGE_KEY, data);
  };

  // verifies value exists for `keyName`
  private static _keyExistsInStorage = function (keyName: string) {
    const sessionStorage = StorageService.getStorage(AuthnService.LOCAL_STORAGE_KEY);

    return (sessionStorage && sessionStorage[keyName]);
  };

  // removes the key/value pair at `keyName`
  private static _removeKeyFromStorage = function (keyName: string) {
    if (AuthnService._keyExistsInStorage(keyName)) {
      StorageService.deleteStorageValue(AuthnService.LOCAL_STORAGE_KEY, keyName);
    }
  };

  // creates an expiration token with `keyName`
  private static _createToken = function (keyName: string) {
    const data = {} as any;
    const hourFromNow = new Date();
    hourFromNow.setHours(hourFromNow.getHours() + 1);

    data[keyName] = hourFromNow.getTime();

    StorageService.updateStorage(AuthnService.LOCAL_STORAGE_KEY, data);
  };

  // checks if the expiration token with `keyName` has expired
  private static _expiredToken = function (keyName: string) {
    const sessionStorage = StorageService.getStorage(AuthnService.LOCAL_STORAGE_KEY);

    return (sessionStorage && new Date().getTime() > sessionStorage[keyName]);
  };

  // extends the expiration token with `keyName` if it hasn't expired
  private static _extendToken = function (keyName: string) {
    if (AuthnService._keyExistsInStorage(keyName) && !AuthnService._expiredToken(keyName)) {
      AuthnService._createToken(keyName);
    }
  };

  static get session() {
    return AuthnService._session;
  }

  // Checks for a session or previous session being set, if neither allow the page to reload
  // the page will reload after login when the page started with no user
  // _session can become null if getSession is called and the session has timed out or the user logged out
  static shouldReloadPageAfterLogin = function () {
    if (AuthnService._session === null && AuthnService._prevSession === null) return true;
    return false;
  };

  /**
   * opens a window dialog for logging in
   */
  static popupLogin = function (logAction: string | null, postLoginCB?: Function) {
    if (!postLoginCB) {
      postLoginCB = function () {
        if (!AuthnService.shouldReloadPageAfterLogin()) {
          // fetches the session of the user that just logged in
          AuthnService.getSession('').then((response: any) => {
            // if (modalInstance) modalInstance.close();
            alert(`${response.client.full_name} logged in`);
          });
        } else {
          windowRef.location.reload();
        }
      };
    }

    const x = window.innerWidth / 2 - 800 / 2;
    const y = window.innerHeight / 2 - 600 / 2;

    const win = window.open('', '_blank', `width=800,height=600,left=${x},top=${y}`);

    AuthnService.logInHelper(AuthnService.loginWindowCb, win, postLoginCB, 'popUp', null, logAction);
  };

  static logInHelper = function (logInTypeCb: Function, win: any, cb: Function, type: string, rejectCb: Function | null, logAction: string | null) {
    const referrerId = (new Date().getTime());

    const cc = ConfigService.chaiseConfig;
    const loginApp = validateTermsAndConditionsConfig(cc.termsAndConditionsConfig) ? 'login2' : 'login';

    const referrerUrl = `${window.location.origin}/${BUILD_VARIABLES.CHAISE_BASE_PATH}/${loginApp}/?referrerid=${referrerId}`;
    const url = `${AuthnService.serviceURL}/authn/preauth?referrer=${fixedEncodeURIComponent(referrerUrl)}`;
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
      logInTypeCb(params, referrerId, cb, type, rejectCb);
    }, (error: any) => {
      throw ConfigService.ERMrest.responseToError(error);
    });
  };

  // post login callback function
  static loginWindowCb = function (params: any, referrerId: string, cb: Function, type: string, rejectCb: Function | null) {
    if (type.indexOf('modal') !== -1) {
      if (AuthnService._session) {
        params.title = MESSAGE_MAP.sessionExpired.title;
      } else {
        params.title = MESSAGE_MAP.noSession.title;
      }
      let closed = false;

      // var cleanupModal = function (message) {
      //   $interval.cancel(intervalId);
      //   $cookies.remove("chaise-" + referrerId, { path: "/" });
      //   closed = true;
      // }
      const onModalCloseSuccess = function () {
        // cleanupModal("login refreshed");
        closed = true;
        cb();
      };

      const onModalClose = function (response: any) {
        // cleanupModal("no login");
        closed = true;
        if (rejectCb) {
          //  ermrestJS throws error if 'response' is not formatted as an Error
          if (typeof response === 'string') {
            response = new Error(response);
          }
          rejectCb(response);
        }
      };

      // TODO: implement modalUtils
      // modalInstance = modalUtils.showModal({
      //   windowClass: "modal-login-instruction",
      //   templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/loginDialog.modal.html",
      //   controller: 'LoginDialogController',
      //   controllerAs: 'ctrl',
      //   resolve: {
      //     params: params
      //   },
      //   openedClass: 'modal-login',
      //   backdrop: 'static',
      //   keyboard: false
      // }, onModalCloseSuccess, onModalClose, false);
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
          AuthnService._setKeyInStorage(AuthnService.PREVIOUS_SESSION_KEY, true);
          AuthnService._removeKeyFromStorage(AuthnService.PROMPT_EXPIRATION_KEY);
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
   * It will also call the _executeListeners() functions and sets the _session.
   * If we couldn't fetch the session, it will resolve with `null`.
   *
   * @param  {string=} context undefined or "401"
   */
  static getSession = function (context: string) {
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
     *  - if match user had a session on this page, make sure _session.expires is not expired
     *    - if not expired, TODO leasing idea
     *    - if expired, login timeout warning
     *
     * no webauthn
     * if there's a cookieFromStorage user was here before, see if it is expired
     *  - if expired
     * */

    return ConfigService.http.get(`${AuthnService.serviceURL}/authn/session`, config).then((response: any) => {
      if (context === '401' && AuthnService.shouldReloadPageAfterLogin()) {
        // window.location.reload();
        return response.data;
      }

      // keep track of only the first session, so when a timeout occurs, we can compare the sessions
      // when a new session is fetched after timeout, check if the identities are the same
      if (AuthnService._prevSession) {
        AuthnService._sameSessionAsPrevious = AuthnService._prevSession.client.id == response.data.client.id;
      } else {
        AuthnService._prevSession = response.data;
      }

      if (!AuthnService._session) {
        // only update _session if no session is set
        AuthnService._setSession(response.data);
      }

      AuthnService._executeListeners();
      return AuthnService._session;
    }).catch((err: any) => {
      // $log.warn(ERMrest.responseToError(err));

      AuthnService._setSession(null);
      AuthnService._executeListeners();
      return AuthnService._session;
    });
  };

  static logout = (action: string) => {
    const cc = ConfigService.chaiseConfig;
    const logoutURL = cc['logoutURL'] ? cc['logoutURL'] : '/';

    let url = AuthnService.serviceURL + '/authn/session';
    url += '?logout_url=' + fixedEncodeURIComponent(logoutURL);

    let config: any = {
      skipHTTP401Handling: true,
      headers: {}
    };

    config.headers[ConfigService.ERMrest.contextHeaderName] = {
      action: LogService.getActionString(action, '', '')
    }

    ConfigService.http.delete(url, config).then(function (response: any) {
      StorageService.deleteStorageNamespace(AuthnService.LOCAL_STORAGE_KEY);
      windowRef.location = response.data.logout_url;
    }, function (error: any) {
      // if the logout fails for some reason, send the user to the logout url as defined above
      windowRef.location = logoutURL;
    });
  }

  static logoutWithoutRedirect = (action: string) => {
    const logoutConfig: any = {
      skipHTTP401Handling: true,
      headers: {}
    };

    logoutConfig.headers[windowRef.ERMrest.contextHeaderName] = {
      action: LogService.getActionString(action, '', '')
    };

    // logout without redirecting the user
    ConfigService.http.delete(AuthnService.serviceURL + '/authn/session/', logoutConfig).then((response: any) => {
      StorageService.deleteStorageNamespace(AuthnService.LOCAL_STORAGE_KEY);

    }).catch((error: any) => {
      // this is a 404 error when session doesn't exist and the user tries to logout
      // don't throw the error since this means the user is already logged out
      console.log(error);
    });
  }

  //   // groupArray should be the array of globus group
  static isGroupIncluded = (groupArray: string[]) => {
    // if no array, assume it wasn't defined and default hasn't been set yet
    if (!groupArray || groupArray.indexOf('*') > -1) return true; // if "*" acl, show the option
    if (!AuthnService._session) return false; // no "*" exists and no session, hide the option

    for (let i = 0; i < groupArray.length; i++) {
      let attribute = groupArray[i];

      const match = AuthnService._session.attributes.some((attr: any) => attr.id === attribute);

      if (match) return true;
    }

    return false;
  };

  static refreshLogin = (action: string) => {
    // get referrerid from browser url
    const referrerId = queryStringToJSON(window.location.search).referrerid,
      preauthReferrer = window.location.origin + chaiseDeploymentPath() + 'login2/?referrerid=' + referrerId,
      redirectUrl = AuthnService.serviceURL + '/authn/preauth/?referrer=' + fixedEncodeURIComponent(preauthReferrer);

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

  private static _setSession(inp: any) {
    if (!inp) {
      AuthnService._session = null;
      return;
    }

    // decorate the session
    const attributes: any[] = [];
    inp.attributes.forEach(function (attr: any) {
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
      matchIdx = attributes.findIndex(function (targetAttr) {
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
    attributes.sort(function (a, b) {
      if (a.display_name && b.display_name) return a.display_name.localeCompare(b.display_name);
    });

    inp.attributes = attributes;

    // TODO we have to ensure that the given input follows the same type..
    // so the app doesn't blow up
    // (if authn backend service changes its response, chaise should still work)
    AuthnService._session = inp;
  }
} // end class

// // variable so the modal can be passed to another function outside of this scope to close it when appropriate
// var modalInstance = null;

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
//         // only update _session if no session is set
//         _session = response.data;
//       }
//       return _session;
//     }).catch(function (err) {
//       $log.warn(ERMrest.responseToError(err));

//       _session = null;
//       return _session;
//     });
//   },

//   // Makes a request to fetch the most recent session from the server
//   // verifies if that is the same as when the page loaded before calling `cb`
//   validateSessionBeforeMutation: function (cb) {
//     var handleDiffUser = function () {
//       // modalInstance comes from error modal controller to close the modal after logging in, but before checking to throw an error again
//       var checkSession = function (modalInstance) {
//         modalInstance.dismiss("continue");
//         // check if login state resolved
//         _getSession().then(function (session) {
//           if (!session || !_sameSessionAsPrevious) {
//             handleDiffUser()
//           } else {
//             cb();
//           }
//         });
//       }

//       var errorCB = checkSession;

//       if (!_session) {
//         // for continuing in the modal if there is a user
//         errorCB = function (modalInstance) {
//           popupLogin(logService.logActions.SWITCH_USER_ACCOUNTS_LOGIN, function () {
//             checkSession(modalInstance);
//           });
//         }
//       }

//       throw new Errors.DifferentUserConflictError(_session, _prevSession, errorCB); // cannot dismiss
//     }

//     // Checks if an error needs to be thrown because the user is different and continues execution if the login state is resolved
//     // a session must exist before calling this function
//     var validateSessionSubmit = function () {
//       if (!_sameSessionAsPrevious) {
//         handleDiffUser();
//       } else {
//         // we have a session now and it's the same as when the app started
//         cb();
//       }
//     }

//     _getSession().then(function (session) {
//       if (!session) {
//         var onSuccess = function () {
//           validateSessionSubmit();
//         }

//         var onError = function (err) {
//           // NOTE: user didn't login, what's the error ?
//           // same error message as duplicate user except "anon"
//           handleDiffUser();
//         }

//         // should be modal login
//         logInHelper(loginWindowCb, "", onSuccess, 'modal', onError, logService.logActions.SWITCH_USER_ACCOUNTS_LOGIN);
//       } else {
//         validateSessionSubmit();
//       }
//     });
//   },

//   getSessionValue: function () {
//     return _session;
//   },

//   getPrevSessionValue: function () {
//     return _prevSession;
//   },

//   isSameSessionAsPrevious: function () {
//     return _sameSessionAsPrevious;
//   },

//   shouldReloadPageAfterLogin: shouldReloadPageAfterLogin,

//   // if there's a previous login token AND
//   // the prompt expiration token does not exist OR it has expired
//   showPreviousSessionAlert: function () {
//     return (_keyExistsInStorage(PREVIOUS_SESSION_KEY) && (!_keyExistsInStorage(PROMPT_EXPIRATION_KEY) || _expiredToken(PROMPT_EXPIRATION_KEY)));
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

//   createPromptExpirationToken: function () {
//     _createToken(PROMPT_EXPIRATION_KEY);
//   },

//   extendPromptExpirationToken: function () {
//     _extendToken(PROMPT_EXPIRATION_KEY);
//   },

//   /**
//    * TODO technically this function should even ask for preauthn in logInHelper
//    * This function opens a modal dialog which has a link for login
//    * the callback for this function has a race condition because the login link in the modal uses `loginInAPopUp`
//    * that function uses the embedded `reloadCb` as the callback for the actual login window closing.
//    * these 2 callbacks trigger in the order of `popupCb` first then `modalCb` where modalCb is ignored more often than not
//    * @param {Function} notifyErmrestCB - runs after the login process has been complete
//    */
//   loginInAModal: function (notifyErmrestCB, notifyErmrestRejectCB, logAction) {
//     logInHelper(loginWindowCb, "", notifyErmrestCB, 'modal', notifyErmrestRejectCB, logAction);
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
