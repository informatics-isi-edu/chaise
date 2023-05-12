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
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useState, useRef, useLayoutEffect } from 'react';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';

const RUIField = (props: InputFieldProps): JSX.Element => {

  const [showModal, setShowModal] = useState(false);

  const iframeRef = useRef<any>(null);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;

      const data = event.data.data;
      const type = event.data.type;

      if (type === 'json-download') {
        console.log('recieved the json in chaise');
        console.log(data);
        setShowModal(false);
      }
    })
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
              <Modal.Body style={{minHeight: '90vh'}}>
                <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '15px'}}>
                  <ChaiseSpinner />
                  <iframe
                    ref={iframeRef}
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

export default RUIField;
