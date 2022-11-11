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
const Form = ({ name, columns, classes = '', idx, f, hideCross, hMap }) => {

  const { onSubmit, onInvalid } = useRecordedit();

  // type FormDefaultValues = {
  //   [`${name}-min`]: RangeOptions['absMin'];
  //   [`${name}-max`]: RangeOptions['absMax'];
  // };

  /**
   * TODO
   * Need to find a way to dynamically generate the type for FormDefaultValue based on the types of the columns
   */

  const handleCrossClick = () => fireCustomEvent('remove-form', '.form-container', { idx: f });

  const methods = useForm<any>({
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: getFormDefaultValues(name, columns),
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
          {columns.map((c, i) => {

            const colName = c?.displayname?.value || i;
            const height = colName in hMap ? `${hMap[colName]}px` : 'auto';

            return (
              <InputSwitch
                key={c?.displayname?.value || i}
                displayErrors={true}
                name={`${name}-${makeSafeIdAttr(c?.displayname?.value)}`}
                type={getInputType(c.type)}
                // type='int'
                containerClasses={'column-cell entity-value'}
                // value={0}
                classes='column-cell-input'
                placeholder={0}
                styles={{ 'height': height }}
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

  const handleCrossClick = () => fireCustomEvent('remove-form', '.form-container', { idx: f });

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
    hMap[c?.displayname?.value] = [-1];
  });
  return hMap;
}

const handleAddForm = (hMap) => {
  const hMapCpy = simpleDeepCopy(hMap);
  hMapCpy.keys().forEach(k => {
    hMapCpy[k].append(-1);
  });
  return hMapCpy;
}

const handleDeleteForm = (hMap, idx) => {
  const hMapCpy = simpleDeepCopy(hMap);
  hMapCpy.keys().forEach(k => {
    hMapCpy[k].splice(idx, 1);
  });
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

  // key: [auto auto 67]

  // deep copy logic

  const addForm = () => {
    setForms(forms => [...forms, forms.length + 1]);
    setHMap(hMap => {
      return handleAddForm(hMap);
    });
  };


  const removeForm = (event) => {
    console.log({ event });
    const f = event.detail.idx;
    setForms(forms => {
      const idx = forms.indexOf(f);
      forms.splice(idx, 1);
      return [...forms];
    });
    // setHMap(hMap => )
  }

  const handleHeightAdjustment = (event) => {
    console.log('height adjustment: ', { event });
    const ele = document.querySelector(event.detail.inputFieldName)
    const height = ele?.offsetHeight || 0;

    const colName = event.detail.inputFieldName.split('-').slice(-1)[0];

    console.log({ colName, height });

    // if(!(colName in hMap) || hMap[colName]!=height){    
    //   setHMap(hMap => {
    //     const newHMap = {...hMap, [colName]: height };
    //     console.log({newHMap})
    //     return newHMap;
    //   });
    // }
  }

  useEffect(() => {
    const formContainer = document.querySelector('.form-container') as HTMLElement;

    formContainer.addEventListener('add-form', addForm);

    formContainer.addEventListener('remove-form', removeForm);

    formContainer.addEventListener('input-switch-error-update', handleHeightAdjustment);



    return () => {
      formContainer.removeEventListener('add-form', addForm);
      formContainer.removeEventListener('remove-form', removeForm);
      formContainer.removeEventListener('input-switch-error-update', handleHeightAdjustment);
    }
  }, []);

  const hideCrossBtn = forms.length == 1;

  const elements = forms.map((f, idx) => <Form name={f} hMap={hMap} columns={columns} idx={idx} key={f} f={f} hideCross={hideCrossBtn} />)

  return (
    <div className='form-container'>
      {elements}
    </div>
  );
}

export default FormContainer;