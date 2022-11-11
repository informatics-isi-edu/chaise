// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch';

// hooks
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';
import { useEffect, useState, useRef } from 'react';
import { useForm, FormProvider } from "react-hook-form";

// utils
import { fireCustomEvent, getInputType } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';



const getFormDefaultValues = (name, columns) => {
  // TODO: initialize inputs
  const formValues = {};
  columns.forEach(c => {
    // initialize inputs based on different types
    formValues[`${name}-{c}`] = '';
  });
  return formValues;
};

// TODO FormProps
const Form = ({ columns, classes = '', idx, f, hideCross, hMap }) => {

  const { onSubmit, onInvalid } = useRecordedit();

  // type FormDefaultValues = {
  //   [`${name}-min`]: RangeOptions['absMin'];
  //   [`${name}-max`]: RangeOptions['absMax'];
  // };

  /**
   * TODO
   * Need to find a way to dynamically generate the type for FormDefaultValue based on the types of the columns
   */

  const handleCrossClick = () => fireCustomEvent('remove-form', '.form-container', { idx, f_idx: f });

  const methods = useForm<any>({
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: getFormDefaultValues(f, columns),
    resolver: undefined,
    context: undefined,
    criteriaMode: "firstError",
    shouldUnregister: false,
    shouldUseNativeValidation: false,
    delayError: undefined
  });

  return (
    <FormProvider {...methods} >
      <form id='recordedit-form' className='record-edit-form' onSubmit={methods.handleSubmit(onSubmit, onInvalid)}>
        {/* {!hideCross && <CrossBtn handleClick={handleCrossClick}/>} */}
        <div className={`column-form ${classes}`}>  
          {columns.map((c: any) => {

            const colName = makeSafeIdAttr(c?.displayname?.value);
            const height = Math.max(...hMap[colName]);
            const heightparam = height == -1 ? 'auto' : `${height}px`;

            return (
              <InputSwitch
                key={colName}  
                displayErrors={true}
                name={`${f}-${idx}-${colName}`}
                type={getInputType(c.type)}
                containerClasses={'column-cell entity-value'}
                // value={0}
                classes='column-cell-input'
                placeholder={0}
                styles={{'height' : heightparam}}
              />
            );
          })}
        </div>
      </form>
    </FormProvider>
  );

};

const CrossBtn = ({ handleClick }) => (
  <ChaiseTooltip
    placement='bottom'
    tooltip='Click to remove this record from the form.'
  >
    <span className='selected-chiclet-remove form-cross-btn' onClick={handleClick}>
      <i className='fa-solid fa-xmark selected-chiclet-remove-icon' />
    </span>
  </ChaiseTooltip>
);

const BlackBox = ({ idx, f, hideCross }) => {

  const handleCrossClick = () => fireCustomEvent('remove-form', '.form-container', { idx, f_idx: f });
    
  return (
    <div className='black-box'>
      <span>{`sample form container ${idx + 1}`}</span>
      {!hideCross && <CrossBtn handleClick={handleCrossClick} />}
    </div>
  );
};

const generateInitialHMap = (columns) => {
  const hMap = {};
  columns.forEach(c => {
    const colname = makeSafeIdAttr(c?.displayname?.value);
    hMap[colname] = [-1];
  });
  return hMap;
}

const handleHMapAddForm = (hMap) => {
  const hMapCpy = simpleDeepCopy(hMap);
  Object.keys(hMapCpy).forEach(k => {
    hMapCpy[k].push(-1);
  });
  return hMapCpy;
}

const handleHMapDeleteForm = (hMap, idx) => {
  const hMapCpy = simpleDeepCopy(hMap);
  Object.keys(hMapCpy).forEach(k => {
    hMapCpy[k].splice(idx,1);
  });
  return hMapCpy;
}

const handleUpdateHMap = (hMap, colName, idx, value) => {
  const hMapCpy = simpleDeepCopy(hMap);
  
  hMapCpy[colName][idx] = value;

  fireCustomEvent('update-record-column-height', '.record-edit-column', { colName, height: Math.max(...hMapCpy[colName]) });

  return hMapCpy;
}

const FormContainer = ({ columns }) => {
  /*
    Here a unique key to reference each form will be stored in the forms state variable : f_i
  */

  const [forms, setForms] = useState([1]);

  /**
   * the height array is an array where h[i] is :
   * -1: auto height
   * value: height in px for that 
   */

  const [hMap, setHMap] = useState(generateInitialHMap(columns));

  const addForm = () => {
    setForms(forms => [...forms, forms[forms.length-1]+1]);
    setHMap(hMap => {
      return handleHMapAddForm(hMap);
    });
  };

  const removeForm = (event) => {
    const f = event.detail.f_idx;
    const idx = event.detail.idx;
    setForms(forms => {
      forms.splice(idx, 1);
      return [...forms];
    });
    setHMap(hMap => {
      return handleHMapDeleteForm(hMap, idx);
    });
  }

  const handleHeightAdjustment = (event) => {
    const fieldName = event.detail.inputFieldName;

    const msgCleared = event.detail.msgCleared;

    const ele = document.querySelector(`.input-switch-container-${fieldName}`);
    
    const height = ele?.offsetHeight || 0;
    
    const r = /(\d*)-(\d*)-(.*)/;

    const result = r.exec(fieldName) || [];

    const idx = result[2];

    const colName = result[3];

    // how to handle this ? get default heights
    const heghtSet = height == 47 || msgCleared ? -1 : height;

    setHMap(hMap => {
      return handleUpdateHMap(hMap, colName, idx, heghtSet);
    });
  }

  useEffect(() => {
    const formContainer = document.querySelector('.form-container') as HTMLElement;
    formContainer.addEventListener('add-form', addForm);
    formContainer.addEventListener('remove-form', removeForm);
    formContainer.addEventListener('input-switch-error-update', handleHeightAdjustment);

    return ()=> {
      formContainer.removeEventListener('add-form', addForm);
      formContainer.removeEventListener('remove-form', removeForm);
      formContainer.removeEventListener('input-switch-error-update', handleHeightAdjustment);
    }
  }, []);

  const hideCrossBtn = forms.length == 1;
  
  const elements = forms.map((f, idx) => <Form f={f} hMap={hMap} columns={columns} idx={idx} key={f} hideCross={hideCrossBtn}/>)

  return (
    <div className='form-container'>
      {elements}
    </div>
  );
}

export default FormContainer;