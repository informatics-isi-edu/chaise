import '@isrd-isi-edu/chaise/src/assets/scss/_export.scss';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

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
        <Button
          className='chaise-btn chaise-btn-danger'
          variant='outline-primary'
          onClick={onConfirm}
        >
          {buttonLabel}
        </Button>
        <Button
          className='chaise-btn chaise-btn-secondary'
          variant='outline-primary'
          onClick={onCancel}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmationModal;
