import ConfirmationModal from '@isrd-isi-edu/chaise/src/components/modals/confirmation-modal';

type DeleteConfirmationModalProps = {
  /**
   * prop to show modal
   */
  show: boolean;
  /**
   * prop to trigger on delete confirmation
   */
  onConfirm: () => void;
  /**
   * prop to trigger on cancel
   */
  onCancel: () => void;
  /**
   * The confirmation message
   */
  message?: JSX.Element;
  /**
   * button label prop
   */
  buttonLabel: string;
  /**
   * The modal title
   */
  title?: string;
};

/**
 * returns Modal Component - Component that renders delete comfirmation dialog
 */
const DeleteConfirmationModal = ({ show, onConfirm, onCancel, message, buttonLabel, title }: DeleteConfirmationModalProps) => {
  const renderedMessage = message ? message : <>Are you sure you want to delete this record?</>;


  return (
    <ConfirmationModal
      modalClassName='confirm-delete-modal'
      show={show}
      onConfirm={onConfirm}
      onCancel={onCancel}
      title={title ? title : 'Confirm Delete'}
      message={renderedMessage}
      buttonLabel={buttonLabel}
    />
  );
};

export default DeleteConfirmationModal;
