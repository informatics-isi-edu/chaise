import { useState } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import Modal from 'react-bootstrap/Modal';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import AuthnService from '@isrd-isi-edu/chaise/src/services/authn';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import {
  ChaiseError, CustomError, DifferentUserConflictError, ForbiddenAssetAccess,
  NoRecordError, NoRecordRidError, UnauthorizedAssetAccess
} from '@isrd-isi-edu/chaise/src/models/errors';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';

function isErmrestErrorNeedReplace(error: any) {
  switch (error.constructor) {
    case windowRef.ERMrest.InvalidFacetOperatorError:
    case windowRef.ERMrest.InvalidPageCriteria:
    case windowRef.ERMrest.InvalidSortCriteria:
      return true;
    default:
      return false;
  }
}

const ErrorModal = (): JSX.Element | null => {
  const { errors, hideError, logTerminalError } = useError();
  const [showSubMessage, setShowSubMessage] = useState(false);
  const cc = ConfigService.chaiseConfig;

  // only show the first thrown error
  const errorWrapper = errors[0];
  if (!errorWrapper) {
    return null;
  }
  const exception = errorWrapper.error;
  const errorStatus = exception.status ? exception.status : 'Terminal Error';
  const isDismissibleError = (errorWrapper.isDismissible || exception.clickOkToDismiss);

  const isUnknownErrorType = !(
    exception instanceof windowRef.ERMrest.ERMrestError ||
    exception instanceof CustomError ||
    exception instanceof ChaiseError
  );

  // log the terminal errors
  if (!errorWrapper.skipLogging && (
    exception instanceof windowRef.ERMrest.InvalidServerResponse ||
    exception instanceof CustomError ||
    isUnknownErrorType
  )) {
    logTerminalError(exception);
  }

  // ----------- map error to proper modal properties ------------------//

  const showLogin = !AuthnService.session && !(
    exception instanceof DifferentUserConflictError
  );

  // ---------------- message, submessage, and pageName ---------------//

  let pageName = exception.errorData?.gotoTableDisplayname ? exception.errorData?.gotoTableDisplayname : 'Home Page',
    redirectLink = exception.errorData?.redirectUrl ? exception.errorData?.redirectUrl : cc.dataBrowser,
    subMessage = (exception.subMessage ? exception.subMessage : undefined),
    stackTrace = ((exception.errorData && exception.errorData.stack) ? exception.errorData.stack : undefined),
    message = exception.message || ''; // initialize message to empty string if not defined


  // invalid server response should be treated the same as terminal
  if (exception instanceof windowRef.ERMrest.InvalidServerResponse) {
    message = errorMessages.systemAdminMessage;
    subMessage = exception.message;
  }
  // the raw conflict error message is not readable by users,
  // so we're going to show a terminal error instead
  // NOTE we might want to do the same thing for all the other ermrest HTTP errors
  else if (exception instanceof windowRef.ERMrest.ConflictError &&
    !(
      exception instanceof windowRef.ERMrest.IntegrityConflictError ||
      exception instanceof windowRef.ERMrest.DuplicateConflictError
    )
  ) {
    message = errorMessages.systemAdminMessage;
  }
  // "terminal" errors (non-chaise, non-ermrestjs, non-custom)
  else if (isUnknownErrorType) {
    message = errorMessages.systemAdminMessage;
    subMessage = exception.message;
  }

  // There's no message
  if (message.trim().length < 1) message = errorMessages.systemAdminMessage;

  /**
   * if user is not logged in add info that they might need to login
   */
  if (!AuthnService.session) {
    if (exception instanceof NoRecordError || exception instanceof NoRecordRidError) {
      // if no logged in user, change the message
      const messageReplacement = (exception instanceof NoRecordError ? MESSAGE_MAP.noRecordForFilter : MESSAGE_MAP.noRecordForRid);
      message = messageReplacement + '<br>' + MESSAGE_MAP.maybeUnauthorizedMessage;
    } else {
      message += ' ' + MESSAGE_MAP.maybeNeedLogin;
    }
  }

  //  TODO
  // const isFirefox = typeof InstallTrigger !== 'undefined';
  // const isChrome = !!window.chrome && !!window.chrome.webstore;
  // // If browser is chrome then use stack trace which has "Error"  appended before the trace
  // // Else append subMessage before the trace to complete the message as FF does not generate sufficient error text
  // if (stackTrace) {
  //     subMessage = (subMessage && !isChrome) ? (subMessage + "\n   " + stackTrace.split("\n").join("\n   ")) : stackTrace;
  // }


  // --------------- the click action message -------------------//
  let clickActionMessage = exception.errorData?.clickActionMessage;
  if (!isStringAndNotEmpty(clickActionMessage)) {
    if (exception instanceof windowRef.ERMrest.InvalidFilterOperatorError) {
      clickActionMessage = MESSAGE_MAP.clickActionMessage.noRecordsFound;
    } else if (exception instanceof windowRef.ERMrest.UnsupportedFilters) {
      clickActionMessage = MESSAGE_MAP.clickActionMessage.unsupportedFilters;
    } else if (isErmrestErrorNeedReplace(exception)) {
      clickActionMessage = MESSAGE_MAP.clickActionMessage.messageWReplace.replace('@errorStatus', errorStatus);
    } else if (!isDismissibleError) {
      clickActionMessage = `${MESSAGE_MAP.clickActionMessage.pageRedirect}${pageName}. `;
    }
  }

  /**
   * hide the ok button only in the following cases:
   *   - different user conflict
   *   - batch unlink
   *   - when error is dismissible
   */
  const showOKBtn = (
    !(
      exception instanceof DifferentUserConflictError ||
      exception instanceof windowRef.ERMrest.BatchUnlinkResponse
    ) &&
    !(isDismissibleError)
  );

  /**
   * show reload button if:
   *  - it's a server or timeout error, we should show the reload button
   *  - the different user conflict error
   */
  const showReloadBtn = (
    exception instanceof windowRef.ERMrest.NoConnectionError ||
    exception instanceof windowRef.ERMrest.TimedOutError ||
    exception instanceof windowRef.ERMrest.InternalServerError ||
    exception instanceof windowRef.ERMrest.ServiceUnavailableError ||
    exception instanceof DifferentUserConflictError
  );

  /**
   * whether we should show the continue button or not.
   */
  const showContinueBtn = (typeof exception.contineBtnText === 'string' && typeof exception.errorData?.continueCB === 'function');

  /**
   * show close button based on:
   *  - chaise config (allowErrorDismissal)
   *  - the dispatcher (isDismissible)
   *  - the error object (clickOkToDismiss)
   *  - batch unlink (NOTE we might want to improve this later by having clickOkToDismiss in ermrestjs)
   */
  const showCloseBtn = (
    cc.allowErrorDismissal || isDismissibleError ||
    (exception instanceof windowRef.ERMrest.BatchUnlinkResponse)
  );

  //---------------------------- callbacks --------------------------------//
  const okCallback = () => {
    hideError(errorWrapper);
    if (errorWrapper.okBtnCallback) {
      errorWrapper.okBtnCallback();
    } else {
      windowRef.location = redirectLink;
    }
  };

  const reloadCallback = () => {
    windowRef.location.reload();
  };

  const continueCallback = () => {
    hideError(errorWrapper);
    exception.errorData?.continueCB();
  };

  const closeCallback = () => {
    hideError(errorWrapper);
    if (errorWrapper.closeBtnCallback) {
      errorWrapper.closeBtnCallback();
    }
  };

  const login = () => {
    AuthnService.popupLogin(LogActions.LOGIN_ERROR_MODAL);
  };

  const toggleSubMessage = () => {
    setShowSubMessage((prev) => !prev);
  }

  return (
    <Modal
      className='modal-error'
      scrollable
      show={true}
      onHide={closeCallback}
      // mark the modal as static if the error cannot be dismissed
      {... (!showCloseBtn && { backdrop: 'static', keyboard: false })}
    >
      <Modal.Header>
        <Modal.Title as='h2'>{errorStatus}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <DisplayValue value={{ isHTML: true, value: message }} internal />
        {showLogin &&
          <span><a id='error-modal-login-link' onClick={() => login()}> Please login</a> to continue.</span>
        }
        {
          ((exception instanceof UnauthorizedAssetAccess || exception instanceof ForbiddenAssetAccess) &&
            isStringAndNotEmpty(cc.assetDownloadPolicyURL)) &&
          <span>The download instructions can be found <a id='download-policy-link' href={cc.assetDownloadPolicyURL}>here</a>.</span>
        }
        <br />
        <br />
        <div>
          {clickActionMessage && <DisplayValue value={{ isHTML: true, value: clickActionMessage }} internal />}
        </div>
        {subMessage &&
          <button
            className='chaise-btn chaise-btn-tertiary toggle-error-details' id='toggle-error-details'
            onClick={() => toggleSubMessage()}
          >
            <i className={`fa-solid fa-caret-${showSubMessage ? 'down' : 'right'}`}></i>
            {showSubMessage ? MESSAGE_MAP.hideErrDetails : MESSAGE_MAP.showErrDetails}
          </button>
        }
        {showSubMessage &&
          <pre id='error-details' style={{ wordWrap: 'unset' }}>{subMessage}</pre>
        }
      </Modal.Body>
      <Modal.Footer>
        {showOKBtn &&
          <button
            type='button' onClick={() => okCallback()}
            className='chaise-btn chaise-btn-danger' id='error-ok-button'
          >
            <span>OK</span>
          </button>
        }
        {showReloadBtn &&
          <ChaiseTooltip
            tooltip='Reload the page and try again.'
            placement='bottom-end'
          >
            <button
              type='button' onClick={() => reloadCallback()}
              className='chaise-btn chaise-btn-secondary' id='error-reload-button'
            >
              <span>Reload</span>
            </button>
          </ChaiseTooltip>
        }
        {showContinueBtn &&
          <ChaiseTooltip
            tooltip='Continue as original user.'
            placement='bottom-end'
          >
            <button
              type='button' onClick={() => continueCallback()}
              className='chaise-btn chaise-btn-secondary footer-continue-btn' id='error-continue-button'
            >
              <span>{exception.contineBtnText}</span>
            </button>
          </ChaiseTooltip>
        }
        {showCloseBtn &&
          <ChaiseTooltip
            tooltip='Dismiss the error.'
            placement='bottom-end'
          >
            <button
              type='button' onClick={() => closeCallback()}
              className='chaise-btn chaise-btn-secondary modal-close'
            >
              <span>Close</span>
            </button>
          </ChaiseTooltip>
        }
      </Modal.Footer>
    </Modal>
  );
};

export default ErrorModal;
