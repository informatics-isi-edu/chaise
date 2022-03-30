import React from 'react';
import ChaiseModal from '@chaise/components/modal';
import { useAppSelector, useAppDispatch } from '@chaise/store/hooks';
import { RootState } from '@chaise/store/store';
import { hideError } from '@chaise/store/slices/error';
import useError from '@chaise/hooks/error';
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
      contentClassName={'error-modal'}
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
