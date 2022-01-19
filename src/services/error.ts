import { windowRef } from '@chaise/utils/window-ref'

// TODO not used for now

export class ErrorHandler {

  static handleException(exception: any, isDismissible?: boolean, skipLogging?: boolean, okBtnCallback?: Function, closeBtnCallback?: Function) {
    // TODO
    console.log("handling an exception");
  }


  static errorVisible = false;

  /**
   * return the generic template for error dialogs when the server or nerwork is not available
   * @param error
   * @param dialogMessage
   * @param redirectLink
   * @param canClose
   * @returns
   */
  static offlineModalTemplate = function (error: Error, dialogMessage: string, redirectLink: string, canClose: boolean) {
    ErrorHandler.errorVisible = document.getElementById('divErrorModal') ? true : false;
    if (!document || !document.body || ErrorHandler.errorVisible) return;

    var errName = error.constructor.name;
    errName = (errName.toLowerCase() !== 'error') ? errName : "Terminal Error";

    var html = [
      '<div modal-render="true" tabindex="-1" role="dialog" class="modal fade in" index="0" animate="animate" modal-animation="true" style="z-index: 1050; display: block;">',
        '<div class="modal-dialog" style="width:90% !important;">',
          '<div class="modal-content" uib-modal-transclude="">',
            '<div class="modal-header">',
              (canClose ? '<button class="btn btn-default pull-right modal-close" type="button" onclick="document.getElementById(\'divErrorModal\').remove();">X</button>' : ''),
              '<h2 class="modal-title ">Error: ' + errName + '</h2>',
            '</div>',
            '<div class="modal-body ">',
              'An unexpected error has occurred. ' + dialogMessage + '<br>If you continue to face this issue, please contact the system administrator.',
              '<br><br>',
              'Click OK to return to the Home Page.',
              '<br>',
              '<span class="terminalError"><br>',
              '<pre  style="word-wrap: unset;">' + error.message + '<br><span style="padding-left:20px;">' + error.stack + '</span></pre>',
              '</span>',
            '</div>',
            '<div class="modal-footer">',
              '<button class="btn btn-danger" type="button" onclick=' + (redirectLink ? '"window.location.replace(\'' + redirectLink + '\');"' : '"document.getElementById(\'divErrorModal\').remove();"') + '>OK</button>',
            '</div>',
          '</div>',
        '</div>',
      '</div>',
      '<div class="modal-backdrop fade in" style="z-index: 1040;"></div>',
    ].join("");

    if (canClose) {
      var el = document.createElement('div');
      el.id = "divErrorModal";
      el.innerHTML = html;

      document.body.appendChild(el);
    } else {
      document.body.innerHTML = html;
    }

    ErrorHandler.errorVisible = true;
    ErrorHandler.logTerminalError(error);
  }

  /**
   * Log the given error as a terminal error
   * @param error
   * @param contextHeaderParams
   * @returns
   */
  static logTerminalError = function (error: Error, contextHeaderParams?: object) {
    if (!windowRef.ERMrest) return;
    var ermrestUri = (typeof windowRef.chaiseConfig != 'undefined' && windowRef.chaiseConfig.ermrestLocation ? windowRef.chaiseConfig.ermrestLocation : windowRef.location.origin + '/ermrest');

    if (!contextHeaderParams || typeof contextHeaderParams !== "object" &&
      typeof windowRef.dcctx === "object" && typeof windowRef.dcctx.contextHeaderParams === "object") {
      contextHeaderParams = windowRef.dcctx.contextHeaderParams;
    }

    windowRef.ERMrest.logError(error, ermrestUri, contextHeaderParams).then(function () {
      console.log("logged the error");
    }).catch(function (err: Error) {
      console.log("couldn't log the error.");
    });
  };
}
