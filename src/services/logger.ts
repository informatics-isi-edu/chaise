/**
 * Avoid using console directly and use this logger.
 *
 * later we can expand this to have more logic, and also have more methods
 * so we can suppress some of them in production mode.
 */

class Logger {
  private _enabled = true;

  public enable() {
    this._enabled = true;
  }

  public disable() {
    this._enabled = false;
  }

  info(...args: any[]): void {
    if (!this._enabled) return;
    console.info(...args);
  }

  log(...args: any[]): void {
    if (!this._enabled) return;
    console.log(...args);
  }

  warn(...args: any[]): void {
    if (!this._enabled) return;
    console.warn(...args);
  }

  error(...args: any[]): void {
    if (!this._enabled) return;
    console.error(...args);
  }

  debug(...args: any[]): void {
    if (!this._enabled) return;
    console.debug(...args);
  }
}

const $log = new Logger();

// TODO should this be bsased on NOD_ENV? or some other settings?
// $log.disable();

export default $log;
