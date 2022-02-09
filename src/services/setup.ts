// TODO how ermrestjs should be configured?
// import Q from '@chaise/vendor/q';
import axios from 'axios';
import { windowRef } from '@chaise/utils/window-ref';

// needed for async/await to work
import "regenerator-runtime";

// TODO
// legacy chaise-config
// import '@chaise/legacy/chaise-config.js';

function getValueFromContext(object: any, context: string): string {
  var partial = context,
      parts = context.split("/");
  while (partial !== "") {
      if (partial in object) { // found the context
          return object[partial];
      }
      parts.splice(-1, 1); // remove the last part
      partial = parts.join("/");
  }
  return object["*"];
}

function appTagToURL(tag: string, location: any, context: string) {
    const appTagMapping = {
        "tag:isrd.isi.edu,2016:chaise:record": "/record",
        "tag:isrd.isi.edu,2016:chaise:detailed": "/detailed",
        "tag:isrd.isi.edu,2016:chaise:viewer": "/viewer",
        "tag:isrd.isi.edu,2016:chaise:search": "/search",
        "tag:isrd.isi.edu,2016:chaise:recordset": "/recordset",
        "tag:isrd.isi.edu,2016:chaise:recordedit": "/recordedit"
    };

    const appContextMapping = {
        "detailed": "/record",
        "compact": "/recordset",
        "edit": "/recordedit",
        "entry": "/recordedit",
        "*": "/record"
    };

    var appPath;
    if (tag && (tag in appTagMapping)) {
        appPath = appTagMapping[tag as keyof typeof appTagMapping];
    } else {
        appPath = getValueFromContext(appContextMapping, context);
    }

    var url = "/~ashafaei/chaise" + appPath + "/#" + location.catalog + "/" + location.path;

    if (location.queryParamsString) {
        url = url + "?" + location.queryParamsString;
    }
    return url;
}

/**
 * TODO should
 * - set the chaise-config
 * - ermrest functions
 * - other global settings
 */
const setup = async () : Promise<any> => {
    // windowRef.ERMrest.configure(axios, Q);

    // ermrest.onload doesn't return rejection
    // await windowRef.ERMrest.onload();

    // windowRef.ERMrest.appLinkFn(appTagToURL);

    // TODO
    // windowRef.ERMrest.onHTTPSuccess(Session.extendPromptExpirationToken);
    // TODO how to include ermrestjs?
    // either npm install or ...?
    // return windowRef.ERMrest;

    return true;
}

export default setup;
