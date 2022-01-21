import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

interface ChaiseModalProps {
  title: JSX.Element,
  body: JSX.Element,
  footer: JSX.Element,
  size?: 'sm' | 'lg' | 'xl',
  show: boolean,
  onHide?: Function
}

const ChaiseModal = ({
  title,
  body,
  footer,
  size,
  show,
  onHide
}: ChaiseModalProps): JSX.Element => {
  return (
    <Modal
      size={size}
      show={show}
      onHide={onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {body}
      </Modal.Body>

      {footer &&
        <Modal.Footer>
          {footer}
        </Modal.Footer>
      }
    </Modal>
  );
};

export default ChaiseModal;
