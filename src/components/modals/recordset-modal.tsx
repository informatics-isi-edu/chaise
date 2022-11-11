// components
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Recordset from '@isrd-isi-edu/chaise/src/components/recordset/recordset';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// models
import { RecordsetDisplayMode, RecordsetSelectMode, SelectedRow } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordsetProps } from '@isrd-isi-edu/chaise/src/models/recordset';
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { getInitialFacetPanelOpen } from '@isrd-isi-edu/chaise/src/utils/faceting-utils';

export type RecordestModalProps = {
  /**
   * The props that will be passed ot the recordset
   */
  recordsetProps: RecordsetProps,
  /**
   * The modal's class name
   */
  modalClassName?: string,
  /**
   * The displayname used for the title
   */
  displayname?: Displayname,
  /**
   * The comment used for the title
   */
  comment?: string,
  /**
   * The function that will be called on each row change.
   * NOTE The actual callback that we're sending to recordset is not this one,
   * and instead is just going to call this function. This is done this way
   * so we can apply the logic to disable the submit button
   */
  onSelectedRowsChanged?: (SelectedRow: SelectedRow[]) => boolean,
  /**
   * The function that will be called on submit
   * Note: the modal won't close on submit and if that's the expected behavior,
   * you should do it in this callback.
   */
  onSubmit: (selectedRows: SelectedRow[]) => void,
  /**
   * Whether we should show the submit spinner or not
   */
  showSubmitSpinner?: boolean,
  /**
   * The function that will be called when user clicks on "cancel" button
   * Note: the modal won't close by itself and if that's the expected behavior,
   * you should do it in this callback.
   */
  onClose: () => void
}

/**
 * recordset.tsx on modal. It will add proper title and will handle row selection.
 *
 * NOTE:
 * - We're not handling show/hide logic here to avoid multiple render calls, therefore,
 *   - As soon as the component is used, we will show the modal
 *   - You have to handle closing the modal on the `onClose` callback otherwise the
 *     modal will stay open.
 */
