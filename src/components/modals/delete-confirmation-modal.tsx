import ConfirmationModal from '@isrd-isi-edu/chaise/src/components/modals/confirmation-modal';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

export enum DeleteConfirmationModalTypes {
  RECORD_MAIN = 'record-main',
  BULK = 'bulk',
  SINGLE = 'single'
}

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
  buttonLabel?: string;
  /**
   * The modal title
   */
  title?: string;
  /**
   * the reference that will be deleted. used for generating more info about cascading tables
   */
  reference?: any;
  /**
   * where this is used. used for the csadaing info
   */
  context: DeleteConfirmationModalTypes
};

/**
 * returns Modal Component - Component that renders delete comfirmation dialog
 */
const DeleteConfirmationModal = ({
  show, onConfirm, onCancel, message, buttonLabel, title, reference, context
}: DeleteConfirmationModalProps) => {
  let renderedMessage = message ? message : <>Are you sure you want to delete this record?</>;

  if (reference && Array.isArray(reference.cascadingDeletedItems) && reference.cascadingDeletedItems.length > 0) {

    let tableIconUsed = false;
    const tableIcon = <sup className='noted-table-icon'>†</sup>;

    const tableSummary: JSX.Element[] = [];
    reference.cascadingDeletedItems.forEach((curr: any, currIndex: number, arr: any[]) => {
      const useTableIcon = (context === DeleteConfirmationModalTypes.RECORD_MAIN && curr.constructor.name !== 'Reference');
      if (useTableIcon) tableIconUsed = true;

      // the table/reference displayname
      tableSummary.push(
        <span key={currIndex}>
          <code><DisplayValue value={curr.displayname} /></code>
          {useTableIcon ? tableIcon : <></>}
        </span>
      );

      // separator
      if (currIndex < arr.length - 1) {
        if (currIndex !== arr.length - 2) {
          tableSummary.push(<span key={`${currIndex}-separator`}>, </span>);
        } else {
          tableSummary.push((arr.length !== 2) ?
            <span key={`${currIndex}-separator`}>, and </span> :
            <span key={`${currIndex}-separator`}> and </span>
          );
        }
      }
    });

    let cascadingInfo;
    switch (context) {
      case DeleteConfirmationModalTypes.RECORD_MAIN:
        cascadingInfo = <p>
          Check the related records that are going to be deleted from the relavant sections in the side panel.
          {tableIconUsed && <>Some of the affected tables (denoted by {tableIcon}) might not be visible in the side panel.</>}
        </p>;
        break;
      case DeleteConfirmationModalTypes.BULK:
        cascadingInfo = <p>
          Navigate to the individual record detail pages to check the related records that may be affected.
        </p>;
      case DeleteConfirmationModalTypes.SINGLE:
        const recordLink = <a target='blank' href={reference.contextualize.detailed.appLink}>this record detailed page</a>;
        cascadingInfo = <p>
          Navigate to {recordLink} to check the related records that may be affected.
        </p>;
        break;
    }

    const itemName = context === DeleteConfirmationModalTypes.RECORD_MAIN ? 'tables/sections' : 'tables';
    renderedMessage = (
      <>
        {renderedMessage}
        <br />
        <br />
        <p>
          This may also delete related records in the following {reference.cascadingDeletedItems.length} {itemName}: {tableSummary}
        </p>
        {cascadingInfo}
      </>
    );
  }

  const renderedBtnLabel = buttonLabel ? buttonLabel : 'Delete';

  return (
    <ConfirmationModal
      modalClassName='confirm-delete-modal'
      show={show}
      onConfirm={onConfirm}
      onCancel={onCancel}
      title={title ? title : 'Confirm Delete'}
      message={renderedMessage}
      buttonLabel={renderedBtnLabel}
    />
  );
};

export default DeleteConfirmationModal;
