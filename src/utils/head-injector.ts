import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { BODY_CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { generateUUID } from '@isrd-isi-edu/chaise/src/utils/math-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { getURLHashFragment, stripSortAndQueryParams } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { isSafari, windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { openLinksInTab } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

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
  if (settings.openLinksInTab) openLinksInTab();
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
    windowRef.name = generateUUID();
  }
}

/**
 * adds a link tag to head with the custom css. It will be resolved when
 * the file is loaded (or if the customCSS property is not defined)
 */
async function addCustomCSS() {
  return new Promise<void>((resolve) => {
    const chaiseConfig = ConfigService.chaiseConfig;
    if (chaiseConfig.customCSS !== undefined) {
      // if the file is already injected
      if (document.querySelector(`link[href^='${chaiseConfig.customCSS}']`)) {
        resolve();
        return;
      }

      const customCSSElement = document.createElement('link');
      customCSSElement.setAttribute('rel', 'stylesheet');
      customCSSElement.setAttribute('type', 'text/css');
      customCSSElement.setAttribute('href', chaiseConfig.customCSS);
      // resolve the promise when the css is loaded
      customCSSElement.onload = () => resolve();
      customCSSElement.onerror = () => resolve();
      document.getElementsByTagName('head')[0].appendChild(customCSSElement);
    } else {
      resolve();
    }
  });
}

/**
* Detects the running enviornments and adss the following classes to chaise-body:
*  - chaise-mac: if it's running on macOS
*  - chaise-firefox: if it's running on Firefox
*  - chaise-iframe: if running in an iframe
*/
function addBodyClasses() {
  const osClass = (navigator.platform.indexOf('Mac') !== -1 ? BODY_CLASS_NAMES.mac : undefined);
  let browserClass;
  if (navigator.userAgent.indexOf('Firefox') !== -1) {
    browserClass = BODY_CLASS_NAMES.firefox;
  } else if (isSafari()) {
    browserClass = BODY_CLASS_NAMES.safari;
  }

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

/**
 * add schema name and table name classes to the app-container
 * this could be done in the appWrapper comp itself, but that would cause multiple
 * renders. so I decided to do it this way instead.
 * @param reference the reference object
 * @param appName name of the app ('record' | 'recordset' | 'recordedit')
 */
export function addAppContainerClasses(reference: any, appName: string) {
  const s = makeSafeIdAttr(reference.table.schema.name), t = makeSafeIdAttr(reference.table.name);
  // NOTE: classList.add doesn't accept whitespace as classname that's why we're using array
  let addedClass: string[] = [];
  switch (appName) {
    case 'record':
      addedClass = [`r_s_${s}`, `r_t_${t}`];
      break;
    case 'recordset':
      addedClass = [`rs_s_${s}`, `rs_t_${t}`];
      break;
    case 'recordedit':
      addedClass = [`re_s_${s}`, `re_t_${t}`];
      break;
    default:
      break;
  }
  if (addedClass.length === 0) return;
  document.querySelector('.app-container')?.classList.add(...addedClass);
}

function addTitle(title?: string) {
  const chaiseConfig = ConfigService.chaiseConfig;

  let usedTitle: string;
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
    const { hash } = getURLHashFragment(windowRef.location);
    const canonicalURL = windowRef.location.origin + windowRef.location.pathname + stripSortAndQueryParams(hash);
    canonicalTag.setAttribute('href', canonicalURL);
    document.getElementsByTagName('head')[0].appendChild(canonicalTag);
  }
}
