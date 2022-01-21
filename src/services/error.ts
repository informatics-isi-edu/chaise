import { windowRef } from '@chaise/utils/window-ref'

// TODO not used for now

export class ErrorHandler {

  static mapErrorToStateObject = (
    error: Error,
    isDismissible: boolean = false,
    skipLogging: boolean = false
    // TODO we cannot pass the callback to the state
    //      because we only want serializable stuff in the state
  ) => {
    // TODO should be updated when we properly handle chaiseConfig
    let chaiseConfig = windowRef.chaiseConfig;
  }

  /**
   * Log the given error as a terminal error
   * @param error
   * @param contextHeaderParams
   * @returns
   */
  static logTerminalError = (error: Error, contextHeaderParams?: object) => {
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
