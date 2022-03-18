import Q from 'q';
import { ConfigService } from '@chaise/services/config';
import { windowRef } from '@chaise/utils/window-ref';
import MathUtils from '@chaise/utils/math-utils';
import { BODY_CLASS_NAMES } from '@chaise/utils/constants';
import { getURLHashFragment, isSameOrigin, stripSortAndQueryParams } from '@chaise/utils/uri-utils';

// TODO could be part of another utils

/**
* Will return a promise that is resolved when the setup is done
*
* NOTE: should only be called by config.js (or equivalent configuration app)
*/
export async function setupHead() {
  addBodyClasses(); // doesn't need to be controlled since it relies on .chaise-body class being present
  addCanonicalTag(); // controlled by chaise-config value to turn on/off
  setWindowName(); // will only update if not already set

  const settings = ConfigService.appSettings;
  // TODO
  // if (settings.openLinksInTab) openLinksInTab();
  // if (settings.overrideDownloadClickBehavior) overrideDownloadClickBehavior();
  // if (settings.overrideExternalLinkBehavior) overrideExternalLinkBehavior();
  if (settings.overrideHeadTitle) addTitle(settings.appTitle);

  return addCustomCSS(); // controlled by chaise-config value to attach
}

// <title> should already be created in <head> and set to default chaiseConfig.headTitle from config app before app loads
export function updateHeadTitle(contextTitle?: string) {
  const chaiseConfig = ConfigService.chaiseConfig;

  const titleTag = document.head.getElementsByTagName('title')[0];
  titleTag.innerHTML = (contextTitle ? `${contextTitle} | ` : '') + chaiseConfig.headTitle;
}

/**
 * set the wid of window if it doesn't exist
 */
export function setWindowName() {
  if (!windowRef.name) {
    windowRef.name = MathUtils.uuid();
  }
}

/**
 * adds a link tag to head with the custom css. It will be resolved when
 * the file is loaded (or if the customCSS property is not defined)
 */
async function addCustomCSS() {
  const defer = Q.defer();
  const chaiseConfig = ConfigService.chaiseConfig;
  if (chaiseConfig.customCSS !== undefined) {
    // if the file is already injected
    if (document.querySelector(`link[href^='${chaiseConfig.customCSS}']`)) {
      return defer.resolve(), defer.promise;
    }

    const customCSSElement = document.createElement('link');
    customCSSElement.setAttribute('rel', 'stylesheet');
    customCSSElement.setAttribute('type', 'text/css');
    customCSSElement.setAttribute('href', chaiseConfig.customCSS);
    // resolve the promise when the css is loaded
    customCSSElement.onload = defer.resolve;
    customCSSElement.onerror = defer.resolve;
    document.getElementsByTagName('head')[0].appendChild(customCSSElement);
  } else {
    defer.resolve();
  }
  return defer.promise;
}

/**
* Detects the running enviornments and adss the following classes to chaise-body:
*  - chaise-mac: if it's running on macOS
*  - chaise-firefox: if it's running on Firefox
*  - chaise-iframe: if running in an iframe
*/
function addBodyClasses() {
  const osClass = (navigator.platform.indexOf('Mac') != -1 ? BODY_CLASS_NAMES.mac : undefined);
  const browserClass = (navigator.userAgent.indexOf('Firefox') != -1 ? BODY_CLASS_NAMES.firefox : undefined);

  const bodyElement = document.querySelector(`.${BODY_CLASS_NAMES.self}`);
  if (!bodyElement) return;

  if (osClass) {
    bodyElement.classList.add(osClass);
  }
  if (browserClass) {
    bodyElement.classList.add(browserClass);
  }
  if (windowRef.self !== windowRef.parent) {
    bodyElement.classList.add(BODY_CLASS_NAMES.iframe);
  }
}

function addTitle(title?: string) {
  const chaiseConfig = ConfigService.chaiseConfig;

  let usedTitle : string;
  if (typeof title !== 'string' || title.length === 0) {
    usedTitle = chaiseConfig.headTitle;
  } else {
    usedTitle = `${title} | ${chaiseConfig.headTitle}`;
  }

  document.title = usedTitle;
}

