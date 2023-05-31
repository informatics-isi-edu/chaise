/**
 * TODO this is a proof of concept
 *  - we shouldn't hard code the iframe url and most probably should come from
 *    ermrestjs.
 *  - this most probably should be renamed to something more general, maybe ExternalField?
 *  - we should send the existing data to the iframe for edit mode
 *  - in RUI case we want to save a file not json.. so we should adjust the logic accordingly
 *
 */

// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Modal from 'react-bootstrap/Modal';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useState, useRef } from 'react';

// models
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';

type IframeFieldProps = InputFieldProps & {
  /**
   * the "formNumber" that this input belongs to (used for setting the value)
   */
  formNumber?: number,
  /**
   * The column model representing this field in the form.
   */
  columnModel: RecordeditColumnModel,
};

const IframeField = (props: IframeFieldProps): JSX.Element => {

  const [showModal, setShowModal] = useState(false);

  const iframeRef = useRef<any>(null);

  /**
   * messages:
   *
   *  from iframe to iframe
   *    - 'iframe-loaded': on initial load
   *    - 'submit-data': when data is submitted
   *
   *  from parent to iframe
   *    - 'initialize-iframe': send the data to iframe
   *
   */
  useEffect(() => {
    const recieveIframeMessage = (event: any) => {
      if (event.origin !== window.location.origin) return;

      const type = event.data.type;
      const content = event.data.content;

      switch(type) {
        case 'iframe-loaded':
          // TODO in edit mode fetch the file and send the json
          iframeRef.current.contentWindow.postMessage({type: 'initialize-iframe', data: null})
          break;
        case 'submit-data':
          console.log('recieved the json in chaise');
          const json = JSON.parse(content);


          /**
           * TODO
           * save the json as a file in the RUI field.
           * take a look at how file-field is saving files in handleChange function.
           **/
          console.log(json);

          /**
           * TODO
           * you also need to save the "@id" property of json in a separate
           * "RUI_ID" column. for now you can hardcode this column name.
           * In edit mode, as well as when user picked a registery, we should display
           * this value in the input.
           */
          if (json['@id']) {
            // TODO
            console.log(json['@id'])
          }

          // hide the modal
          setShowModal(false);
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
  }, []);

  const openRUIModal = () => {
    setShowModal(true);
  }

  const closeRUIModal = () => {
    setShowModal(false);
  }

  return (
    <InputField {...props}>
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-foreignkey'>
          <div className='chaise-input-group' {... (!props.disableInput && { onClick: openRUIModal })}>
            <div
              className={`chaise-input-control has-feedback ellipsis ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}
            >
              {isStringAndNotEmpty(field?.value) ?
                // TODO instead of the field value, you need to show the value of "RUID_id" column.
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
              className='export-progress'
              backdropClassName='export-progress-backdrop'
              onHide={closeRUIModal}
              backdrop='static'
              keyboard={false}
              size={'xl'}
              show
            >
              <Modal.Header>
                <Modal.Title>Select a value</Modal.Title>
                <button
                  className='chaise-btn chaise-btn-secondary modal-close modal-close-absolute'
                  onClick={closeRUIModal}
                >
                    <strong className='chaise-btn-icon'>X</strong>
                    <span>Close</span>
                </button>
              </Modal.Header>
              {/* TODO move the styles to scss files and don't have them inline */}
              <Modal.Body style={{minHeight: '90vh'}}>
                <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '15px'}}>
                  <ChaiseSpinner />
                  <iframe
                    ref={iframeRef}
                    // TODO should not be hardcoded
                    src='https://dev.isrd.isi.edu/~ashafaei/ccf-ui/'
                    style={{height: '100%', width: '100%', zIndex: 12, position: 'relative'}}
                  />
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
