import axios from 'axios';
import Q from 'q';
import 'regenerator-runtime'; // needed for async/await to work

// models
import { Session } from '@isrd-isi-edu/chaise/src/models/user';

//services
import $log, { LoggerLevels } from '@isrd-isi-edu/chaise/src/services/logger';
import { AuthnStorageService } from '@isrd-isi-edu/chaise/src/services/authn-storage';

// utils
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import {generateUUID} from '@isrd-isi-edu/chaise/src/utils/math-utils';
import { getCatalogId, getQueryParam } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { setupHead, setWindowName } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import {
  APP_CONTEXT_MAPPING, APP_TAG_MAPPING, BUILD_VARIABLES, CHAISE_CONFIG_PROPERTY_NAMES,
  CHAISE_CONFIG_STATIC_PROPERTIES, DEFAULT_CHAISE_CONFIG, IS_DEV_MODE,
} from '@isrd-isi-edu/chaise/src/utils/constants';

// this will ensure that we're configuring ermrestjs as soon as this file loads.
windowRef.ERMrest.configure(axios, Q);

export interface AppSettings {
  appName: string,
  appTitle?: string,
  hideNavbar?: boolean,
  openLinksInTab?: boolean,
  /**
   * adds the image preview functionality of chaise
   */
  overrideImagePreviewBehavior?: boolean,
  overrideDownloadClickBehavior?: boolean,
  overrideExternalLinkBehavior?: boolean,
  overrideHeadTitle?: boolean,

}

/**
 * input to the ConfigService.configure
 */
export interface ConfigServiceSettings {
  appName: string,
  appTitle?: string,
  hideNavbar?: boolean,
  overrideHeadTitle?: boolean,
  overrideImagePreviewBehavior?: boolean,
  overrideDownloadClickBehavior?: boolean,
  overrideExternalLinkBehavior?: boolean,
  openIframeLinksInTab?: boolean
}

export interface ContextHeaderParams {
  cid: string,
  pid: string,
  wid: string
}

export class ConfigService {
  private static _setupDone = false;

  private static _ermrest: any = windowRef.ERMrest;

  private static _server: any;

  private static _contextHeaderParams: ContextHeaderParams;

  private static _appSettings: AppSettings;

  private static _chaiseConfig: any; // TODO

  private static _ermrestLocation: string;

  /**
   * Should be called in useEffect of the main app, to ensure all the
   * configurations are done before any other components are running.
   * @param settings
   */
  static async configure(settings: ConfigServiceSettings, session: Session | null ) {
    setWindowName();

    // trick to verify if this config app is running inside of an iframe as part of another app
    const inIframe = windowRef.self !== windowRef.parent;

    let hideNavbarParam;

    // TODO
    const navbarParam = getQueryParam(windowRef.location.href, 'hideNavbar');
    if (navbarParam === 'true') {
      hideNavbarParam = true;
    } else if (navbarParam === 'false') {
      // matters for when we are inside an iframe
      hideNavbarParam = false;
    } else {
      hideNavbarParam = null;
    }
    /**
     * first case: in iframe and hideNavbar = !false
     *      - could be true or null, null meaning use default of hide navbar in iframe
     * second case: hideNavbar = true
     *      - doesn't matter if in an iframe or not, if true, hide it
     */
    const hideNavbar = (inIframe && hideNavbarParam !== false) || hideNavbarParam === true;
    const openLinksInTab = inIframe && settings.openIframeLinksInTab;

    ConfigService._contextHeaderParams = {
      cid: settings.appName,
      pid: generateUUID(),
      wid: windowRef.name
    };

    ConfigService._appSettings = {
      hideNavbar,
      // the settings constant is not accessible from chaise apps,
      // therefore we're capturing them here so they can be used in chaise
      appName: settings.appName,
      appTitle: settings.appTitle,
      overrideHeadTitle: settings.overrideHeadTitle,
      overrideImagePreviewBehavior: settings.overrideImagePreviewBehavior,
      overrideDownloadClickBehavior: settings.overrideDownloadClickBehavior,
      overrideExternalLinkBehavior: settings.overrideExternalLinkBehavior,
      openLinksInTab
    };

    // TODO added for backwards compatibility.. is it needed?
    windowRef.dcctx = {
      contextHeaderParams: ConfigService._contextHeaderParams
    };

    // setup ermrest
    const ERMrest = windowRef.ERMrest;

    await ERMrest.onload();

    // this will also populate ConfigService.chaiseConfig based on chaise-config.js
    // if it already is not populated
    const service = ConfigService.ERMrestLocation;

    const catalogId = getCatalogId();

    if (catalogId) {
      // the server object that can be used in other places
      ConfigService._server = ERMrest.ermrestFactory.getServer(service, ConfigService._contextHeaderParams);

      console.log('asking for catalog!');
      const response = await ConfigService._server.catalogs.get(catalogId, true);
      // we already setup the defaults and the configuration based on chaise-config.js
      if (response && response.chaiseConfig) {
        ConfigService._setChaiseConfig(response.chaiseConfig);
      }
    }

    if (ConfigService.chaiseConfig.debug === true || IS_DEV_MODE) {
      $log.setLevel(LoggerLevels.TRACE);
      $log.debug('=====================\nDEBUG MODE ENABLED\n=====================');
    }

    ConfigService._setupERMrest(ERMrest, session);
    return setupHead();
  }

