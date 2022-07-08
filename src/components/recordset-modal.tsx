import { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap';
import Recordset, { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';
import { RecordsetDisplayMode, RecordsetSelectMode, SelectedRow } from '@isrd-isi-edu/chaise/src/models/recordset';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

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
   * if it returns "false", the submit button will be disabled.
   * NOTE The actual callback that we're sending to recordset is not this one,
   * and instead is just going to call this function. This is done this way
   * so we can apply the logic to disable the submit button
   */
  onSelectedRowsChanged?: (SelectedRow: SelectedRow[]) => boolean,
  /**
   * The function that will be called on submit
   */
  onSubmit?: (selectedRows: SelectedRow[]) => void,
  /**
   * The function that will be called on closing the modal
   */
  onClose?: () => void
}

const RecordsetModal = ({
  recordsetProps,
  modalClassName,
  displayname,
  comment,
  onSelectedRowsChanged,
  onSubmit,
  onClose
}: RecordestModalProps) => {

  /**
   * We should disable the submit button if we start with no rows and ended up
   * with no rows. So we need to capture the initial state.
   */
   const hasSelectedRowsOnLoad = Array.isArray(recordsetProps.initialSelectedRows) && recordsetProps.initialSelectedRows.length > 0;

  const displayMode = recordsetProps.config.displayMode;
  const selectMode = recordsetProps.config.selectMode;

  /**
   * Whether to show the modal or not
   */
  const [show, setShow] = useState(true);

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
  const submit = () => {
    setShow(false);
    if (onSubmit) {
      onSubmit(submittedRows);
    }
  };

  const onSelectedRowsChangedWrapper = (selectedRows: SelectedRow[]) => {
    $log.debug('on selected rows changed called');
    setSubmittedRows(selectedRows);
    // allow the selected rows to change and UI shows the selected
    return true;
  };

  const closeTheModal = () => {
    setShow(false);
    if (onClose) {
      onClose();
    }
  }

  //-------------------  render logic:   --------------------//

  let submitText = 'Save', submitTooltip: string | JSX.Element = 'Apply the selected records';
  switch (displayMode) {
    case RecordsetDisplayMode.FACET_POPUP:
      submitText = 'Submit';
      break;
    case RecordsetDisplayMode.PURE_BINARY_POPUP_UNLINK:
      submitText = 'Unlink';
      submitTooltip = (
        <>
          <span>Disconnect the selected records from </span>
          <DisplayValue value={recordsetProps.parentReference?.displayname} />:
          <DisplayValue value={recordsetProps.parentTuple?.displayname} />.
        </>
      )
      break;
    case RecordsetDisplayMode.PURE_BINARY_POPUP_ADD:
      submitText = 'Link';
      submitTooltip = (
        <>
          <span>Connect the selected records to </span>
          <DisplayValue value={recordsetProps.parentReference?.displayname} />:
          <DisplayValue value={recordsetProps.parentTuple?.displayname} />.
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
            <Title reference={recordsetProps.parentReference} /><span>:</span>
            <Title displayname={recordsetProps.parentTuple?.displayname} />
          </div>
        );
      case RecordsetDisplayMode.PURE_BINARY_POPUP_UNLINK:
        return (
          <div>
            <span>Unlink </span>
            <Title reference={recordsetProps.initialReference} />
            <span> from </span>
            <Title reference={recordsetProps.parentReference} /><span>:</span>
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
      size={'lg'}
      show={show}
      onHide={onClose}
    >
      <Modal.Header>
        <div className='top-panel-container'>
          <div className='top-flex-panel'>
            <div className='top-left-panel also-resizable'></div>
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
                        disabled={disableSubmit}
                      >
                        <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
                        <span>{submitText}</span>
                      </button>
                    </ChaiseTooltip>
                  }
                  <ChaiseTooltip
                    placement='bottom'
                    tooltip='Close the dialog.'
                  >
                    <button
                      className='chaise-btn chaise-btn-secondary pull-right modal-close' type='button'
                      onClick={closeTheModal}
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
        <Recordset
          {...recordsetProps}
          onSelectedRowsChanged={onSelectedRowsChangedWrapper}
        />
      </Modal.Body>
    </Modal>
  )

};

export default RecordsetModal;
