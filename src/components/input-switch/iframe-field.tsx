// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Modal from 'react-bootstrap/Modal';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import Title from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useEffect, useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';

// models
import { appModes, FileObject, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { populateSubmissionRow } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';

type IframeFieldProps = InputFieldProps & {
  /**
   * The column model representing this field in the form.
   */
  columnModel: RecordeditColumnModel,
  /**
   * the mode of the app
   */
  appMode?: string,
  /**
   * the "formNumber" that this input belongs to
   */
  formNumber?: number,
  /**
   * The reference that is used for the form
   */
  parentReference?: any,
  /**
   * The tuple representing the row.
   * Available only in edit mode.
   */
  parentTuple?: any,
};

const IframeField = (props: IframeFieldProps): JSX.Element => {

  const { addAlert } = useAlert();

  const [showModal, setShowModal] = useState(false);
  const [showModalSpinner, setShowModalSpinner] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const iframeRef = useRef<any>(null);
  const { setValue, clearErrors, getValues } = useFormContext();

  const usedFormNumber = typeof props.formNumber === 'number' ? props.formNumber : 1;
  const isEditMode = props.appMode === appModes.EDIT;
  const iframeLocation = props.columnModel.column.inputIframeProps.url;

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
      const mapping = props.columnModel.column.inputIframeProps.fieldMapping;
      const optionalFieldNames = props.columnModel.column.inputIframeProps.optionalFieldNames;

      const type = event.data.type;
      const content = event.data.content;
      switch (type) {
        case 'iframe-data-ready':
          setShowModalSpinner(false);
          break;
        case 'iframe-ready':
          const submissionRow = populateSubmissionRow(props.parentReference, usedFormNumber, getValues());
          const currentValues: any = {};
          for (const k in mapping) {
            const val = submissionRow[mapping[k].name];
            if (mapping[k].isAsset && val && isStringAndNotEmpty(val.url)) {
              currentValues[k] = val.url;
            } else {
              currentValues[k] = submissionRow[mapping[k].name];
            }
          }

          iframeRef.current.contentWindow.postMessage({
            type: 'initialize-iframe',
            content: currentValues
          });
          break;
        case 'submit-data':
          // hide the modal
          setShowModal(false);

          // clear the previous errors on the form
          clearErrors(props.name);

          // save the data
          for (const k in mapping) {
            const col = mapping[k];

            if (!(k in content)) {
              if (!(k in optionalFieldNames)) {
                // we should show an error and discard the whole iframe..
                let message = `Didn't recieve the expected value for '${k}'. Please contact your system administrators.`;
                addAlert(message, ChaiseAlertType.ERROR);
                return;
              }

              console.log(`iframe didn't return the expected field named '${k}'.`);
              continue;
            }
            const colData = content[k];

            if (col.isAsset) {
              if (!(colData instanceof File)) {
                // TODO what if the returned data is not a file
                console.log(`iframe field named '${k}' must be a file.`);
                continue;
              }

              const tempFileObject: FileObject = {
                file: colData,
                url: URL.createObjectURL(colData),
                filename: colData.name,
                filesize: colData.size
              };

              setValue(`${usedFormNumber}-${col.name}`, tempFileObject);
            } else {
              setValue(`${usedFormNumber}-${col.name}`, colData);
            }
          }

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

  /**
   * make sure all the columns in the mapping are cleared
   */
  const onClear = () => {
    const mapping = props.columnModel.column.inputIframeProps.fieldMapping;
    for (const k in mapping) {
      const col = mapping[k];
      setValue(`${usedFormNumber}-${col.name}`, '');
    }
  }

  const openIframeModal = () => {
    setShowModal(true);
    setShowModalSpinner(true);
  };

  const closeIframeModal = () => {
    setShowModal(false);
    setShowModalSpinner(false);
  };


  return (
    <InputField {...props} onClear={onClear}>
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-iframe'>
          <div className='chaise-input-group' ref={inputRef} {... (!props.disableInput && { onClick: openIframeModal })}>
            <div
              className={`chaise-input-control has-feedback ellipsis ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}
            >
              {isStringAndNotEmpty(field?.value) ?
                <DisplayValue className='popup-select-value' value={{ value: field?.value, isHTML: true }} /> :
                <span
                  className='chaise-input-placeholder popup-select-value'
                  contentEditable={false}
                >
                  {props.placeholder ? props.placeholder : 'Select a value'}
                </span>
              }
              <ClearInputBtn
                btnClassName={`${props.clearClasses} input-switch-clear`}
                clickCallback={clearInput} show={!props.disableInput && showClear}
              />
            </div>
            {!props.disableInput && <div className='chaise-input-group-append'>
              <button className='chaise-btn chaise-btn-primary modal-popup-btn' role='button' type='button'>
                <span className='chaise-btn-icon fa-solid fa-chevron-down' />
              </button>
            </div>}
          </div>
          <input className={props.inputClasses} {...field} type='hidden' />
          {
            showModal &&
            <Modal
              className='iframe-input-popup'
              onHide={closeIframeModal}
              show
            >
              <Modal.Header>
                <Modal.Title>
                  <span>Select </span>
                  <Title displayname={props.columnModel.column.displayname} />
                  {props.parentReference &&
                    <span>
                      <span> for {!isEditMode ? 'new ' : ''}</span>
                      <Title reference={props.parentReference} />
                      {isEditMode && props.parentTuple &&
                        <span>: <Title displayname={props.parentTuple.displayname}></Title></span>
                      }
                    </span>
                  }
                </Modal.Title>
                <ChaiseTooltip
                  placement='bottom'
                  tooltip='Close the dialog'
                >
                  <button
                    className='chaise-btn chaise-btn-secondary modal-close modal-close-absolute'
                    onClick={closeIframeModal}
                  >
                    <strong className='chaise-btn-icon'>X</strong>
                    <span>Close</span>
                  </button>
                </ChaiseTooltip>
              </Modal.Header>
              <Modal.Body>
                <div className='iframe-container'>
                  {showModalSpinner && <ChaiseSpinner />}
                  <iframe ref={iframeRef} src={iframeLocation} />
                </div>
              </Modal.Body>
            </Modal>
          }
        </div>
      )}
    </InputField>
  );
};

export default IframeField;
