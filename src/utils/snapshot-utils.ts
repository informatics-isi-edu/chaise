import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { dataFormats, APP_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

const moment = windowRef.moment;

/**
 * Takes a timestamp in the form of milliseconds since epoch and converts it into a relative string if
 * the timestamp is less than a week old. If more than a week old, the timestamp is displayed as just the date
 *
 * @param {number|string} datetimeValue - timestamp or any date presentation that moment accepts
 * @returns {string} either reltive time string or date in format YYYY-MM-DD
 */
export function humanizeTimestamp(datetimeValue: number | string) {
  const versionTS = moment(datetimeValue);
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
 * Takes a timestamp and returns the value in a proper display format
 */
export function displayTimestamp(datetimeValue: number | string) {
  return moment(datetimeValue).format(dataFormats.datetime.display);
}


/**
 * Given a location object, return the version in a date-time format
 * @param {ERMrest.Location} location - ERMrestJS locaction object
 * @returns {string} datetime in format YYYY-MM-DD hh:mm:ss
 */
export function getVersionDate(location: any) {
  return moment(location.versionAsISOString).format(dataFormats.datetime.display);
}

/**
 * Given a location object, return the humanize version
 * @param {ERMrest.Location} location - ERMrestJS locaction object
 * @returns {string} humanize version od version date
 */
export function getHumanizeVersionDate(location: any) {
  return humanizeTimestamp(location.versionAsISOString);
}

export function getLiveButtonTooltip() {
  const appName = ConfigService.appSettings.appName;
  if (appName === APP_NAMES.RECORD) {
    return MESSAGE_MAP.tooltip.liveData.record;
  } else if (appName === APP_NAMES.RECORDSET) {
    return MESSAGE_MAP.tooltip.liveData.recordset;
  }
  return '';
}


/**
 * returns null if there is no version correction, otherwise returns the appropriate alert message
 */
export function getVersionCorrectedAlertMessage(): string | null {
  if (!ConfigService.versionCorrected) return null;

  const prevVersion = ConfigService.versionCorrected.prevVersion;
  if (!prevVersion) return null;

  const prevDatetimeISO = ConfigService.ERMrest.HistoryService.snapshotToDatetimeISO(prevVersion, true);
  if (!prevDatetimeISO) return null;

  const currDateTimeISO = ConfigService.ERMrest.HistoryService.snapshotToDatetimeISO(ConfigService.catalogIDVersion, true);
  if (!currDateTimeISO) return null;

  const formattedDatetime = moment(prevDatetimeISO).format(dataFormats.datetime.display);

  const prev = moment(prevDatetimeISO);
  const curr = moment(currDateTimeISO);
  const duration = moment.duration(prev.diff(curr));
  const diff = duration.humanize() + (curr.isBefore(prev) ? ' prior' : ' later');

  return `Displaying the nearest available snapshot (${diff}) to the requested time of ${formattedDatetime}.`
}