import { useEffect, useRef, useState, type JSX } from 'react';
import { clickHref } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import Modal from 'react-bootstrap/Modal';

const COUNT_DOWN_SECONDS = 5;

type ExternalLinkModalProps = {
  /**
   * The external link
   */
  link: string,
  /**
   * what we should do if users attemp to close the modal
   * NOTE: this callback must handle closing the modal
   */
  onClose: () => void,
};

const ExternalLinkModal = ({
  link,
  onClose
}: ExternalLinkModalProps): JSX.Element => {
  const [counter, setCounter] = useState(COUNT_DOWN_SECONDS);

  const linkRef = useRef<any>(undefined);

  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Reduce the counter by 1 every second
   */
  useEffect(() => {
    interval.current = setInterval(() => {
      setCounter((counter) => counter - 1);
    }, 1000);

    return () => {
      stopCountDown();
    }
  }, []);

  /**
   * stop the countdown and go to link when countdown finishes
   */
  useEffect(() => {
    if (counter === 0) {
      linkRef.current.click();
      onHide();
    }
  }, [counter]);

  /**
   * make sure the timer is stopped
   */
  const stopCountDown = () => {
    if (interval.current) clearInterval(interval.current);
  };

  /**
   * when modal is closed
   */
  const onHide = () => {
    stopCountDown();
    onClose();
  }

  return (
    <Modal
      className='modal-redirect'
      size='sm'
      show={true}
      onHide={onHide}
    >
      <Modal.Header>
        <Modal.Title>External Link</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>The link you clicked will be opened in a new tab in {counter} seconds...</p>
        <p>Click <a ref={linkRef} href={link} target='_blank' rel='noreferrer' onClick={() => onHide()}>here</a> to open it now.</p>
      </Modal.Body>
      <Modal.Footer>
        <button
          className='chaise-btn chaise-btn-secondary'
          type='button'
          onClick={onHide}
        >
          Cancel
        </button>
      </Modal.Footer>
    </Modal >
  )
}

export default ExternalLinkModal;
