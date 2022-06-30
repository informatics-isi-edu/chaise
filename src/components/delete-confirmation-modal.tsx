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
  onDeleteUnlinkConfirmation: (tuple: any, isUnlink: boolean) => void;
  /**
   * prop to trigger on cancel
   */
  onCancel: () => void;
  /**
   * tuple reference
   */
  tuple: any;
  /**
   * prop to determine unlink or delete
   */
  isUnlink: boolean;
};

/**
 * returns Modal Component - Component that renders delete comfirmation dialog
 */
const DeleteConfirmationModal = ({ show, onDeleteUnlinkConfirmation, onCancel, tuple, isUnlink }: DeleteConfirmationModalProps) => {
  return (
    <Modal show={show} onHide={onCancel} keyboard={false}>
      <Modal.Header>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='modal-text'>
          Are you sure you want to delete <DisplayValue value={tuple.displayname} />?
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className='chaise-btn chaise-btn-danger'
          variant='outline-primary'
          onClick={() => onDeleteUnlinkConfirmation(tuple, isUnlink)}
        >
          {isUnlink ? 'Unlink' : 'Delete'}
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
