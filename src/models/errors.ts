/* eslint max-classes-per-file: 0 */

import { errorNames, errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';

interface ChaiseERMrestJSError {
  /**
   * the error header
   */
  status: string;
  /**
   * whats displayed in the body
   */
  message: string;
  /**
   * what's displayed in the details
   */
  subMessage?: string;

  errorData?: {
    // in ermrestjs
    redirectPath?: string;

    redirectUrl?: string;
    gotoTableDisplayname?: string;
  }
}

interface ChaiseErrorParameters {
  status: string;
  message: string;
  redirectUrl?: string;
  gotoTableDisplayname?: string
}
class ChaiseError {
  /**
   * @type {string}
   * @desc   Error message status; acts as Title text for error dialog
   */
  status = '';

  /**
   * @type {string}
   * @desc   Error message
   */
  message: string;

  /**
   * @type {string}
   * @desc URL that redirects users to recordset app
   */
  redirectUrl?: string;

  gotoTableDisplayname?: string;

  constructor(params: ChaiseErrorParameters) {
    this.status = params.status;
    this.message = params.message;

    this.redirectUrl = params.redirectUrl;
    this.gotoTableDisplayname = params.gotoTableDisplayname;
  }
}

/**
 * When the URI returns multiple records in record page
 */
export class MultipleRecordError extends ChaiseError {
  constructor(tableDisplayName: string, redirectUrl: string, message?: string) {
    super({
      status: errorNames.multipleRecords,
      message: (message === undefined ? errorMessages.multipleDataMessage : message),
      redirectUrl,
      gotoTableDisplayname: tableDisplayName,
    });
  }
}

/**
 * When the URI returns empty set in record page
 */
export class NoRecordError extends ChaiseError {
  constructor(filters: any, tableDisplayName: string, redirectUrl: string, message: string) {
    let noDataMessage = (message === undefined) ? errorMessages.noDataMessage : message;
    if (filters) {
      for (let k = 0; k < filters.length; k++) {
        noDataMessage += filters[k].column + filters[k].operator + filters[k].value;
        if (k != filters.length - 1) {
          noDataMessage += ' or ';
        }
      }
    }

    super({
      status: errorNames.notFound,
      message: noDataMessage,
      redirectUrl,
      gotoTableDisplayname: tableDisplayName,
    });
  }
}