const RecordsetModal = ({
  recordsetProps,
  modalClassName,
  displayname,
  comment,
  onSelectedRowsChanged,
  onSubmit,
  showSubmitSpinner,
  onClose
}: RecordestModalProps) => {

  /**
   * We should disable the submit button if we start with no rows and ended up
   * with no rows. So we need to capture the initial state.
   */
  const hasSelectedRowsOnLoad = Array.isArray(recordsetProps.initialSelectedRows) && recordsetProps.initialSelectedRows.length > 0;

  const displayMode = recordsetProps.config.displayMode;
  const selectMode = recordsetProps.config.selectMode;

  // these attributes are used for handling the scrollbar in recordset:
  const modalContainer = useRef<any>(null);
  const modalHeader = useRef<HTMLDivElement>(null);
  const [showRecordset, setShowRecordset] = useState(false);

  /**
   * the split-view logic will make sure the all the left panels have the same size,
   * but it won't take care of the cases when the left panel is closed.
   * We're handling the close UI by just adding a class and setting the display:none
   * So I had to make sure I'm doing the same thing for the modal-header's left panel as well.
   */
  const [facetPanelOpen, setFacetPanelOpen] = useState<boolean>(() => {
    return getInitialFacetPanelOpen(recordsetProps.config, recordsetProps.initialReference);
  });
  const panelClassName = facetPanelOpen ? 'open-panel' : 'close-panel';

  /**
   * we have to keep a copy of submitted rows, because we don't have access
   * to the provider and therefore cannot get the selectedRows.
   * This will also allow us to set the state of submit button
   */
  const [submittedRows, setSubmittedRows] = useState<any>([]);

  /**
   * Whether the submit button should be disabled or not
   */
  const [disableSubmit, setDisableSubmit] = useState(() => {
    return !hasSelectedRowsOnLoad;
  });

  /**
   * Delay showing the recordset component until we have the modal structure read
   * This is to make sure we can pass parentContainer and parentStickyArea
   * so we can properly create the scrollable area.
   */
  useLayoutEffect(() => {
    setShowRecordset(true);
  }, []);

  useEffect(() => {
    if (selectMode === RecordsetSelectMode.SINGLE_SELECT) {
      submit();
    }
    else {
      let cannotSubmit = false;
      if (onSelectedRowsChanged) {
        cannotSubmit = onSelectedRowsChanged(submittedRows) === false;
      }

      /**
       * Disable the submit button if,
       * - The onSelectedRowsChanged returned false
       * - or we started with 0 selected rows and now we have 0 selected rows
       */
      setDisableSubmit(
        cannotSubmit || (!hasSelectedRowsOnLoad && (!submittedRows || submittedRows.length === 0))
      );
    }

  }, [submittedRows]);

  //-------------------  UI related callbacks:   --------------------//
  const onSelectedRowsChangedWrapper = (selectedRows: SelectedRow[]) => {
    setSubmittedRows(selectedRows);
    if (onSelectedRowsChanged) {
      return onSelectedRowsChanged(selectedRows);
    }
    // allow the selected rows to change and UI shows the selected
    return true;
  };

  const submit = () => {
    onSubmit(submittedRows);
  };

  const onCancelClick = () => {
    LogService.logClientAction(
      {
        action: LogService.getActionString(LogActions.CANCEL, recordsetProps.logInfo.logStackPath),
        stack: recordsetProps.logInfo.logStack
      },
      recordsetProps.initialReference
    );
    onClose();
  };

  //-------------------  render logic:   --------------------//

  // get the modal elements based on the available ref
  const modalContainerEl = modalContainer.current ? modalContainer.current.dialog.querySelector('.modal-content') as HTMLDivElement : undefined;
  const modalHeaderEl = modalHeader.current ? modalHeader.current : undefined;

  /**
   * figure out the modal size.
   *  - if #columns <= 3 : undefiend (medium)
   *  - if #columns <= 6 : large
   *  - else             : xlarge
   */
  let modalSize: undefined | 'lg' | 'xl';
  let numCols = recordsetProps.initialReference.columns.length;
  if (recordsetProps.config.showFaceting) {
    numCols++;
  }
  if (numCols > 3) {
    if (numCols <= 6) {
      modalSize = 'lg';
    } else {
      modalSize = 'xl';
    }
  }

  let submitText = 'Save', submitTooltip: string | JSX.Element = 'Apply the selected records.';
  switch (displayMode) {
    case RecordsetDisplayMode.FACET_POPUP:
      submitText = 'Submit';
      break;
    case RecordsetDisplayMode.PURE_BINARY_POPUP_UNLINK:
      submitText = 'Unlink';
      submitTooltip = (
        <>
          <span>Disconnect the selected records from </span>
          <code><DisplayValue value={recordsetProps.parentReference?.displayname} /></code>:
          <code><DisplayValue value={recordsetProps.parentTuple?.displayname} /></code>.
        </>
      )
      break;
    case RecordsetDisplayMode.PURE_BINARY_POPUP_ADD:
      submitText = 'Link';
      submitTooltip = (
        <>
          <span>Connect the selected records to </span>
          <code><DisplayValue value={recordsetProps.parentReference?.displayname} /></code>:
          <code><DisplayValue value={recordsetProps.parentTuple?.displayname} /></code>.
        </>
      )
      break;
  }

  const renderTitle = () => {
    switch (displayMode) {
      case RecordsetDisplayMode.FK_POPUP_CREATE:
        // select <col-displayname> for new <parent-displayname>
        return (
          <div>
            <span>Select </span>
            <Title displayname={displayname} />
            {recordsetProps.parentReference &&
              <span>
                <span> for new </span>
                <Title reference={recordsetProps.parentReference} />
              </span>
            }
          </div>
        );
      case RecordsetDisplayMode.FK_POPUP_EDIT:
        // select <col-displayname> for <parent-displayname>:<parent-tuple>
        return (
          <div>
            <span>Select </span>
            <Title displayname={displayname} />
            {recordsetProps.parentReference &&
              <span>
                <span> for </span>
                <Title reference={recordsetProps.parentReference} />
                {recordsetProps.parentTuple &&
                  <span>:<Title displayname={recordsetProps.parentTuple.displayname}></Title></span>
                }
              </span>
            }
          </div>
        );
      case RecordsetDisplayMode.PURE_BINARY_POPUP_ADD:
        return (
          <div>
            <span>Link </span>
            <Title reference={recordsetProps.initialReference} />
            <span> to </span>
            <Title reference={recordsetProps.parentReference} /><span>: </span>
            <Title displayname={recordsetProps.parentTuple?.displayname} />
          </div>
        );
      case RecordsetDisplayMode.PURE_BINARY_POPUP_UNLINK:
        return (
          <div>
            <span>Unlink </span>
            <Title reference={recordsetProps.initialReference} />
            <span> from </span>
            <Title reference={recordsetProps.parentReference} /><span>: </span>
            <Title displayname={recordsetProps.parentTuple?.displayname} />
          </div>
        );
      case RecordsetDisplayMode.FACET_POPUP:
        return (
          <div>
            <span>Search by </span>
            <Title displayname={displayname} comment={comment} />
          </div>);
      default:
        return (
          <div><Title addLink={false} reference={recordsetProps.initialReference} /></div>
        )
        break;
    }
  }

  return (
    <Modal
      className={`search-popup ${modalClassName}`}
      size={modalSize}
      show={true}
      onHide={onClose}
      ref={modalContainer}
    >
      {showSubmitSpinner &&
        <div className='modal-submit-spinner-container'>
          <div className='modal-submit-spinner-backdrop'></div>
          <ChaiseSpinner className='modal-submit-spinner' message='Saving the changes...' />
        </div>
      }
      <Modal.Header ref={modalHeader}>
        <div className='top-panel-container'>
          <div className='top-flex-panel'>
            <div className={`top-left-panel also-resizable ${panelClassName}`}></div>
            <div className='top-right-panel'>
              <div className='recordset-title-container title-container'>
                <div className='search-popup-controls recordset-title-buttons title-buttons'>
                  {selectMode === RecordsetSelectMode.MULTI_SELECT &&
                    <ChaiseTooltip
                      placement='bottom'
                      tooltip={submitTooltip}
                    >
                      <button
                        id='multi-select-submit-btn' className='chaise-btn chaise-btn-primary'
                        type='button' onClick={submit}
                        disabled={disableSubmit || showSubmitSpinner}
                      >
                        {!showSubmitSpinner && <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>}
                        {showSubmitSpinner && <span className='chaise-btn-icon'><Spinner animation='border' size='sm' /></span>}
                        <span>{submitText}</span>
                      </button>
                    </ChaiseTooltip>
                  }
                  <ChaiseTooltip
                    placement='bottom'
                    tooltip='Close the dialog'
                  >
                    <button
                      className='chaise-btn chaise-btn-secondary pull-right modal-close' type='button'
                      onClick={() => onCancelClick()} disabled={showSubmitSpinner}
                    >
                      <strong className='chaise-btn-icon'>X</strong>
                      <span>Cancel</span>
                    </button>
                  </ChaiseTooltip>
                </div>
                <h2 className='modal-title'>
                  {renderTitle()}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        {showRecordset &&
          <Recordset
            {...recordsetProps}
            onSelectedRowsChanged={onSelectedRowsChangedWrapper}
            parentContainer={modalContainerEl}
            parentStickyArea={modalHeaderEl}
            onFacetPanelOpenChanged={setFacetPanelOpen}
          />
        }
      </Modal.Body>
    </Modal>
  )

};

export default RecordsetModal;
