import Modal from 'react-bootstrap/Modal';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';


const LoginModal = (): JSX.Element => {
  const { dispatchError, loginModal, closeLoginModal } = useError();
  const { popupLogin } = useAuthn();

  const login = () => popupLogin(LogActions.LOGIN_LOGIN_MODAL);
  // TODO: Call closeLoginModal to process any attached callbacks
  //    This wasn't working properly in angularJS where this callback would be ignored when the modal popup login was being shown
  // const login = () => popupLogin(LogActions.LOGIN_LOGIN_MODAL, () => { closeLoginModal('login') });

  const cancel = () => closeLoginModal('cancel');

  if (!loginModal) return <></>

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