  /**
   * the location of ermrest. can be used for other deriva services too.
   */
  static get ERMrestLocation () {
    if (isStringAndNotEmpty(ConfigService._ermrestLocation)) {
      return ConfigService._ermrestLocation;
    }
    let loc = ConfigService._setChaiseConfig().ermrestLocation;
    // if the chaise-config.js removed the default value
    if (!isStringAndNotEmpty(loc)) {
      loc = DEFAULT_CHAISE_CONFIG.ermrestLocation;
    }
    return ConfigService._ermrestLocation = loc;
  }

  /**
   * ermrestjs instance that can be used for talking with ermrest
   */
  static get ERMrest() {
    return ConfigService._ermrest;
  }

  /**
   * The http service
   */
  static get http() {
    return ConfigService._setupDone && ConfigService._server ? ConfigService._server.http : axios;
  }

  /**
   * The app settings
   */
  static get appSettings() {
    return ConfigService._appSettings;
  }

  static get chaiseConfig() {
    return ConfigService._chaiseConfig;
  }

  static get contextHeaderParams() {
    return ConfigService._contextHeaderParams;
  }

  // -------------------------- private functions: --------------------------- //

  /**
   * setup ermrestjs and all the callbacks that it needs.
   * @param ERMrest the ermrestjs instance
   * @private
   */
  private static _setupERMrest(ERMrest: any, session: Session | null) {
    ERMrest.appLinkFn(ConfigService._appTagToURL);
    ERMrest.systemColumnsHeuristicsMode(ConfigService._systemColumnsMode);
    ERMrest.onHTTPSuccess(AuthnStorageService.extendPromptExpirationToken);

    const chaiseConfig = ConfigService.chaiseConfig;
    ERMrest.setClientConfig({
      internalHosts: chaiseConfig.internalHosts,
      disableExternalLinkModal: chaiseConfig.disableExternalLinkModal,
      facetPanelDisplay: chaiseConfig.facetPanelDisplay,
      templating: chaiseConfig.templating
    });

    ERMrest.setClientSession(session);

    ConfigService._setupDone = true;
    ConfigService._ermrest = ERMrest;
  }

