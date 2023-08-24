// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
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
}: IframeFieldModalProps) => {

  const { addAlert } = useAlert();
  const iframeRef = useRef<any>(null);

  const [showModalSpinner, setShowModalSpinner] = useState(true);

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
            if (mapping[k].isAsset && val && isStringAndNotEmpty(val.url)) {
              currentValues[k] = val.url;
            } else {
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
          // save the data
          for (const k in mapping) {
            const col = mapping[k];

            // make sure the column is part of the returned data
            if (!(k in content)) {
              if (optionalFieldNames.indexOf(k) === -1) {
                addAlert(
                  `Didn't recieve the expected value for '${k}'. Please contact your system administrators.`,
                  ChaiseAlertType.ERROR
                );
                return;
              }

              console.log(`iframe didn't return the expected field named '${k}'.`);
              continue;
            }
            const colData = content[k];

            if (col.isAsset) {
              if (!(colData instanceof File)) {
                if (!(k in optionalFieldNames)) {
                  addAlert(
                    `Didn't recieve the expected file for '${k}'. Please contact your system administrators.`,
                    ChaiseAlertType.ERROR
                  );
                  return;
                }

                console.log(`iframe field named '${k}' must be a file.`);
                continue;
              }

              const tempFileObject: FileObject = {
                file: colData,
                url: URL.createObjectURL(colData),
                filename: colData.name,
                filesize: colData.size
              };

              setValue(`${formNumber}-${col.name}`, tempFileObject);
            } else {
              setValue(`${formNumber}-${col.name}`, colData);
            }
          }

          // hide the modal
          setShowModal(false);

          // clear the previous errors on the form
          clearErrors(fieldName);
          break;
      }
    }

    /**
     * listen for the messages that the iframe will send
     */
    window.addEventListener('message', recieveIframeMessage);

    return () => {
      window.removeEventListener('message', recieveIframeMessage);
    }
  }, [showModal]);

  const closeModal = () => setShowModal(false);

  return (
    <Modal
      className='iframe-field-popup'
      onHide={closeModal}
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
          tooltip='Close the dialog'
        >
          <button
            className='chaise-btn chaise-btn-secondary modal-close modal-close-absolute'
            onClick={closeModal}
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
  );
}

export default IframeFieldModal;
