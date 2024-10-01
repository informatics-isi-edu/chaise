// components
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Recordset from '@isrd-isi-edu/chaise/src/components/recordset/recordset';
import Title, { TitleProps } from '@isrd-isi-edu/chaise/src/components/title';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// models
import { RecordsetDisplayMode, RecordsetSelectMode, SelectedRow } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordsetProps } from '@isrd-isi-edu/chaise/src/models/recordset';
import { CommentType, Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

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
   * The modal's backdrop class name
   */
  modalBackdropClassName?: string,
  /**
   * The displayname used for the title
   */
  displayname?: Displayname,
  /**
   * The comment used for the title
   */
  comment?: CommentType,
  /**
   * The function that will be called on each row change.
   * NOTE The actual callback that we're sending to recordset is not this one,
   * and instead is just going to call this function. This is done this way
   * so we can apply the logic to disable the submit button
   */
  onSelectedRowsChanged?: (SelectedRow: SelectedRow[]) => boolean | string,
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
  onClose: () => void,

  /**
   * the label that should be used for close button (default: Cancel)
   */
  closeButtonLabel?: string
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
  modalBackdropClassName,
  displayname,
  comment,
  onSelectedRowsChanged,
  onSubmit,
  showSubmitSpinner,
  onClose,
  closeButtonLabel: closeLabel
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
   * the split-view logic will make sure that all the left panels have the same size,
   * but it won't take care of the cases when the left panel is getting closed or opened.
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
  const [submittedRows, setSubmittedRows] = useState<SelectedRow[]>(() => (
    (Array.isArray(recordsetProps.initialSelectedRows) && selectMode !== RecordsetSelectMode.SINGLE_SELECT) ? recordsetProps.initialSelectedRows : []
  ));

  /**
   * when the submit button is pressed, we should hide it so it doesn't block other elements.
   */
  const [showSubmitTooltip, setShowSubmitTooltip] = useState(false);

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
      // on initial load this will be called, and the following is to guard
      // against it.
      if (submittedRows.length === 0) return;
      submit();
    } else {
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
  const showUIContextTitles = displayMode === RecordsetDisplayMode.FACET_POPUP && recordsetProps.uiContextTitles;

  /**
   * figure out the modal size.
   *  - if #columns <= 3 : undefiend (medium)
   *  - if #columns <= 6 : large
   *  - else             : xlarge
   */
  let modalSize: undefined | 'lg' | 'xl';
  let numCols = recordsetProps.initialReference.columns.length;
  if (!recordsetProps.config.disableFaceting && recordsetProps.initialReference.display.showFaceting) {
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
    case RecordsetDisplayMode.FK_POPUP_BULK_CREATE:
      submitText = 'Continue';
      submitTooltip = (
        <>
          <span>Submit the selected records to fill in </span>
          <code><DisplayValue value={recordsetProps.parentReference?.displayname} /></code>
          <span> forms</span>.
        </>
      )
      break;
  }

  let uiContextTitles: TitleProps[] | undefined, // the ui contexts that should be passed to recordset for the next level
    titleEl: JSX.Element; // the modal title element.
  switch (displayMode) {
    case RecordsetDisplayMode.FK_POPUP_CREATE:
      // select <col-displayname> for new <parent-displayname>
      uiContextTitles = [{ displayname: displayname }];
      titleEl = (
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
      break;
    case RecordsetDisplayMode.FK_POPUP_EDIT:
      // select <col-displayname> for <parent-displayname>:<parent-tuple>
      uiContextTitles = [{ displayname: displayname }];
      titleEl = (
        <div>
          <span>Select </span>
          <Title displayname={displayname} />
          {recordsetProps.parentReference &&
            <span>
              <span> for </span>
              <Title reference={recordsetProps.parentReference} />
              {recordsetProps.parentTuple &&
                <span>: <Title displayname={recordsetProps.parentTuple.displayname}></Title></span>
              }
            </span>
          }
        </div>
      );
      break;
    case RecordsetDisplayMode.FK_POPUP_BULK_CREATE:
      titleEl = (
        <div>
          <span>Select a set of </span>
          <Title displayname={displayname} />
          <span>
            <span> for </span>
            <Title reference={recordsetProps.parentReference} />
          </span>
        </div>
      );
      break;
    case RecordsetDisplayMode.PURE_BINARY_POPUP_ADD:
      uiContextTitles = [{ displayname: displayname }];
      titleEl = (
        <div>
          <span>Link </span>
          <Title displayname={displayname} comment={comment} />
          <span> to </span>
          <Title reference={recordsetProps.parentReference} /><span>: </span>
          <Title displayname={recordsetProps.parentTuple?.displayname} />
        </div>
      );
      break;
    case RecordsetDisplayMode.PURE_BINARY_POPUP_UNLINK:
      uiContextTitles = [{ displayname: displayname }];
      titleEl = (
        <div>
          <span>Unlink </span>
          <Title displayname={displayname} comment={comment} />
          <span> from </span>
          <Title reference={recordsetProps.parentReference} /><span>: </span>
          <Title displayname={recordsetProps.parentTuple?.displayname} />
        </div>
      );
      break;
    case RecordsetDisplayMode.FACET_POPUP:
      uiContextTitles = recordsetProps.uiContextTitles;
      titleEl = (
        <div>
          <span>Select </span>
          <Title displayname={displayname} comment={comment} />
        </div>);
      break;
    case RecordsetDisplayMode.SAVED_QUERY_POPUP:
      uiContextTitles = [{ reference: recordsetProps.parentReference }];
      titleEl = (
        <div>
          <span>Saved search criteria for table </span>
          <Title reference={recordsetProps.parentReference} />
        </div>
      );
      break;
    default:
      titleEl = (
        <div><Title addLink={false} reference={recordsetProps.initialReference} /></div>
      )
      break;
  }

  return (
    <Modal
      backdropClassName={`search-popup-backdrop ${modalBackdropClassName ? modalBackdropClassName : ''}`}
      className={`search-popup ${modalClassName ? modalClassName : ''}`}
      size={modalSize}
      show={true}
      onHide={onClose}
      ref={modalContainer}
    >
      {showSubmitSpinner &&
        <div className='app-blocking-spinner-container'>
          <div className='app-blocking-spinner-backdrop'></div>
          <ChaiseSpinner className='modal-submit-spinner' message='Saving the changes...' />
        </div>
      }
      <Modal.Header ref={modalHeader} className={showUIContextTitles ? 'modal-header-reduced-top-padding' : ''}>
        <div className='top-panel-container'>
          <div className='top-flex-panel'>
            <div className={`top-left-panel also-resizable ${panelClassName}`}></div>
            <div className='top-right-panel'>
              {showUIContextTitles && recordsetProps.uiContextTitles &&
                <h4 className='modal-header-context'>{
                  // the last one is the current context which we don't want to show here
                  recordsetProps.uiContextTitles.map((titleProps, i, arr) => ((i !== arr.length - 1) && <span key={i}>
                    {i > 0 && <i className='fa-solid fa-chevron-right modal-header-context-separator'></i>}
                    {<Title {...titleProps} />}
                    {i === arr.length - 2 && <span className='modal-header-context-colon'>:</span>}
                  </span>))
                }</h4>
              }
              <div className='recordset-title-container title-container'>
                <div className='search-popup-controls recordset-title-buttons title-buttons'>
                  {selectMode === RecordsetSelectMode.MULTI_SELECT &&
                    <ChaiseTooltip
                      placement='bottom'
                      tooltip={submitTooltip}
                      onToggle={(nextShow: boolean) => (setShowSubmitTooltip(nextShow && !(disableSubmit || showSubmitSpinner)))}
                      show={showSubmitTooltip && !(disableSubmit || showSubmitSpinner)}
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
                    tooltip='Close this popup.'
                  >
                    <button
                      className='chaise-btn chaise-btn-secondary pull-right modal-close' type='button'
                      onClick={() => onCancelClick()} disabled={showSubmitSpinner}
                    >
                      <strong className='chaise-btn-icon'>X</strong>
                      <span>{closeLabel ? closeLabel : 'Cancel'}</span>
                    </button>
                  </ChaiseTooltip>
                </div>
                <h2 className='modal-title'>{titleEl}</h2>
              </div>
            </div>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        {showRecordset &&
          <Recordset
            {...recordsetProps}
            uiContextTitles={uiContextTitles}
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
