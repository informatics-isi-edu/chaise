import { Button, Modal } from 'react-bootstrap';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';

type ExportModalProps = {
  /**
   * prop to set export modal title
   */
  title: string;
  /**
   * prop to show modal
   */
  show: boolean;
  /**
   * prop to close modal
   */
  closeModal: () => void;
};

/**
 * returns Modal Component - Component that renders progress modal dialog
 */
const ExportModal = ({ title, show, closeModal }: ExportModalProps) => {
  /**
   * move the modal down so navbar is visible
   */
  const moveModal = (node: HTMLElement) => {
    const mainnav = document.querySelector('#navheader') as HTMLElement;
    if (!mainnav) return;

    node.style.top = `${mainnav.offsetHeight}px`;

    // if the size of navbar changed, change the offset
    new ResizeSensor(mainnav, () => {
      node.style.top = `${mainnav.offsetHeight}px`;
    });
  };

  return (
    <Modal
      className='export-progress'
      backdropClassName='export-progress-backdrop'
      show={show}
      onHide={closeModal}
      onEntered={moveModal}
      backdrop='static'
      keyboard={false}
    >
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='modal-text'>Your request is being processed...</div>
        <div className='modal-text'>
          You will be prompted to download the file when it is ready.
        </div>
        <div className='progress'>
          <div
            className='progress-bar progress-bar-striped active'
            aria-valuenow={100}
            aria-valuemax={100}
            style={{ width: '100%' }}
          ></div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className='chaise-btn chaise-btn-secondary'
          variant='outline-primary'
          onClick={closeModal}
        >
          cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ExportModal;
