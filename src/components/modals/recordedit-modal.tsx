// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Modal from 'react-bootstrap/Modal';
import Title from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useRef } from 'react';

// models
import Recordedit, { RecordeditProps } from '@isrd-isi-edu/chaise/src/components/recordedit/recordedit';

export type RecordeditModalProps = {
  /**
   * The props that will be passed ot the recordset
   */
  recordeditProps: RecordeditProps,
  /**
   * The reference of the main page for use in edit modal title
   * NOTE: currently the reference used for the recordset page
   */
  parentReference: any,
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
   * The function that will be called when user clicks on "cancel" button
   * Note: the modal won't close by itself and if that's the expected behavior,
   * you should do it in this callback.
   */
  onClose: () => void
}

const RecordeditModal = ({
  recordeditProps,
  parentReference,
  modalClassName = '',
  modalBackdropClassName = '',
  onSubmitSuccess,
  onClose
}: RecordeditModalProps) => {

  const modalContainer = useRef<any>(null);
  const modalHeader = useRef<HTMLDivElement>(null);

  // get the modal elements based on the available ref
  const modalContainerEl = modalContainer.current ? modalContainer.current.dialog.querySelector('.modal-content') as HTMLDivElement : undefined;
  const modalHeaderEl = modalHeader.current ? modalHeader.current : undefined;

  const submitRecordeditModal = () => {
    
    // TODO: call form submit from recordedit provider

    // callback to here that call onSubmitSuccess()
  }

  return (
    <Modal
      backdropClassName={`${modalBackdropClassName}`}
      className={`create-saved-query ${modalClassName}`}
      show={true}
      onHide={onClose}
      ref={modalContainer}
    >
      <Modal.Header ref={modalHeader}>
        <div className='top-panel-container'>
          {/* TODO: alerts? */}
          <div className='top-flex-panel'>
            <div className='top-left-panel close-panel'></div>
            <div className='top-right-panel'>
              <div className='recordedit-title-container title-container meta-icons'>
                <div className='saved-query-controls recordedit-title-buttons title-buttons'>
                  <ChaiseTooltip
                    placement='bottom'
                    tooltip='Save the current search criteria'
                  >
                    <button
                      id='modal-submit-record-btn' 
                      className='chaise-btn chaise-btn-primary'
                      type='button' 
                      onClick={submitRecordeditModal}
                    >
                      <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
                      <span>Save</span>
                    </button>
                  </ChaiseTooltip>
                  <ChaiseTooltip
                    placement='bottom'
                    tooltip='Close the dialog'
                  >
                    <button
                      className='chaise-btn chaise-btn-secondary pull-right modal-close' type='button'
                      onClick={() => onClose()}
                    >
                      <strong className='chaise-btn-icon'>X</strong>
                      <span>Close</span>
                    </button>
                  </ChaiseTooltip>
                </div>
                <h2 className='modal-title'>
                  {/* NOTE: currently only used for saved queries. Turn into configuration param if reused */}
                  <span>Save current search criteria for table </span>
                  <Title reference={parentReference} />
                </h2>
              </div>
            </div>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <Recordedit {...recordeditProps} />
      </Modal.Body>
    </Modal>
  )
};

export default RecordeditModal;