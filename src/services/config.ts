import axios from "axios";
import Q from "q";
import { windowRef } from "@chaise/utils/window-ref";

// needed for async/await to work
import "regenerator-runtime";
import { APP_CONTEXT_MAPPING, APP_TAG_MAPPING, BUILD_VARIABLES, CHAISE_CONFIG_PROPERTY_NAMES, DEFAULT_CHAISE_CONFIG } from '@chaise/utils/constants';
import { MathUtils } from "@chaise/utils/utils";
import { getCatalogId } from "@chaise/legacy/src/utils/uri-utils";
import { setupHead, setWindowName } from "@chaise/utils/head-injector";

export class ConfigService {
  private static _setupDone = false;
  private static _ermrest: any = windowRef.ERMrest;
  private static _server: any;
  private static _contextHeaderParams: {
    cid: string,
    pid: string,
    wid: string
  };
  private static _appSettings: {
    appTitle: string,
    hideNavbar?: boolean,
    overrideHeadTitle?: boolean,
    overrideDownloadClickBehavior?: boolean,
    overrideExternalLinkBehavior?: boolean,
    openLinksInTab?: boolean
  };
  private static _chaiseConfig: any; // TODO

  /**
   * Should be called in useEffect of the main app, to ensure all the
   * configurations are done before any other components are running.
   * @param settings
   */
  static async configure(settings: {
    appName: string,
    appTitle: string,
    hideNavbar?: boolean,
    overrideHeadTitle?: boolean,
    overrideDownloadClickBehavior?: boolean,
    overrideExternalLinkBehavior?: boolean,
    openIframeLinksInTab?: boolean
  }) {

    setWindowName();

    // trick to verify if this config app is running inside of an iframe as part of another app
    var inIframe = windowRef.self !== windowRef.parent;

    var hideNavbarParam;

    // TODO
    // var navbarParam = UriUtils.getQueryParam($window.location.href, "hideNavbar");
    var navbarParam = "false";
    if (navbarParam === "true") {
      hideNavbarParam = true;
    } else if (navbarParam === "false") {
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
    var hideNavbar = (inIframe && hideNavbarParam !== false) || hideNavbarParam === true;
    var openLinksInTab = inIframe && settings.openIframeLinksInTab;


    ConfigService._contextHeaderParams = {
      cid: settings.appName,
      pid: MathUtils.uuid(),
      wid: windowRef.name
    };

    ConfigService._appSettings = {
      hideNavbar: hideNavbar,
      // the settings constant is not accessible from chaise apps,
      // therefore we're capturing them here so they can be used in chaise
      appTitle: settings.appTitle,
      overrideHeadTitle: settings.overrideHeadTitle,
      overrideDownloadClickBehavior: settings.overrideDownloadClickBehavior,
      overrideExternalLinkBehavior: settings.overrideExternalLinkBehavior,
      openLinksInTab: openLinksInTab
    }

    // set chaise configuration based on what is in `chaise-config.js` first
    ConfigService._setChaiseConfig();

    // setup ermrest
    let ERMrest = windowRef.ERMrest;

    ERMrest.configure(axios, Q);

    await ERMrest.onload();
    let cc = ConfigService._setChaiseConfig();
    let service = cc!.ermrestLocation;
    let catalogId = getCatalogId();

    if (catalogId) {
      // the server object that can be used in other places
      ConfigService._server = ERMrest.ermrestFactory.getServer(service, ConfigService._contextHeaderParams);

      const response = await ConfigService._server.catalogs.get(catalogId, true);
      // we already setup the defaults and the configuration based on chaise-config.js
      if (response && response.chaiseConfig) {
        ConfigService._setChaiseConfig(response.chaiseConfig);
      }
    }

    ConfigService._setupERMrest(ERMrest);
    return setupHead();
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
    return ConfigService._setupDone ? axios : ConfigService._server.http;
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

  static get contextJSON() {
    return windowRef.dcctx;
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
  private static _setupERMrest(ERMrest: any) {
    ERMrest.appLinkFn(ConfigService._appTagToURL);
    ERMrest.systemColumnsHeuristicsMode(ConfigService._systemColumnsMode);
    // TODO
    // ERMrest.onHTTPSuccess(Session.extendPromptExpirationToken);

    var chaiseConfig = ConfigService.chaiseConfig;
    ERMrest.setClientConfig({
        internalHosts: chaiseConfig.internalHosts,
        disableExternalLinkModal: chaiseConfig.disableExternalLinkModal
    });

    ConfigService._setupDone = true;
    ConfigService._ermrest = ERMrest;
  }

  // TODO proper type
  private static _setChaiseConfig(catalogAnnotation?: any): any {
    let cc: any = {}; // TODO proper type
    let chaiseConfig = windowRef.chaiseConfig;
    // check to see if global chaise-config (chaise-config.js) is available
    if (typeof chaiseConfig != 'undefined') {
      // loop through properties and compare to defaultConfig to see if they are valid
      // chaiseConfigPropertyNames is a whitelist of all accepted values
      for (var key in chaiseConfig) {
        // see if returned key is in the list we accept
        var matchedKey = ConfigService._matchKey(CHAISE_CONFIG_PROPERTY_NAMES, key);

        // if we found a match for the current key in chaiseConfig, use the match from chaiseConfigPropertyNames as the key and set the value
        if (matchedKey.length > 0 && matchedKey[0]) {
          cc[matchedKey[0]] = chaiseConfig[key];
        }
      }
    }

    // Loop over default properties (global chaise config (chaise-config.js) may not be defined)
    // Handles case 1 and 2a
    for (var property in DEFAULT_CHAISE_CONFIG) {
      // use chaise-config.js property instead of default if defined
      if (typeof chaiseConfig != 'undefined') {
        // see if "property" matches a key in chaiseConfig
        var matchedKey = ConfigService._matchKey(Object.keys(chaiseConfig), property);

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
    if (typeof catalogAnnotation == "object") {
      // case 3a
      for (var property in catalogAnnotation) {
        var matchedKey = ConfigService._matchKey(CHAISE_CONFIG_PROPERTY_NAMES, property);

        // if we found a match for the current key in catalogAnnotation, use the match from chaiseConfigPropertyNames as the key and set the value
        if (matchedKey.length > 0 && matchedKey[0]) {
          cc[matchedKey[0]] = catalogAnnotation[property];
        }
      }

      // case 3b
      ConfigService._applyHostConfigRules(catalogAnnotation, cc);
    }

    // shareCiteAcls is a nested object, user could define shareCiteAcls:
    //     { show: ["*"] }
    // with no enable array defined
    // make sure the object has both defined and apply the default if one or the other is missing
    if (!cc.shareCiteAcls.show) cc.shareCiteAcls.show = DEFAULT_CHAISE_CONFIG.shareCiteAcls.show;
    if (!cc.shareCiteAcls.enable) cc.shareCiteAcls.enable = DEFAULT_CHAISE_CONFIG.shareCiteAcls.enable;

    ConfigService._chaiseConfig = cc;

    return cc;
  }

  private static _matchKey(collection: string[], keyToMatch: string) {
    return collection.filter(function (key) {
      // toLowerCase both keys for a case insensitive comparison
      return keyToMatch.toLowerCase() === key.toLowerCase();
    });
  }

  /**
   * @params {Object} config - chaise config with configRules defined
   * @private
   */
  private static _applyHostConfigRules(config: any, resultChaiseConfig: any) {
    if (Array.isArray(config.configRules)) {
      // loop through each config rule and look for a set that matches the current host
      config.configRules.forEach(function (ruleset: any) {
        // we have 1 host
        if (typeof ruleset.host == "string") {
          var arr = [];
          arr.push(ruleset.host);
          ruleset.host = arr;
        }
        if (Array.isArray(ruleset.host)) {
          for (var i = 0; i < ruleset.host.length; i++) {
            // if there is a config rule for the current host, overwrite the properties defined
            // windowRef.location.host refers to the hostname and port (www.something.com:0000)
            // windowRef.location.hostname refers to just the hostname (www.something.com)
            console.log(windowRef.location.hostname);
            if (ruleset.host[i] === windowRef.location.hostname && (ruleset.config && typeof ruleset.config === "object")) {
              for (var property in ruleset.config) {
                var matchedKey = ConfigService._matchKey(CHAISE_CONFIG_PROPERTY_NAMES, property);

                // if we found a match for the current key in ruleset.config, use the match from chaiseConfigPropertyNames as the key and set the value
                if (matchedKey.length > 0 && matchedKey[0]) {
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
    var partial = context, parts = context.split("/");
    while (partial !== "") {
      if (partial in object) { // found the context
        return object[partial];
      }
      parts.splice(-1, 1); // remove the last part
      partial = parts.join("/");
    }
    return object["*"];
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

    var appPath;
    if (tag && (tag in APP_TAG_MAPPING)) {
      appPath = APP_TAG_MAPPING[tag as keyof typeof APP_TAG_MAPPING];
    } else {
      appPath = ConfigService._getValueFromContext(APP_CONTEXT_MAPPING, context);
    }

    var url = BUILD_VARIABLES.CHAISE_BASE_PATH + appPath + "/#" + location.catalog + "/" + location.path;
    var pcontext = [];

    var settingsObj = ConfigService.appSettings;
    var contextHeaderParams = ConfigService.contextHeaderParams;
    pcontext.push("pcid=" + contextHeaderParams.cid);
    pcontext.push("ppid=" + contextHeaderParams.pid);
    // only add the value to the applink function if it's true
    if (settingsObj.hideNavbar) pcontext.push("hideNavbar=" + settingsObj.hideNavbar)

    // TODO we might want to allow only certian query parameters
    if (location.queryParamsString) {
      url = url + "?" + location.queryParamsString;
    }
    if (pcontext.length > 0) {
      url = url + (location.queryParamsString ? "&" : "?") + pcontext.join("&");
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
    var cc = ConfigService.chaiseConfig;

    var mode = null;
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
//   if (chaiseConfig.savedQueryConfig && typeof chaiseConfig.savedQueryConfig.storageTable == "object") {
//       var mapping = savedQuery.mapping = chaiseConfig.savedQueryConfig.storageTable;

//       var validMapping = isStringAndNotEmpty(mapping.catalog) && isStringAndNotEmpty(mapping.schema) && isStringAndNotEmpty(mapping.table);

//       // match ermrestUri with the savedQuery.mapping to verify if we are looking saved query recordset page
//       if (validMapping) {
//           savedQuery.ermrestTablePath = "/ermrest/catalog/" + mapping.catalog + "/entity/" + mapping.schema + ":" + mapping.table
//           savedQuery.ermrestAGPath = "/ermrest/catalog/" + mapping.catalog + "/attributegroup/" + mapping.schema + ":" + mapping.table

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

// /**
// * Returns true if the object passed is valid for the terms and conditions feature
// * @params {Object} obj - the termaAndConditions object from chaise-config
// * @return {boolean} boolean - value to use the terms and conditions config requiring a specific globus group for access
// *
// * termsAndConditionsConfig: {
// *     "groupId": "https://auth.globus.org/123a4bcd-ef5a-67bc-8912-d34e5fa67b89",
// *     "joinUrl": "https://app.globus.org/groups/123a4bcd-ef5a-67bc-8912-d34e5fa67b89/join",
// *     "groupName": "Globus group name"
// * },
// */
// function validateTermsAndConditionsConfig(obj) {
//   if (!obj || typeof obj !== "object") return false;
//   var tacConfig = getConfigJSON().termsAndConditionsConfig;

//   // all 3 properties must be defined for this to function, if not the old login app will be used
//   return (isStringAndNotEmpty(tacConfig.groupId) && isStringAndNotEmpty(tacConfig.joinUrl) && isStringAndNotEmpty(tacConfig.groupName));
// }
