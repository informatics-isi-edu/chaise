// components
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import Modal from 'react-bootstrap/Modal';

// models
import Recordedit, { RecordeditProps } from '@isrd-isi-edu/chaise/src/components/recordedit/recordedit';

export type RecordeditModalProps = {
  /**
   * The props that will be passed ot the recordset
   */
  recordeditProps: RecordeditProps,
  /**
   * The modal's class name
   */
  modalClassName?: string,
  /**
   * The modal's backdrop class name
   */
  modalBackdropClassName?: string,
  /**
   * The function that will be called on submit
   * Note: the modal won't close on submit and if that's the expected behavior,
   * you should do it in this callback.
   */
  onSubmitSuccess: () => void,
  /**
   * Whether we should show the submit spinner or not
   */
  showSubmitSpinner?: boolean,
  /**
   * The function that will be called when user clicks on "cancel" button
   * Note: the modal won't close by itself and if that's the expected behavior,
   * you should do it in this callback.
   */
  onClose: () => void
}

const RecordeditModal = ({
  recordeditProps,
  modalClassName = '',
  modalBackdropClassName = '',
  onSubmitSuccess,
  showSubmitSpinner,
  onClose
}: RecordeditModalProps) => {



  return (
    <Modal
      backdropClassName={`${modalBackdropClassName}`}
      className={`create-saved-query ${modalClassName}`}
      show={true}
      onHide={onClose}
    >
      {/* TODO: if we call onSubmitSuccess in here, we can show a spinner this way
      {showSubmitSpinner &&
        <div className='app-blocking-spinner-container'>
          <div className='app-blocking-spinner-backdrop'></div>
          <ChaiseSpinner className='modal-submit-spinner' message='Saving the changes...' />
        </div>
      } */}
      <Modal.Body>
        <Recordedit {...recordeditProps} />
      </Modal.Body>
    </Modal>
  )
};

export default RecordeditModal;