// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { getDisabledInputValue, getInputTypeOrDisabled } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';


type ChaiseFormProps = {
  classes?: string,
  formNumber: number,
  idx: number,
  allowRemove: boolean
}

const ChaiseForm = ({ classes = '', formNumber, idx, allowRemove }: ChaiseFormProps) => {

  const { columnModels, formsHeightMap, removeForm } = useRecordedit();

  const renderFormHeader = () => {
    return (
      <div className='form-header entity-value'>
        <span>{idx + 1}</span>
        {allowRemove &&
          <ChaiseTooltip
            placement='bottom'
            tooltip='Click to remove this record from the form.'
          >
            <button className='chaise-btn chaise-btn-secondary pull-right remove-form-btn' onClick={() => removeForm([idx])}>
              <i className='fa-solid fa-xmark' />
            </button>
          </ChaiseTooltip>
        }
      </div>
    )
  }

  const renderInputs = () => {
    return columnModels.map((cm: RecordeditColumnModel) => {
      const colName = cm.column.name;
      const height = Math.max(...formsHeightMap[colName]);
      const heightparam = height === -1 ? 'auto' : `${height}px`;

      const inputType = getInputTypeOrDisabled(cm);
      let placeholder;
      if (inputType === 'disabled') {
        placeholder = getDisabledInputValue(cm.column);

        // TODO: extend this for edit mode
        // if value is empty string and we are in edit mode, use the previous value
        // if (placeholder == '' && context.mode == context.modes.EDIT) {
        //   placeholder = value;
        // }
      }


      return (
        <InputSwitch
          key={colName}
          displayErrors={true}
          name={`${formNumber}-${colName}`}
          type={inputType}
          // type='numeric'
          containerClasses={'column-cell entity-value'}
          // value={0}
          classes='column-cell-input'
          placeholder={placeholder}
          styles={{ 'height': heightparam }}
          columnModel={cm}
        />
      );
    })
  }


  return (
    <div className={`column-form ${classes}`}>
      {renderFormHeader()}
      {renderInputs()}
    </div>
  );

};

const ChaiseFormContainer = (): JSX.Element => {

  const {
    forms, handleInputHeightAdjustment,
    onSubmitValid, onSubmitInvalid
  } = useRecordedit();

  const { handleSubmit } = useFormContext()

  // TODO: how to refactor this when the event being fired in input switch might be in the case of apps that are not recordedit
  useEffect(() => {
    const formContainer = document.querySelector('.form-container') as HTMLElement;
    formContainer.addEventListener('input-switch-error-update', handleHeightAdjustment);

    return () => {
      formContainer.removeEventListener('input-switch-error-update', handleHeightAdjustment);
    }
  }, []);

  const handleHeightAdjustment = (event: any) => {
    const fieldName = event.detail.inputFieldName;
    const msgCleared = event.detail.msgCleared;

    const fieldType = event.detail.type;

    // call provider function
    handleInputHeightAdjustment(fieldName, msgCleared, fieldType);
  }

  return (
    <div className='form-container'>
      <form id='recordedit-form' className='recordedit-form' onSubmit={handleSubmit(onSubmitValid, onSubmitInvalid)}>
        {forms.map((f: number, idx: number) =>
          <ChaiseForm key={f} formNumber={f} idx={idx} allowRemove={forms.length > 1} />
        )}
      </form>
    </div>
  );
}

export default ChaiseFormContainer;
