/**
 * Avoid using console directly and use this logger.
 *
 * later we can expand this to have more logic, and also have more methods
 * so we can suppress some of them in production mode.
 */

export enum LoggerLevels {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  LOG = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5
}

class Logger {
  private _level = LoggerLevels.INFO;

  private isAllowed(level: LoggerLevels): boolean {
    return this._level <= level;
  }

  public enableAll() {
    this._level = LoggerLevels.TRACE;
  }

  public disableAll() {
    this._level = LoggerLevels.SILENT;
  }

  public setLevel(level: LoggerLevels) {
    this._level = level;
  }

  public trace(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.TRACE)) return;
    console.trace(...args);
  }

  public debug(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.DEBUG)) return;
    console.debug(...args);
  }

  public info(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.INFO)) return;
    console.info(...args);
  }

  public log(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.LOG)) return;
    console.log(...args);
  }

  public warn(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.WARN)) return;
    console.warn(...args);
  }

  public error(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.ERROR)) return;
    console.error(...args);
  }

}

const $log = new Logger();

$log.setLevel(LoggerLevels.INFO);

export default $log;
