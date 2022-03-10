/**
 * Avoid using console directly and use this logger.
 *
 * later we can expand this to have more logic, and also have more methods
 * so we can suppress some of them in production mode.
 */

class Logger {
  info(message?: any, ...optionalParams: any[]): void {
    if (optionalParams.length > 0) {
      console.info(message, optionalParams);
    } else {
      console.info(message);
    }
  }

  log(message?: any, ...optionalParams: any[]): void {
    if (optionalParams.length > 0) {
      console.log(message, optionalParams);
    } else {
      console.log(message);
    }
  }

  warn(message?: any, ...optionalParams: any[]): void {
    if (optionalParams.length > 0) {
      console.warn(message, optionalParams);
    } else {
      console.warn(message);
    }
  }

  error(message?: any, ...optionalParams: any[]): void {
    if (optionalParams.length > 0) {
      console.error(message, optionalParams);
    } else {
      console.error(message);
    }
  }

  debug(message?: any, ...optionalParams: any[]): void {
    if (optionalParams.length > 0) {
      console.debug(message, optionalParams);
    } else {
      console.debug(message);
    }
  }
}

const $log = new Logger();

export default $log;
