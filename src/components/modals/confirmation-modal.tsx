import Modal from 'react-bootstrap/Modal';

import type { JSX } from 'react';

type ConfirmationModalProps = {
  /**
   * the modal class name
   */
  modalClassName?: string;
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
  message: JSX.Element;
  /**
   * button label prop
   */
  buttonLabel?: string;
  /**
   * The modal title
   */
  title?: string;
};

const ConfirmationModal = ({
  show, onConfirm, onCancel, message, title, buttonLabel, modalClassName
}: ConfirmationModalProps) => {

  return (
    <Modal
      scrollable
      className={modalClassName}
      show={show}
      onHide={onCancel}
    >
      <Modal.Header>
        <Modal.Title>{title ? title : 'Confirm'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='modal-text'>{message}</div>
      </Modal.Body>
      <Modal.Footer>
        <button
          className='chaise-btn chaise-btn-danger ok-button'
          onClick={onConfirm}
          type='button'
        >
          {buttonLabel ? buttonLabel : 'Ok'}
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

export default ConfirmationModal;
