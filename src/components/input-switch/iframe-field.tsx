// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import IframeFieldModal from '@isrd-isi-edu/chaise/src/components/modals/iframe-field-modal';

// hooks
import { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';

// models
import { appModes, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// providers
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { populateSubmissionRow, populateLinkedData } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';

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
  /**
   * the ref used to capture the foreignkey data
   */
  foreignKeyData?: React.MutableRefObject<any>,
};

const IframeField = (props: IframeFieldProps): JSX.Element => {

  const { addAlert } = useAlert();
  const { setValue, clearErrors, getValues } = useFormContext();

  const [showModal, setShowModal] = useState(false);
  const [iframeProps, setIframeProps] = useState<{
    url: string,
    submissionRow: any
  } | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);


  const usedFormNumber = typeof props.formNumber === 'number' ? props.formNumber : 1;
  const isEditMode = props.appMode === appModes.EDIT;


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
    const linkedData = populateLinkedData(props.parentReference, usedFormNumber, props.foreignKeyData?.current);
    const submissionRow = populateSubmissionRow(props.parentReference, usedFormNumber, getValues());
    const url = props.columnModel.column.renderInputIframeUrl(submissionRow, linkedData);

    if (isStringAndNotEmpty(url)) {
      setIframeProps({ url, submissionRow });
      setShowModal(true);
    } else {
      addAlert(
        'Invalid url template. Please contact your system administrators.',
        ChaiseAlertType.ERROR
      );
    }
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
            showModal && iframeProps &&
            <AlertsProvider>
              <IframeFieldModal
                iframeLocation={iframeProps.url}
                showModal={showModal}
                setShowModal={setShowModal}
                title={<>
                  <span>Select </span>
                  <Title displayname={props.columnModel.column.displayname} />
                  {props.parentReference &&
                    <span>
                      <span> for {!isEditMode ? 'new ' : ''}</span>
                      <Title reference={props.parentReference} />
                      {isEditMode && props.parentTuple &&
                        <span>: <Title displayname={props.parentTuple.displayname}></Title></span>}
                    </span>}
                </>}
                fieldName={props.name}
                columnModel={props.columnModel}
                submissionRowValues={iframeProps.submissionRow}
                formNumber={usedFormNumber}
                clearErrors={clearErrors}
                setValue={setValue}
                confirmClose={!field?.value}
              />
            </AlertsProvider>
          }
        </div>
      )}
    </InputField>
  );
};

export default IframeField;
