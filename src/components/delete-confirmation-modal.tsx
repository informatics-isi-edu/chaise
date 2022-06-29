import '@isrd-isi-edu/chaise/src/assets/scss/_export.scss';

import { Button, Modal } from 'react-bootstrap';

type DeleteConfirmationModalProps = {
  /**
   * prop to show modal
   */
  show: boolean;
  /**
   * prop to trigger on delete confirmation
   */
  onDeleteConfirmation: () => void;
  /**
   * prop to trigger on cancel
   */
  onCancel: () => void;
};

/**
 * returns Modal Component - Component that renders delete comfirmation dialog
 */
const DeleteConfirmationModal = ({ show, onDeleteConfirmation, onCancel, ...props }: DeleteConfirmationModalProps) => {
  return (
    <Modal show={show} onHide={onCancel} keyboard={false}>
      <Modal.Header>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='modal-text'>{props && props.children}</div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className='chaise-btn chaise-btn-danger'
          variant='outline-primary'
          onClick={onDeleteConfirmation}
        >
          Delete
        </Button>
        <Button
          className='chaise-btn chaise-btn-secondary'
          variant='outline-primary'
          onClick={onCancel}
        >
          cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmationModal;
