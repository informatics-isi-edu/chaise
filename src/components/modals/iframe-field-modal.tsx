// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import IframeFieldCloseConfirmModal from '@isrd-isi-edu/chaise/src/components/modals/iframe-field-close-confirm-modal';
import Modal from 'react-bootstrap/Modal';

// hooks
import { useEffect, useState, useRef } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';

// models
import { FileObject, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';

type IframeFieldModalProps = {
  /**
   * the url
   */
  iframeLocation: string,
  /**
   * the title of popup
   */
  title: JSX.Element,
  /**
   * the name of the filed (props.name)
   */
  fieldName: string,
  /**
   * the column model (props.columnModel)
   */
  columnModel: RecordeditColumnModel,
  /**
   * form number
   */
  formNumber: number,
  /**
   * react-hook-form clearErrors
   */
  clearErrors: any,
  /**
   * react-hook-form setValue
   */
  setValue: any,
  showModal: boolean,
  setShowModal: any,
  submissionRowValues: any,
  /**
   * whether we should show a modal when users attempt to close the modal
   */
  confirmClose: boolean
}

/**
 * the popup used by iframe field. the iframe will be displayed in this popup.
 */
const IframeFieldModal = ({
  iframeLocation,
  title,
  fieldName,
  columnModel,
  submissionRowValues,
  formNumber,
  clearErrors,
  setValue,
  showModal,
  setShowModal,
  confirmClose
}: IframeFieldModalProps) => {

  const { addAlert } = useAlert();
  const confirmEmptyMessage = columnModel.column.inputIframeProps.emptyFieldConfirmMessage;

  const iframeRef = useRef<any>(null);

  /**
   * whether we are showing the spinner
   * (displayed on load until we get the `iframe-data-ready` message)
   */
  const [showModalSpinner, setShowModalSpinner] = useState(true);
  /**
   * whether we are showing the close confirm
   */
  const [showModalCloseConfirm, setShowModalCloseConfirm] = useState(false);

  /**
   * messages:
   *
   *  from iframe to chaise
   *    - 'iframe-ready': on initial load of iframe
   *    - 'iframe-data-ready': when iframe app loaded data and is ready
   *    - 'submit-data': when data is submitted
   *
   *  from chaise to iframe
   *    - 'initialize-iframe': send the data to iframe
   *
   */
  useEffect(() => {
    if (!showModal) return;
    const recieveIframeMessage = (event: any) => {
      if (event.origin !== window.location.origin) return;
      const mapping = columnModel.column.inputIframeProps.fieldMapping;
      const optionalFieldNames = columnModel.column.inputIframeProps.optionalFieldNames;

      const type = event.data.type;
      const content = event.data.content;
      switch (type) {
        case 'iframe-data-ready':
          setShowModalSpinner(false);
          break;
        case 'iframe-ready':
          // generate the existing value object that should be sent to iframe, so it can show the existing value to users
          const currentValues: any = {};
          for (const k in mapping) {
            const val = submissionRowValues[mapping[k].name];
            if (mapping[k].isAsset) {
              if (val && isStringAndNotEmpty(val.url)) {
                currentValues[k] = val.url;
              }
            } else if (submissionRowValues[mapping[k].name] !== undefined) {
              currentValues[k] = submissionRowValues[mapping[k].name];
            }
          }

          iframeRef.current.contentWindow.postMessage({
            type: 'initialize-iframe',
            content: currentValues
          });
          break;
        case 'show-alert':
          addAlert(content.message, content.type);
          break;
        case 'submit-data':
          /**
           * the data that should be stored
           * we're capturing it in case there was an issue in the middle, so we're not saving partial data.
           */
          const values: any = {};

          // save the data
          for (const k in mapping) {
            const col = mapping[k];

            // make sure the column is part of the returned data
            if (!(k in content)) {
              if (optionalFieldNames.indexOf(k) === -1) {
                // show an error and abort all the changes
                addAlert(
                  `Didn't recieve the expected value for '${k}'. Please contact your system administrators.`,
                  ChaiseAlertType.ERROR
                );
                return;
              }

              // set an empty value for missing fields (to clear any existing values based on previous selection)
              setEmpty(col, values);
              // go to the next field
              continue;
            }

            const colData = content[k];

            if (col.isAsset) {
              if (!(colData instanceof File)) {
                if (!(k in optionalFieldNames)) {
                  // show an error and abort all the changes
                  addAlert(
                    `Didn't recieve the expected file for '${k}'. Please contact your system administrators.`,
                    ChaiseAlertType.ERROR
                  );
                  return;
                }

                // didn't receive a file, so just set empty value.
                setEmpty(col, values);

                // go to the next field
                continue;
              }

              values[`${formNumber}-${col.name}`] = {
                file: colData,
                url: URL.createObjectURL(colData),
                filename: colData.name,
                filesize: colData.size
              };

            } else {
              values[`${formNumber}-${col.name}`] = colData;
            }
          }

          /**
           * if there was any issues in the data, it will not reach here,
           * so it's safe to save the data and close the modal
           */
          Object.keys(values).forEach((k) => setValue(k, values[k]));
          setShowModal(false);

          // clear the previous errors on the form
          clearErrors(fieldName);
          break;
      }
    };

    /**
     * used above for clearing the value of a column.
     * @param col ReferenceColumn object
     * @param values the object that will be mutated by this function.
     */
    const setEmpty = (col: any, values: any) => {
      if (col.isAsset) {
        values[`${formNumber}-${col.name}`] = {
          url: '',
          filename: '',
          filesize: 0
        }
      } else {
        values[`${formNumber}-${col.name}`] = '';
      }
    };

    /**
     * listen for the messages that the iframe will send
     */
    window.addEventListener('message', recieveIframeMessage);

    return () => {
      window.removeEventListener('message', recieveIframeMessage);
    }
  }, [showModal]);

  /**
   * can be used for closing the modal
   */
  const closeModal = () => {
    setShowModalCloseConfirm(false);
    setShowModal(false);
  }

  /**
   * called when user wants to close the modal
   */
  const attemptToCloseModal = () => {
    if (confirmClose) {
      setShowModalCloseConfirm(true);
    } else {
      closeModal();
    }
  }

  return (
    <>
      <IframeFieldCloseConfirmModal
        show={showModalCloseConfirm}
        onCancel={() => setShowModalCloseConfirm(false)}
        onConfirm={closeModal}
        message={isStringAndNotEmpty(confirmEmptyMessage) ? <DisplayValue value={{ isHTML: true, value: confirmEmptyMessage }} /> : undefined}
      />
      <Modal
        className='iframe-field-popup'
        onHide={attemptToCloseModal}
        show={showModal}
        // make sure the iframe is taking up the whole width:
        size={'xl'}
        // make sure the iframe is taking up the whole height:
        fullscreen={true}
      >
        <Modal.Header>
          <Modal.Title>
            {title}
          </Modal.Title>
          <ChaiseTooltip
            placement='bottom'
            tooltip='Close this popup.'
          >
            <button
              className='chaise-btn chaise-btn-secondary modal-close modal-close-absolute'
              onClick={attemptToCloseModal}
            >
              <strong className='chaise-btn-icon'>X</strong>
              <span>Close</span>
            </button>
          </ChaiseTooltip>
        </Modal.Header>
        <Alerts />
        <Modal.Body>
          <div className='iframe-container'>
            {showModalSpinner && <ChaiseSpinner className='iframe-field-modal-spinner' />}
            <iframe ref={iframeRef} src={iframeLocation} />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default IframeFieldModal;
