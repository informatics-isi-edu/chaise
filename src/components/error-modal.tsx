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
import { ForbiddenAssetAccess, MultipleRecordError, UnauthorizedAssetAccess } from '@isrd-isi-edu/chaise/src/models/errors';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';

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
  const chaiseConfig = ConfigService.chaiseConfig;

  // only show the last thrown error
  const errorWrapper = errors[0];
  if (!errorWrapper) {
    return null;
  }
  const exception = errorWrapper.error;

  // ----------- map error to proper modal properties ------------------//
  const cc = ConfigService.chaiseConfig;
  let message = '', subMessage = '', clickActionMessage = '',
    showLogin = false, continueMessage = '', continueBtnText = '';

  let showOKBtn = false, showReloadBtn = false, showContinueBtn = false, showCloseBtn = false;

  /**
   * if it's a server or timeout error, we should show the reload button
   */
  showReloadBtn = (
    exception instanceof windowRef.ERMrest.NoConnectionError ||
    exception instanceof windowRef.ERMrest.TimedOutError ||
    exception instanceof windowRef.ERMrest.InternalServerError ||
    exception instanceof windowRef.ERMrest.ServiceUnavailableError
  );

  if (exception instanceof MultipleRecordError) {

  }


  //---------------------------- callbacks --------------------------------//
  const closeCallback = () => {
    hideError(errorWrapper);
  };

  const okCallback = () => {
    return;
  };

  const reloadCallback = () => {
    windowRef.location.reload();
  };

  const continueCallback = () => {
    return;
  };

  const login = () => {
    AuthnService.popupLogin(LogActions.LOGIN_ERROR_MODAL);
  };

  const toggleSubMessage = () => {
    setShowSubMessage((prev) => !prev);
  }

  return (
    <Modal
      className='error-modal'
      show={true}
      onHide={closeCallback}
    >
      <Modal.Header>
        <Modal.Title>{exception?.status ? exception.status : 'Terminal Error'}</Modal.Title>
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
        <DisplayValue value={{ isHTML: true, value: clickActionMessage }} internal />
        {showContinueBtn && <DisplayValue value={{ isHTML: true, value: continueMessage }} internal />}
        {subMessage &&
          <button
            className='chaise-btn chaise-btn-tertiary' id='toggle-error-details'
            onClick={() => toggleSubMessage()}
          >
            <i className={`fa-solid fa-caret-${showSubMessage ? 'down' : 'right'}`}></i>
            {showSubMessage ? MESSAGE_MAP.hideErrDetails : MESSAGE_MAP.showErrDetails}
          </button>
        }
        {showSubMessage &&
          <>
            <br />
            <pre id='error-details' style={{ wordWrap: 'unset' }}>{subMessage}</pre>
          </>
        }
      </Modal.Body>
      <Modal.Footer>
        <div className='error-modal-buttons'>
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
                type='button' onClick={() => reloadCallback()}
                className='chaise-btn chaise-btn-secondary footer-continue-btn' id='error-continue-button'
              >
                <span>{continueBtnText}</span>
              </button>
            </ChaiseTooltip>
          }
          {showCloseBtn &&
            <ChaiseTooltip
              tooltip='Dismiss the error.'
              placement='bottom-end'
            >
              <button
                type='button' onClick={() => reloadCallback()}
                className='chaise-btn chaise-btn-secondary modal-close'
              >
                <span>Close</span>
              </button>
            </ChaiseTooltip>
          }
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ErrorModal;
