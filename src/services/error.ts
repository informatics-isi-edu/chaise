import { windowRef } from '@chaise/utils/window-ref';
import $log from '@chaise/services/logger';
import { ConfigService } from '@chaise/services/config';

// TODO not used for now

export class ErrorService {
  static mapErrorToStateObject = (
    error: Error,
    isDismissible = false,
    skipLogging = false,
    // TODO we cannot pass the callback to the state
    //      because we only want serializable stuff in the state
  ) => {
    // TODO should be updated when we properly handle chaiseConfig
    const chaiseConfig = ConfigService.chaiseConfig;
  };

  /**
   * Log the given error as a terminal error
   * @param error
   * @param contextHeaderParams
   * @returns
   */
  static logTerminalError = (error: Error) => {
    if (!windowRef.ERMrest) return;
    const ermrestUri = ConfigService.chaiseConfig.ermrestLocation;
    windowRef.ERMrest.logError(error, ermrestUri, ConfigService.contextHeaderParams).then(() => {
      $log.log('logged the error');
    }).catch((err: any) => {
      $log.log('couldn\'t log the error.');
      $log.info(err);
    });
  };
}
