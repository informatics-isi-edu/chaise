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



const getFormDefaultValues = (name: string, columns: any[]) => {
  // TODO: initialize inputs
  const formValues: any = {};
  columns.forEach(c => {
    const colname = makeSafeIdAttr(c?.displayname?.value)
    // initialize inputs based on different types
    formValues[`${name}-0-${colname}`] = '';
  });
  console.log(formValues);
  return formValues;
};

type FormProps = {
  columns: any[],
  classes?: string,
  idx: number,
  f: number,
  hideCross: boolean,
  hMap: any
}

const Form = ({ columns, classes = '', idx, f, hideCross, hMap }: FormProps) => {

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
    defaultValues: getFormDefaultValues('' + f, columns),
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
                // type='numeric'
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

type CrossBtnProps = {
  handleClick: () => void
}

const CrossBtn = ({ handleClick }: CrossBtnProps): JSX.Element => (
  <ChaiseTooltip
    placement='bottom'
    tooltip='Click to remove this record from the form.'
  >
    <span className='selected-chiclet-remove form-cross-btn' onClick={handleClick}>
      <i className='fa-solid fa-xmark selected-chiclet-remove-icon' />
    </span>
  </ChaiseTooltip>
);

type BlackBoxProps = {
  idx: string,
  f: string,
  hideCross: boolean
}

const BlackBox = ({ idx, f, hideCross }: BlackBoxProps): JSX.Element => {

  const handleCrossClick = () => fireCustomEvent('remove-form', '.form-container', { idx, f_idx: f });
    
  return (
    <div className='black-box'>
      <span>{`sample form container ${idx + 1}`}</span>
      {!hideCross && <CrossBtn handleClick={handleCrossClick} />}
    </div>
  );
};

const generateInitialHMap = (columns: any[]) => {
  const hMap: any = {};
  columns.forEach(c => {
    const colname = makeSafeIdAttr(c?.displayname?.value);
    hMap[colname] = [-1];
  });
  return hMap;
}

const handleHMapAddForm = (hMap: any) => {
  const hMapCpy = simpleDeepCopy(hMap);
  Object.keys(hMapCpy).forEach(k => {
    hMapCpy[k].push(-1);
  });
  return hMapCpy;
}

const handleHMapDeleteForm = (hMap: any, idx: string) => {
  const hMapCpy = simpleDeepCopy(hMap);
  Object.keys(hMapCpy).forEach(k => {
    hMapCpy[k].splice(idx,1);
  });
  return hMapCpy;
}

const handleUpdateHMap = (hMap: any, colName: string, idx: string, value: number) => {
  const hMapCpy = simpleDeepCopy(hMap);
  
  hMapCpy[colName][idx] = value;

  fireCustomEvent('update-record-column-height', '.entity-key-column', { colName, height: Math.max(...hMapCpy[colName]) });

  return hMapCpy;
}

type FormContainerProps = {
  columns: any[]
}

const FormContainer = ({ columns }: FormContainerProps): JSX.Element => {
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
    setHMap((hMap: any) => {
      return handleHMapAddForm(hMap);
    });
  };

  // TODO: event type
  const removeForm = (event: any) => {
    const f = event.detail.f_idx;
    const idx = event.detail.idx;
    setForms(forms => {
      forms.splice(idx, 1);
      return [...forms];
    });
    setHMap((hMap: any) => {
      return handleHMapDeleteForm(hMap, idx);
    });
  }

  const handleHeightAdjustment = (event: any) => {
    const fieldName = event.detail.inputFieldName;

    const msgCleared = event.detail.msgCleared;

    const ele: HTMLElement | null = document.querySelector(`.input-switch-container-${fieldName}`);
    
    const height = ele?.offsetHeight || 0;
    
    const r = /(\d*)-(\d*)-(.*)/;

    const result = r.exec(fieldName) || [];

    const idx = result[2];

    const colName = result[3];

    // how to handle this ? get default heights
    const heightSet = height == 47 || msgCleared ? -1 : height;

    setHMap((hMap: any) => {
      return handleUpdateHMap(hMap, colName, idx, heightSet);
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