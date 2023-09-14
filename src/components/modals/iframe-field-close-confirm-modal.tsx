import Modal from 'react-bootstrap/Modal';

type IframeFieldCloseConfirmModalProps = {
  /**
   * prop to show modal
   */
  show: boolean;
  /**
   * prop to trigger on delete confirmation
   */
  onConfirm: () => void;
  /**
   * prop to trigger on cancel
   */
  onCancel: () => void;
  /**
   * The confirmation message
   */
  message?: JSX.Element;
};

/**
 * returns Modal Component - Component that renders delete comfirmation dialog
 */
const IframeFieldCloseConfirmModal = ({ show, onConfirm, onCancel, message }: IframeFieldCloseConfirmModalProps) => {


  const renderedMessage = message ? message : (
    <>
      <p>You are about to close the popup without setting any values (i.e. no change will be made to the record). Do you still want to proceed?</p>
      <p>To set the values, first click <b>Cancel</b> to dismiss this confirmation, then click the appropriate submit button in the popup.</p>
      <p>Click <b>OK</b> to close the popup without setting any values.</p>
    </>
  );

  return (
    <Modal
      className='confirm-iframe-close-modal'
      show={show}
      onHide={onCancel}
    >
      <Modal.Header>
        <Modal.Title>Confirm Close</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='modal-text'>{renderedMessage}</div>
      </Modal.Body>
      <Modal.Footer>
        <button
          className='chaise-btn chaise-btn-danger ok-button'
          onClick={onConfirm}
          type='button'
        >
          Ok
        </button>
        <button
          className='chaise-btn chaise-btn-secondary cancel-button'
          onClick={onCancel}
          type='button'
        >
          Cancel
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default IframeFieldCloseConfirmModal;
