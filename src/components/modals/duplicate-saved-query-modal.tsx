import Modal from 'react-bootstrap/Modal';

type DuplicateSavedQueryModalProps = { 
  tuple: any;
  onClose: ()=> void;
}

const DuplicateSavedQueryModal = ({
  onClose,
  tuple
}: DuplicateSavedQueryModalProps) => {

  const onHide = () => onClose();

  return (
    <Modal
      className='duplicate-saved-query'
      show={true}
      onHide={onHide}
    >
      <Modal.Header>
        <Modal.Title as='h2'>Duplicate Saved Search</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>A saved search with the same supplied filter criteria already exists with the name "{tuple.data.name}".</p>

        <p>Click "<b>Cancel</b>" to go back to the search interface. You may click <a href={tuple.reference.contextualize.entryEdit.appLink} target='_blank'>here</a> to modify the existing saved search name.</p>
      </Modal.Body>
      <Modal.Footer>
        <button
          // TODO: use a better id
          id='confirm-btn'
          className='chaise-btn chaise-btn-secondary'
          type='button'
          onClick={onHide}
        >
          Cancel
        </button>
      </Modal.Footer>
    </Modal>
  )
}

export default DuplicateSavedQueryModal;