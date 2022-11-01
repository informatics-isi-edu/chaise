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
   * The confirmation message
   */
  message?: JSX.Element;
  /**
   * button label prop
   */
  buttonLabel: string;
  /**
   * The modal title
   */
  title?: string;
};

/**
 * returns Modal Component - Component that renders delete comfirmation dialog
 */
const DeleteConfirmationModal = ({ show, onConfirm, onCancel, message, buttonLabel, title }: DeleteConfirmationModalProps) => {
  const renderedMessage = message ? message : <>Are you sure you want to delete this record?</>;

  return (
    <Modal 
      className='confirm-delete-modal' 
      size='sm' 
      show={show} 
      onHide={onCancel}
    >
      <Modal.Header>
        <Modal.Title>{title ? title : 'Confirm Delete'}</Modal.Title>
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