  // TODO proper type
  private static _setChaiseConfig(catalogAnnotation?: any): any {
    const cc: any = {}; // TODO proper type
    const chaiseConfig = windowRef.chaiseConfig;
    // check to see if global chaise-config (chaise-config.js) is available
    if (typeof chaiseConfig !== 'undefined') {
      // loop through properties and compare to defaultConfig to see if they are valid
      // chaiseConfigPropertyNames is a whitelist of all accepted values
      for (const key in chaiseConfig) {
        // see if returned key is in the list we accept
        const matchedKey = ConfigService._matchKey(CHAISE_CONFIG_PROPERTY_NAMES, key);

        // if we found a match for the current key in chaiseConfig, use the match from chaiseConfigPropertyNames as the key and set the value
        if (matchedKey.length > 0 && matchedKey[0]) {
          cc[matchedKey[0]] = chaiseConfig[key];
        }
      }
    }

    // Loop over default properties (global chaise config (chaise-config.js) may not be defined)
    // Handles case 1 and 2a
    for (const property in DEFAULT_CHAISE_CONFIG) {
      // use chaise-config.js property instead of default if defined
      if (typeof chaiseConfig !== 'undefined') {
        // see if 'property' matches a key in chaiseConfig
        const matchedKey = ConfigService._matchKey(Object.keys(chaiseConfig), property);

        // property will be in proper case already since it comes from our config object in JS
        // TODO we have to most probably refactor this code so we don't have to do the following ts-ignore
        // @ts-ignore:
        cc[property] = ((matchedKey.length > 0 && matchedKey[0]) ? chaiseConfig[property] : DEFAULT_CHAISE_CONFIG[property]);
      } else {
        // property doesn't exist
        // TODO we have to most probably refactor this code so we don't have to do the following ts-ignore
        // @ts-ignore:
        cc[property] = DEFAULT_CHAISE_CONFIG[property];
      }
    }

    // case 2b
    // cc contains properties for default config and chaise-config.js configuration
    ConfigService._applyHostConfigRules(cc, cc);

    // apply catalog annotation configuration on top of the rest of the chaise config properties
    if (typeof catalogAnnotation === 'object') {
      // case 3a
      for (const property in catalogAnnotation) {
        const matchedKey = ConfigService._matchKey(CHAISE_CONFIG_PROPERTY_NAMES, property);

        /**
         * - if we found a match for the current key in catalogAnnotation,
         *   use the match from chaiseConfigPropertyNames as the key and set the value.
         * - ignore the proeprties that are only allowed in chaise-config.js
         */
        if (matchedKey.length > 0 && matchedKey[0] && CHAISE_CONFIG_STATIC_PROPERTIES.indexOf(matchedKey[0]) === -1) {
          cc[matchedKey[0]] = catalogAnnotation[property];
        }
      }

      // case 3b
      ConfigService._applyHostConfigRules(catalogAnnotation, cc, true);
    }

    // shareCiteAcls is a nested object, user could define shareCiteAcls:
    //     { show: ['*'] }
    // with no enable array defined
    // make sure the object has both defined and apply the default if one or the other is missing
    if (!cc.shareCiteAcls.show) cc.shareCiteAcls.show = DEFAULT_CHAISE_CONFIG.shareCiteAcls.show;
    if (!cc.shareCiteAcls.enable) cc.shareCiteAcls.enable = DEFAULT_CHAISE_CONFIG.shareCiteAcls.enable;

    ConfigService._chaiseConfig = cc;

    return cc;
  }

  private static _matchKey(collection: string[], keyToMatch: string) {
    return collection.filter((key) =>
      // toLowerCase both keys for a case insensitive comparison
      keyToMatch.toLowerCase() === key.toLowerCase());
  }

  /**
   *
   * @param config chaise config with configRules defined
   * @param resultChaiseConfig the chaiseConfig object that will be manipulated and returned.
   * @param fromAnnot whether this config is coming from annotation or not (if annotation, static props will be ignored)
   */
  private static _applyHostConfigRules(config: any, resultChaiseConfig: any, fromAnnot?: boolean) {
    if (Array.isArray(config.configRules)) {
      // loop through each config rule and look for a set that matches the current host
      config.configRules.forEach((ruleset: any) => {
        // we have 1 host
        if (typeof ruleset.host === 'string') {
          const arr = [];
          arr.push(ruleset.host);
          ruleset.host = arr;
        }
        if (Array.isArray(ruleset.host)) {
          for (let i = 0; i < ruleset.host.length; i++) {
            // if there is a config rule for the current host, overwrite the properties defined
            // windowRef.location.host refers to the hostname and port (www.something.com:0000)
            // windowRef.location.hostname refers to just the hostname (www.something.com)
            if (ruleset.host[i] === windowRef.location.hostname && (ruleset.config && typeof ruleset.config === 'object')) {
              for (const property in ruleset.config) {
                const matchedKey = ConfigService._matchKey(CHAISE_CONFIG_PROPERTY_NAMES, property);

                /**
                 * - if we found a match for the current key in ruleset.config,
                 *   use the match from chaiseConfigPropertyNames as the key and set the value
                 * - if the config is coming from annotation, ignore the properties that are only allowed in chaise-config.js
                 */
                if (matchedKey.length > 0 && matchedKey[0] && !(fromAnnot && (CHAISE_CONFIG_STATIC_PROPERTIES.indexOf(matchedKey[0]) !== -1))) {
                  resultChaiseConfig[matchedKey[0]] = ruleset.config[property];
                }
              }
              break;
            }
          }
        }
      });
    }
  }

