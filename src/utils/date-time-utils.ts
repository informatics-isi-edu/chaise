import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';

const moment = windowRef.moment;

/**
 * Takes a timestamp in the form of milliseconds since epoch and converts it into a relative string if
 * the timestamp is less than a week old. If more than a week old, the timestamp is displayed as just the date
 *
 * @param {number|string} tsMillis - a timestamp in milliseconds
 * @returns {string} either reltive time string or date in format YYYY-MM-DD
 */
export function humanizeTimestamp(tsMillis: number | string) {
  const versionTS = moment(tsMillis);
  const weekAgo = moment().subtract(7, 'days').startOf('day');
  // if version is < a week old
  if (versionTS.isAfter(weekAgo)) {
    // find the difference between version and now (will be represented as a negative)
    const timeDiff = versionTS.diff(moment());
    // convert to a negative duration and humanize as if it's from the past
    return moment.duration(timeDiff).humanize(true);
  }

  return versionTS.format(dataFormats.date);
}


/**
 * Given a location object, return the version in a date-time format
 * @param {ERMrest.Location} location - ERMrestJS locaction object
 * @returns {string} datetime in format YYYY-MM-DD hh:mm:ss
 */
export function getVersionDate(location: any) {
  return moment(location.versionAsMillis).format(dataFormats.datetime.display);
}

/**
 * Given a location object, return the humanize version
 * @param {ERMrest.Location} location - ERMrestJS locaction object
 * @returns {string} humanize version od version date
 */
export function getHumanizeVersionDate(location: any) {
  return humanizeTimestamp(location.versionAsMillis);
}
