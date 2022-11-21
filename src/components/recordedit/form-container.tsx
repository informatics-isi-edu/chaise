// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch';

// hooks
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

// utils
import { getInputType } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

const getInputTypeOrDisabled = (column: any) => {
  if (column.inputDisabled) {
    // TODO: if showSelectAll, disable input
    // TODO: create column models, no column model, enable!
    // TODO: is editMode and user cannot update this row, disable
    return 'disabled';
  }
  return getInputType(column.type);
}

type ChaiseFormProps = {
  classes?: string,
  idx: number,
  allowRemove: boolean
}

const ChaiseForm = ({ classes = '', idx, allowRemove }: ChaiseFormProps) => {

  const { columnModels, formsHeightMap, removeForm } = useRecordedit()

  const renderFormHeader = () => {
    return (
      <div className='form-header entity-value'>
        <span>{idx + 1}</span>
        {allowRemove &&
          <ChaiseTooltip
            placement='bottom'
            tooltip='Click to remove this record from the form.'
          >
            <button className='chaise-btn chaise-btn-secondary pull-right remove-form-btn' onClick={() => removeForm(idx)}>
              <i className='fa-solid fa-xmark' />
            </button>
          </ChaiseTooltip>
        }
      </div>
    )
  }

  const renderInputs = () => {
    return columnModels.map((cm: any) => {
      const colName = makeSafeIdAttr(cm.column.displayname.value);
      const height = Math.max(...formsHeightMap[colName]);
      const heightparam = height == -1 ? 'auto' : `${height}px`;

      return (
        <InputSwitch
          key={colName}
          displayErrors={true}
          name={`${idx}-${colName}`}
          type={getInputTypeOrDisabled(cm.column)}
          // type='numeric'
          containerClasses={'column-cell entity-value'}
          // value={0}
          classes='column-cell-input'
          placeholder={0}
          styles={{ 'height': heightparam }}
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

const getFormDefaultValues = (forms: number[], columnModels: any[]) => {
  // TODO: initialize inputs
  const formValues: any = {};
  forms.forEach((form: number, idx: number) => {
    columnModels.forEach((cm: any) => {
      const colname = makeSafeIdAttr(cm.column.displayname.value)
      // TODO: initialize inputs based on different types
      formValues[`${idx}-${colname}`] = '';
    });
  })
  return formValues;
};

const ChaiseFormContainer = (): JSX.Element => {

  const {
    columnModels, forms,
    handleInputHeightAdjustment,
    onSubmit, onInvalid
  } = useRecordedit();

  // type FormDefaultValues = {
  //   [`${name}-min`]: RangeOptions['absMin'];
  //   [`${name}-max`]: RangeOptions['absMax'];
  // };

  /**
   * TODO
   * Need to find a way to dynamically generate the type for FormDefaultValue based on the types of the columns
   */
  const methods = useForm<any>({
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: getFormDefaultValues(forms, columnModels),
    resolver: undefined,
    context: undefined,
    criteriaMode: 'firstError',
    shouldUnregister: false,
    shouldUseNativeValidation: false,
    delayError: undefined
  });

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

    // call provider function
    handleInputHeightAdjustment(fieldName, msgCleared);
  }

  const renderFormProvider = () => {
    return (
      <FormProvider {...methods} >
        <form id='recordedit-form' className='recordedit-form' onSubmit={methods.handleSubmit(onSubmit, onInvalid)}>
          {forms.map((f: number, idx: number) =>
            <ChaiseForm key={f} idx={idx} allowRemove={forms.length>1} />
          )}
        </form>
      </FormProvider>
    )
  }

  return (
    <div className='form-container'>
      {renderFormProvider()}
    </div>
  );
}

export default ChaiseFormContainer;