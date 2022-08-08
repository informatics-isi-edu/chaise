import Modal from 'react-bootstrap/Modal';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';


const LoginModal = (): JSX.Element => {
  const { dispatchError, loginModal, hideLoginModal } = useError();
  const { popupLogin } = useAuthn();

  const login = () => {
    // TODO
    popupLogin(LogActions.LOGIN_LOGIN_MODAL, loginModal?.onModalCloseSuccess);
  };

  const cancel = () => {
    if (loginModal?.onModalClose) {
      loginModal?.onModalClose('cancel');
    } else {
      hideLoginModal();
      // TODO needs discussion
      // https://github.com/informatics-isi-edu/chaise/issues/2091#issuecomment-868144407
      dispatchError({ error: new Error('You cannot proceed without logging in.') })
    }
  };

  if (!loginModal) {
    return <></>;
  }

  return (
    <Modal
      className='modal-login-instruction'
      backdropClassName='modal-login-instruction-backdrop'
      show={true}
      backdrop='static'
      keyboard={false}
    >
      <Modal.Header>
        <Modal.Title as='h2'>{loginModal.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <button className='chaise-btn chaise-btn-primary' type='button' onClick={() => login()}>
          <span className='chaise-btn-icon fa-solid fa-right-to-bracket'></span>
          <span>Login</span>
        </button>
        <button className='chaise-btn chaise-btn-secondary modal-close' type='button' onClick={() => cancel()}>
          <strong className='chaise-btn-icon'>X</strong>
          <span>Cancel</span>
        </button>
      </Modal.Body>
    </Modal>
  )
}

export default LoginModal;
