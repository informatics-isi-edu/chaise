import { LogAppModes } from "@chaise/models/log";
import { ConfigService } from "@chaise/services/config";
import $log from "@chaise/services/logger";

const APP_MODE_STACKPATH_SEPARATOR = ":";
const STACKPATH_CLIENTPATH_SEPARATOR = ",";
const LOG_STRING_SEPARATOR = "/";


export class LogService {
  private static _logAppMode : LogAppModes = LogAppModes.DEFAULT;
  private static _logStack : any; // TODO proper type
  private static _logStackPath : string;

   /**
   * Takes a object, adds default logging info to it, and logs the request with ermrest
   * @params {Object} logObj - object of key/value pairs that are specific to this action
   * @params {Object} commonLogInfo - object of key/value pairs that are common to all action requests
   */
  static logClientAction(logObj : any, commonLogInfo : any) {
      var cc = ConfigService.chaiseConfig
      var contextHeaderParams = ConfigService.contextHeaderParams;

      if (!cc.logClientActions) return;

      if (commonLogInfo) {
          // TODO this could just use all the attribues in the commonLogInfo
          logObj.catalog = commonLogInfo.catalog;
          logObj.schema_table = commonLogInfo.schema_table;
      }

      var headers : any = {};

      // in the case of static websites, the getHTTPService might return $http,
      // which doesn't have the contextHeaderParams, so we should add them here just in case
      for (var key in contextHeaderParams) {
          if (!contextHeaderParams.hasOwnProperty(key) || (key in logObj)) continue;
          // @ts-ignore:
          logObj[key] = contextHeaderParams[key];
      }
      headers[ConfigService.ERMrest.contextHeaderName] = logObj;
      ConfigService.http.head(cc.ermrestLocation + "/client_action", {headers: headers}).catch(function (err: any) {
          $log.debug("An error may have occured when logging: ", logObj);
          $log.debug(err);
      });
  }

  /**
   * Returns the appropriate stack object that should be used.
   * If childStackElement passed, it will append it to the existing logStack of the app.
   * @param {Object} childStackElement
   * @param {Object=} logStack if passed, will be used instead of the default value of the app.
   */
   static getStackObject(childStackNode : any, logStack: any) {
      if (!logStack) {
          logStack = LogService._logStack;
      }
      if (childStackNode) {
          return logStack.concat(childStackNode);
      }
      return logStack;
  }

  /**
   * Returns the stack path that should be used in logs.
   * @param {String=} currentPath - the existing stackPath
   * @param {String} childPath - the current child stack path
   */
   static getStackPath(currentPath: string | null, childPath: string) {
      if (!currentPath) {
          currentPath = LogService._logStackPath;
      }
      return currentPath + LOG_STRING_SEPARATOR + childPath;
  }

  /**
   * Creates a new stack node given the type, table, and extra information.
   * @param {String} type - one of the logStackTypes
   * @param {ERMrest.Table=} table - the table object of this node
   * @param {Object=} extraInfo - if you want to attach more info to this node.
   */
   static getStackNode(type: string, table?: any, extraInfo?: any) {
      var obj : any = {type: type};
      if (table) {
          obj.s_t = table.schema.name + ":" + table.name;
      }
      if (typeof extraInfo === "object" && extraInfo !== null) {
          for (var k in extraInfo) {
              if (!extraInfo.hasOwnProperty(k)) continue;
              obj[k] = extraInfo[k];
          }
      }
      return obj;
  }

  /**
   * Given an stack and new filterLogInfo, will remove the old ones and use the new ones.
   * @param {Object} stack - if not passed, will use the app-wide one
   * @param {Object} filterLogInfo
   */
   static updateStackFilterInfo(stack: any, filterLogInfo: any) {
      if (!stack) {
          stack = LogService._logStack;
      }
      var lastStackElement = stack[stack.length-1];
      // TODO can be better? remove the existing filter info in stack
      ['cfacet', 'cfacet_str', 'cfacet_path', 'filters', 'custom_filters'].forEach(function (k) {
          delete lastStackElement[k];
      });

      // update the stack to have the latest filter info
      for (var f in filterLogInfo) {
          if (!filterLogInfo.hasOwnProperty(f)) continue;
          lastStackElement[f] = filterLogInfo[f];
      }
  }

  /**
   * Given the array of causes and startTime, will return a new stack with appropriate variables.
   * @param {Object=} stack - if not passed, will use the app-wide one
   * @param {Array} causes
   * @param {String} startTime - in milliseconds
   */
  static addCausesToStack(stack: any | null, causes: any, startTime: any) {
      if (!stack) {
          stack = LogService._logStack;
      }

      // TODO test this
      var newStack = {... stack};
      var lastStackElement = newStack[stack.length-1];
      lastStackElement.causes = causes;
      lastStackElement.start_ms = startTime;
      lastStackElement.end_ms = ConfigService.ERMrest.getElapsedTime();
      return newStack;
  }

  /**
   * Given an stack and object, will return a new stack with the object information added.
   * @param {Object=} stack - if not passed, will use the app-wide one
   * @param {Object} extraInfo
   */
  static addExtraInfoToStack(stack: any | null, extraInfo: any) {
      if (!stack) {
        stack = LogService._logStack;
      }

      // TODO test this
      var newStack = {... stack};
      var lastStackElement = newStack[stack.length-1];

      for (var f in extraInfo) {
          if (!extraInfo.hasOwnProperty(f)) continue;
          lastStackElement[f] = extraInfo[f];
      }

      return newStack;
  }

  /**
   * Given the logStackPath and logActionVerb will return the appropriate action string.
   * @param {String} logActionVerb - the action verb
   * @param {String} logStackPath - if the given value is not a string, we will use the $rootScope.logStackPath instead.
   * @param {String} appMode -if the given value is not a string, we will use te $rootScope.logAppMode instead.
   */
  static getActionString(logActionVerb: string, logStackPath?: string | null, appMode?: string) {
      if (typeof logStackPath !== "string") {
          logStackPath = LogService._logStackPath;
      }
      if (typeof appMode !== "string") {
          appMode = LogService._logAppMode;
      }
      return  appMode + APP_MODE_STACKPATH_SEPARATOR + logStackPath + STACKPATH_CLIENTPATH_SEPARATOR + logActionVerb;
  }


}