function addCanonicalTag() {
  const chaiseConfig = ConfigService.chaiseConfig;
  if (chaiseConfig.includeCanonicalTag == true) {
    const canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');

    // the hash returned from this function handles the case when '#' is switched with '?'
    const hash = getURLHashFragment(windowRef.location);
    const canonicalURL = windowRef.location.origin + windowRef.location.pathname + stripSortAndQueryParams(hash);
    canonicalTag.setAttribute('href', canonicalURL);
    document.getElementsByTagName('head')[0].appendChild(canonicalTag);
  }
}

function clickHref(href: string) {
  // fetch the file for the user
  const downloadLink = document.createElement('a');
  downloadLink.setAttribute('href', href);
  downloadLink.setAttribute('download', '');
  downloadLink.setAttribute('visibility', 'hidden');
  downloadLink.setAttribute('display', 'none');
  downloadLink.setAttribute('target', '_blank');
  // Append to page
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// TODO requires proper error handler and modal
// function overrideDownloadClickBehavior() {
//   addClickListener('a.asset-permission', function (e, element) {

//     function hideSpinner() {
//       element.innerHTML = element.innerHTML.slice(0, element.innerHTML.indexOf(spinnerHTML));
//     }

//     e.preventDefault();

//     var spinnerHTML = ' <span class='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span>';
//     //show spinner
//     element.innerHTML += spinnerHTML;

//     // if same origin, verify authorization
//     if (isSameOrigin(element.href)) {
//       var config = { skipRetryBrowserError: true, skipHTTP401Handling: true };

//       // make a HEAD request to check if the user can fetch the file
//       ConfigService.http.head(element.href, config).then(function () {
//         clickHref(element.href);
//       }).catch(function (exception: any) {
//         // error/login modal was closed
//         if (typeof exception == 'string') return;
//         var ermrestError = ConfigService.ERMrest.responseToError(exception);

//         if (ermrestError instanceof ConfigService.ERMrest.UnauthorizedError) {
//           ermrestError = new Errors.UnauthorizedAssetAccess();
//         } else if (ermrestError instanceof ConfigService.ERMrest.ForbiddenError) {
//           ermrestError = new Errors.ForbiddenAssetAccess();
//         }

//         // If an error occurs while a user is trying to download the file, allow them to dismiss the dialog
//         ErrorService.handleException(ermrestError, true);
//       }).finally(function () {
//         // remove the spinner
//         hideSpinner();
//       });
//     }
//   });
// }

// function overrideExternalLinkBehavior() {
//   addClickListener('a.external-link', function (e, element) {
//     e.preventDefault();

//     // asset-permission will be appended via display annotation or by heuristic if no annotation
//     // this else case should only occur if display annotation contains asset-permission and asset is not the same host
//     var modalProperties = {
//       windowClass: 'modal-redirect',
//       templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/externalLink.modal.html',
//       controller: 'RedirectController',
//       controllerAs: 'ctrl',
//       animation: false,
//       size: 'sm',
//     }
//     // show modal dialog with countdown before redirecting to 'asset'
//     modalUtils.showModal(modalProperties, function () {
//       clickHref(element.href);
//     }, false);
//   });
// }

// /**
// * make sure links open in new tab
// */
// function openLinksInTab() {
//   addClickListener('a[href]', function (e : Event, element) {
//     element.target = '_blank';
//   });
// }

// /**
// * Will call the handler function upon clicking on the elements represented by selector
// * @param {string} selector the selector string
// * @param {function} handler  the handler callback function.
// * handler parameters are:
// *  - Event object that is returned.
// *  - The target (element that is described by the selector)
// * NOTE since we're checking the closest element to the target, the e.target might
// * be different from the actual target that we want. That's why we have to send the target too.
// * We observerd this behavior in Firefox were clicking on an image wrapped by link (a tag), returned
// * the image as the value of e.target and not the link
// */
// function addClickListener(selector: string, handler: Function) {
//   document.querySelector('body')!.addEventListener('click', function (e) {
//     const target = e.target as HTMLElement;
//     if (target.closest(selector)) {
//       handler(e, target.closest(selector));
//     }
//   });
// }