  /**
   * Used in _appTagToURL to properly map context to a map.
   * @param object
   * @param context
   * @private
   * @returns
   */
  private static _getValueFromContext(object: any, context: string): string {
    let partial = context, parts = context.split('/');
    while (partial !== '') {
      if (partial in object) { // found the context
        return object[partial];
      }
      parts.splice(-1, 1); // remove the last part
      partial = parts.join('/');
    }
    return object['*'];
  }

  /**
   * The function that will be passed to ermrestjs to turn tag into an app.
   * @param tag
   * @param location
   * @param context
   * @private
   * @returns
   */
  private static _appTagToURL(tag: string, location: any, context: string) {
    let appPath;
    if (tag && (tag in APP_TAG_MAPPING)) {
      appPath = APP_TAG_MAPPING[tag as keyof typeof APP_TAG_MAPPING];
    } else {
      appPath = ConfigService._getValueFromContext(APP_CONTEXT_MAPPING, context);
    }

    let url = `${windowRef.location.origin}${BUILD_VARIABLES.CHAISE_BASE_PATH + appPath}/#${location.catalog}/${location.path}`;
    const pcontext = [];

    const settingsObj = ConfigService.appSettings;
    const contextHeaderParams = ConfigService.contextHeaderParams;
    pcontext.push(`pcid=${contextHeaderParams.cid}`);
    pcontext.push(`ppid=${contextHeaderParams.pid}`);
    // only add the value to the applink function if it's true
    if (settingsObj.hideNavbar) pcontext.push(`hideNavbar=${settingsObj.hideNavbar}`);

    // TODO we might want to allow only certian query parameters
    if (location.queryParamsString) {
      url = `${url}?${location.queryParamsString}`;
    }
    if (pcontext.length > 0) {
      url = url + (location.queryParamsString ? '&' : '?') + pcontext.join('&');
    }
    return url;
  }

  /**
   * Given the context, returns the value of the chaise config property for system column heuristics
   * @params {String} context - the current app context
   * @private
   * @return {boolean|Array|null} boolean - value to show or hide all system columns
   *                              Array - order of which columns to show
   *                              null - no value defined for the current context
   */
  private static _systemColumnsMode(context: string) {
    const cc = ConfigService.chaiseConfig;

    let mode = null;
    if (context.indexOf('compact') != -1 && cc.systemColumnsDisplayCompact) {
      mode = cc.systemColumnsDisplayCompact;
    } else if (context == 'detailed' && cc.systemColumnsDisplayDetailed) {
      mode = cc.systemColumnsDisplayDetailed;
    } else if (context.indexOf('entry') != -1 && cc.systemColumnsDisplayEntry) {
      mode = cc.systemColumnsDisplayEntry;
    }

    return mode;
  }
}

// TODO these functions should be moved somewhere else:
//
// function initializeSavingQueries(reference, queryParams) {
//   var chaiseConfig = getConfigJSON();
//   // initalize to null as if there is no saved query table
//   // savedQuery object should be defined with showUI true || false for UI purposes
//   var savedQuery = {
//       showUI: reference.display.showSavedQuery
//   }

//   // NOTE: if this is not set, saved query UI should probably be turned off
//   if (chaiseConfig.savedQueryConfig && typeof chaiseConfig.savedQueryConfig.storageTable == 'object') {
//       var mapping = savedQuery.mapping = chaiseConfig.savedQueryConfig.storageTable;

//       var validMapping = isStringAndNotEmpty(mapping.catalog) && isStringAndNotEmpty(mapping.schema) && isStringAndNotEmpty(mapping.table);

//       // match ermrestUri with the savedQuery.mapping to verify if we are looking saved query recordset page
//       if (validMapping) {
//           savedQuery.ermrestTablePath = '/ermrest/catalog/' + mapping.catalog + '/entity/' + mapping.schema + ':' + mapping.table
//           savedQuery.ermrestAGPath = '/ermrest/catalog/' + mapping.catalog + '/attributegroup/' + mapping.schema + ':' + mapping.table

//           // should only be set if mapping is valid as well since we can't update the last_execution_time without a valid mapping
//           if (queryParams && queryParams.savedQueryRid) savedQuery.rid = queryParams.savedQueryRid;
//       } else {
//           // if mapping is invalid, the config is ill-defined and the feature will be turned off
//           savedQuery.showUI = false;
//       }
//   } else {
//       // if storage table is not defined, the config is ill-defined and the feature will be turned off
//       savedQuery.showUI = false;
//   }

//   return savedQuery;
// }
