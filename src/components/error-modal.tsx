import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import Modal from 'react-bootstrap/Modal';

const ErrorModal = (): JSX.Element | null => {
  const { error, hideError } = useError();

  const handleClose = () => {
    hideError();
  };

  if (!error) {
    return null;
  }

  // the logic to do something differently based on the error

  return (
    <Modal
      className='error-modal'
      show={true}
      onHide={handleClose}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {error.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div>
          {error.message}
          {' '}
          {error.isGlobal ? '(caught by global catch-all)' : ''}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ErrorModal;
