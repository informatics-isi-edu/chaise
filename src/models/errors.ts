/* eslint max-classes-per-file: 0 */

import { errorNames, errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import AuthnService from '@isrd-isi-edu/chaise/src/services/authn';

// TODO eventually we might want to use this type instead of any
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
class ChaiseError {
  constructor(
    public status: string,
    public message: string,
    public subMessage: string = '',
    public clickOkToDismiss: boolean = false,

    // NOTE this should eventually be refactored
    // I didn't refactor it since it require ermrestjs change as well
    public errorData?: {
      /**
       * ُاThe redirect URL
       */
      redirectUrl?: string,
      gotoTableDisplayname?: string,

      /**
       * The message for the button
       */
      clickActionMessage?: string,

      /**
       * the text that will be displayed for the continue button
       */
      continueBtnText?: string,
      continueCB?: Function,
      continueMessage?: string,

      /**
       * the error stack
       */
      stack?: any
    }
  ) { }
}


/**
 * Custom errors thrown in any react apps that uses chaise
 */
export class CustomError extends ChaiseError {
  /**
   * CustomError - throw custom error from Apps outside Chaise.
   *
   * @param  {string} header              Header of the Error Modal         *
   * @param  {string} message             Error message to display in Modal body. Can include HTML tags.
   * @param  {string} redirectUrl         URL to redirect to on clicking ok.
   * @param  {string} clickActionMessage  Message to display for the OK button. Can include HTML tags.
   * @param  {string} clickOkToDismiss    Set true to dismiss the error modal on clicking the OK button
   */
  constructor(header: string, message: string, redirectUrl: string, clickActionMessage?: string, clickOkToDismiss?: boolean, subMessage?: string) {
    super(
      header,
      message,
      subMessage,
      clickOkToDismiss,
      {
        redirectUrl,
        clickActionMessage,
      }
    )
  }
}

/**
 * When the URI returns multiple records in record page
 */
export class MultipleRecordError extends ChaiseError {
  /**
   * multipleRecordError - throw in case of multiple records.
   *
   * @param  {string} redirectUrl  redirect to recordset app
   * @param  {string} message      Error message
   */
  constructor(tableDisplayName: string, redirectUrl: string, message?: string) {
    super(
      errorNames.multipleRecords,
      (message === undefined ? errorMessages.multipleDataMessage : message),
      undefined,
      false,
      {
        redirectUrl,
        gotoTableDisplayname: tableDisplayName,
        // TODO does this even make sense?
        stack: (new Error()).stack,
        clickActionMessage: MESSAGE_MAP.clickActionMessage.multipleRecords
      }
    );
  }
}

/**
 * When the URI returns empty set in record page
 */
export class NoRecordError extends ChaiseError {
  /**
   * noRecordError - In case URI returns empty set
   *
   * @param  {array} filters  Filters used during retrival of data
   * @param  {string} message Error message
   */
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

    super(
      errorNames.notFound,
      noDataMessage,
      undefined,
      false,
      {
        redirectUrl,
        gotoTableDisplayname: tableDisplayName,
        clickActionMessage: MESSAGE_MAP.clickActionMessage.noRecordsFound
      }
    );
  }
}

/**
 * When the Go to RID cannot find any erecords
 */
export class NoRecordRidError extends ChaiseError {
  /**
   * NoRecordRidError - In case resolveable link has invalid RID
   *
   * @param  {string} message Error message
   */
  constructor(message?: string) {
    super(
      errorNames.notFound,
      message || errorMessages.noDataMessage,
      undefined,
      true,
      {
        clickActionMessage: MESSAGE_MAP.clickActionMessage.dismissDialog
      }
    )
  }
}

/**
 * When the user tries to acces an asset when they are not authorized
 */
export class UnauthorizedAssetAccess extends ChaiseError {
  constructor() {
    super(
      MESSAGE_MAP.loginRequired,
      errorMessages.unauthorizedAssetRetrieval,
      undefined,
      true,
      {
        clickActionMessage: MESSAGE_MAP.clickActionMessage.loginOrDismissDialog
      }
    )
  }
}

/**
 * When the user tries to acces an asset when they are forbidden
 */
export class ForbiddenAssetAccess extends ChaiseError {

  constructor() {
    const authnRes = AuthnService.session;
    const userName = authnRes?.client.full_name || authnRes?.client.display_name || authnRes?.client.email || authnRes?.client.id;

    super(
      MESSAGE_MAP.permissionDenied,
      userName + errorMessages.forbiddenAssetRetrieval,
      undefined,
      true,
      {
        clickActionMessage: MESSAGE_MAP.clickActionMessage.dismissDialog
      }
    )
  }
}

/**
 * When a user logs , but the page's previous session was another user
 */
export class DifferentUserConflictError extends ChaiseError {
  constructor(sessionInfo: any, prevSessionInfo: any, continueCB?: Function) {
    let message, clickActionMessage, continueMessage, continueBtnText;

    let prevUser;
    if (prevSessionInfo.client.full_name) {
      prevUser = `<span class='no-word-break'>${prevSessionInfo.client.full_name} (${prevSessionInfo.client.display_name})</span>`;
    } else {
      prevUser = prevSessionInfo.client.display_name;
    }

    if (sessionInfo) {
      let currUser;
      if (sessionInfo.client.full_name) {
        currUser = `<span class='no-word-break'>${sessionInfo.client.full_name} (${sessionInfo.client.display_name})</span>`;
      } else {
        currUser = sessionInfo.client.display_name;
      }

      message = errorMessages.differentUserConflict1 + prevUser + errorMessages.differentUserConflict2 + currUser + '.';

      clickActionMessage = MESSAGE_MAP.clickActionMessage.continueMessageReload + currUser + '; or';

      continueMessage = MESSAGE_MAP.clickActionMessage.continueMessage1 + prevUser + MESSAGE_MAP.clickActionMessage.continueMessage2;

      continueBtnText = 'Continue';
    } else {
      message = errorMessages.anonUserConflict + prevUser + '.';

      clickActionMessage = MESSAGE_MAP.clickActionMessage.anonContinueMessageReload;

      continueMessage = MESSAGE_MAP.clickActionMessage.anonContinueMessage + prevUser + '.';

      continueBtnText = 'Login';
    }

    // NOTE: showReloadBtn and showContinueBtn are not needed as we can jsut
    //       determine that based on the error type
    super(
      MESSAGE_MAP.loginStatusChanged,
      message,
      undefined,
      false,
      {
        clickActionMessage,
        continueBtnText,
        continueMessage,
        continueCB
      }
    )
  }
}
