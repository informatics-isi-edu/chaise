import { useState } from 'react'
import { Modal } from 'react-bootstrap';
import Recordset, { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';
import RecordsetProvider from '@isrd-isi-edu/chaise/src/providers/recordset';
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import { RecordsetDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

export type RecordestModalProps = {
  recordsetProps: RecordsetProps,
  modalClassName?: string,
  onHide?: () => void,
  displayname?: Displayname,
  comment?: string,
}

const RecordsetModal = ({
  recordsetProps,
  modalClassName,
  onHide,
  displayname,
  comment
}: RecordestModalProps) => {
  const [show, setShow] = useState(true);

  const displayMode = recordsetProps.config.displayMode;

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
            <Title reference={recordsetProps.parentReference}/><span>:</span>
            <Title displayname={recordsetProps.parentTuple?.displayname}/>
          </div>
        );
      case RecordsetDisplayMode.PURE_BINARY_POPUP_UNLINK:
        return (
          <div>
            <span>Unlink </span>
            <Title reference={recordsetProps.initialReference} />
            <span> from </span>
            <Title reference={recordsetProps.parentReference}/><span>:</span>
            <Title displayname={recordsetProps.parentTuple?.displayname}/>
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
      onHide={onHide}
    >
      <Modal.Header>
        <div className='top-panel-container'>
          <div className='top-flex-panel'>
            <div className='top-left-panel also-resizable'></div>
            <div className='top-right-panel'>
              <div className='recordset-title-container title-container'>
                <div className='search-popup-controls recordset-title-buttons title-buttons'>
                  <ChaiseTooltip
                    placement='bottom'
                    tooltip={submitTooltip}
                  >
                    <button
                      id='multi-select-submit-btn' className='chaise-btn chaise-btn-primary'
                      type='button' ng-click='ctrl.submit()'>
                      <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
                      <span>{submitText}</span>
                    </button>
                  </ChaiseTooltip>
                  <ChaiseTooltip
                    placement='bottom'
                    tooltip='Close the dialog.'
                  >
                    <button
                      className='chaise-btn chaise-btn-secondary pull-right modal-close' type='button'
                      onClick={() => setShow(false)}
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
          initialReference={recordsetProps.initialReference}
          config={recordsetProps.config}
          logInfo={recordsetProps.logInfo}
          initialPageLimit={recordsetProps.initialPageLimit}
        />
      </Modal.Body>
    </Modal>
  )

};

export default RecordsetModal;
