/**
 * Avoid using console directly and use this logger.
 *
 * later we can expand this to have more logic, and also have more methods
 * so we can suppress some of them in production mode.
 */

class Logger {
  info(message?: any, ...optionalParams: any[]): void {
    console.info(message, optionalParams);
  }

  log(message?: any, ...optionalParams: any[]): void {
    console.log(message, optionalParams);
  }

  warn(message?: any, ...optionalParams: any[]): void {
    console.warn(message, optionalParams);
  }

  error(message?: any, ...optionalParams: any[]): void {
    console.error(message, optionalParams);
  }

  debug(message?: any, ...optionalParams: any[]): void {
    console.debug(message, optionalParams);
  }
}

const $log = new Logger();

export default $log;
