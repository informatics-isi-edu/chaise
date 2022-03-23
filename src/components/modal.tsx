import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

interface ChaiseModalProps {
  title: JSX.Element,
  body: JSX.Element,
  contentClassName?: string
  footer: JSX.Element,
  size?: 'sm' | 'lg' | 'xl',
  show: boolean,
  onHide?: Function,
}

/**
 *  NOTES: Modal.Title 
 *    - either change "title" to expect Modal.Title element or Modal.Header element
 *    - Modal.Title should be "h2"
 *    - TODO: close button is not configurable
 *    - TODO: title text can't be centered
 *    - change to something like: 
 *    <Modal.Header style={{ 'flex': 'unset'}}>
 *      <Modal.Title as='h2'>{title}</Modal.Title>
 *      <button className='modal-close-absolute pull-right'>
 *        <strong class="chaise-btn-icon">X</strong>
 *        <span>Close</span>
 *      </button>
 *    </Modal.Header>
 */
const ChaiseModal = ({
  title,
  body,
  contentClassName,
  footer,
  size,
  show,
  onHide,
}: ChaiseModalProps): JSX.Element => (
  <Modal
    contentClassName={contentClassName}
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

    {footer
        && (
        <Modal.Footer>
          {footer}
        </Modal.Footer>
        )}
  </Modal>
);

export default ChaiseModal;
