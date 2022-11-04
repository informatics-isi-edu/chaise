import '@isrd-isi-edu/chaise/src/assets/scss/_export.scss';

import Modal from 'react-bootstrap/Modal';

type DeleteConfirmationModalProps = {
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
   * The confimration message
   */
   message?: JSX.Element;
  /**
   * button label prop
   */
  buttonLabel: string;
};

/**
 * returns Modal Component - Component that renders delete comfirmation dialog
 */
const DeleteConfirmationModal = ({ show, onConfirm, onCancel, message, buttonLabel }: DeleteConfirmationModalProps) => {
  const renderedMessage = message ? message : <>Are you sure you want to delete this record?</>;

  return (
    <Modal size='sm' show={show} onHide={onCancel}>
      <Modal.Header>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='modal-text'>{renderedMessage}</div>
      </Modal.Body>
      <Modal.Footer>
        <button
          id='delete-confirmation'
          className='chaise-btn chaise-btn-danger'
          onClick={onConfirm}
          type='button'
        >
          {buttonLabel}
        </button>
        <button
          className='chaise-btn chaise-btn-secondary'
          onClick={onCancel}
          type='button'
        >
          Cancel
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmationModal;
