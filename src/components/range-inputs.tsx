import '@isrd-isi-edu/chaise/src/assets/scss/_range-input.scss';

// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// models
import { RangeOptions, TimeStamp } from '@isrd-isi-edu/chaise/src/models/range-picker';

// services
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

import { useForm, FormProvider, useWatch } from "react-hook-form";


// const INTEGER_REGEXP = /^\-?\d+$/;

// const FLOAT_REGEXP = /^\-?(\d+)?((\.)?\d+)?$/;

const TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const DATE_FORMAT = 'YYYY-MM-DD';

// /**
//  * an object for mapping the error types to error messages
//  */
// const errorMsgMap: {
//   [key: string]: string;
// } = {
//   'range': 'From value cannot be greater than the To value.',
//   'int': 'Please enter a valid integer value.',
//   'float': 'Please enter a valid decimal value.',
//   'numeric': 'Please enter a valid decimal value.',
//   'date': 'Please enter a valid date value.',
//   'timestamp': 'Please enter a valid date and time value.'
// };

type RangeInputsProps = {
  /**
   * an string for the type of input expected:
   * int
   * float
   * numeric
   * date
   * timestamp
   */
  inputType: string,
  /**
   * use for applying custom styles on the component
   */
  classes?: string,
  /**
   * callback for applying the range inputs
   */
  addRange: Function,
  /**
   * the min value for the full dataset to show on load
   */
  absMin: RangeOptions['absMin'],
  /**
   * the max value for the full dataset to show on load
   */
  absMax: RangeOptions['absMax'],
  /**
   * whether the form should be disabled
   */
  disabled?: boolean
  /**
   * a name used for the react-hook-form (must be unique for each range-input on a page)
   */
  name: string,
};

const getType = (inputType: string): string => {
  let type: string;
  switch (inputType) {
    case 'int2':
    case 'int4':
    case 'int8':
      type = 'int';
      break;
    case 'float4':
    case 'float8':
      type = 'float'
      break;
    case 'numeric':
      type = 'numeric';
      break;
    case 'date':
      type = 'date';
      break;
    case 'timestamp':
    case 'timestamptz':
      type = 'timestamp';
      break;
    default:
      type = 'invalid_type'
  }

  return type;
}

const RangeInputs = ({ inputType, classes, addRange, absMin, absMax, disabled, name }: RangeInputsProps) => {
  // const fromRef = useRef<HTMLInputElement>(null);
  // const toRef = useRef<HTMLInputElement>(null);
  // const fromTimeRef = useRef<HTMLInputElement>(null);
  // const toTimeRef = useRef<HTMLInputElement>(null);

  const type = getType(inputType);

  const [error, setError] = useState<string | null>(null);

  const [disableSubmit, setDisableSubmit] = useState<boolean>(disabled || (type === 'int' || type === 'float' || type === 'numeric'));
  // const [showClearInputs, setShowClearInput] = useState({
  //   from: type === 'date' || type === 'timestamp',
  //   fromTime: true,
  //   to: type === 'date' || type === 'timestamp',
  //   toTime: true
  // });

  useLayoutEffect(() => {
  // enable the submit button if we have a min/max
  setDisableSubmit(!!disabled);
  }, [absMax, absMin])

  // if absMin or absMax change, update state
  // useLayoutEffect(() => {
  //   if ((!absMin && !absMax) || (!fromRef.current || !toRef.current)) return;

  //   // enable the submit button if we have a min/max
  //   setDisableSubmit(!!disabled);

  //   if (type === 'timestamp') {
  //     if (!fromTimeRef.current || !toTimeRef.current) return;
      
  //     const min = absMin as TimeStamp;
  //     fromRef.current.value = min.date;
  //     fromTimeRef.current.value = min.time;
      
  //     const max = absMax as TimeStamp;
  //     toRef.current.value = max.date;
  //     toTimeRef.current.value = max.time;

  //     setShowClearInput({
  //       from: Boolean(min.date),
  //       fromTime: Boolean(min.time),
  //       to: Boolean(max.date),
  //       toTime: Boolean(max.time)
  //     });
  //   } else {
  //     fromRef.current.value = absMin as string;
  //     toRef.current.value = absMax as string;

  //     setShowClearInput({
  //       from: Boolean(absMin),
  //       fromTime: true,
  //       to: Boolean(absMax),
  //       toTime: true
  //     });
  //   } 
  // }, [absMin, absMax]);

  // const formatTimeValues = () => {
  //   const fromDateVal = fromRef?.current?.value;
  //   let fromTimeVal = fromTimeRef?.current?.value;

  //   if (fromDateVal && !fromTimeVal) fromTimeVal = '00:00:00';

  //   const toDateVal = toRef?.current?.value;
  //   let toTimeVal = toTimeRef?.current?.value;

  //   if (toDateVal && !toTimeVal) toTimeVal = '00:00:00';

  //   return {
  //     fromVal: fromDateVal || fromTimeVal ? `${fromDateVal}T${fromTimeVal}` : '',
  //     toVal: toDateVal || toTimeVal ? `${toDateVal}T${toTimeVal}` : '',
  //   };
  // }

  // /**
  //  * validates both fields and shows/hides validation errors
  // */
  // const handleChange = () => {
  //   setShowClearInput({
  //     from: Boolean(fromRef?.current?.value),
  //     to: Boolean(toRef?.current?.value),
  //     fromTime: Boolean(fromTimeRef?.current?.value),
  //     toTime: Boolean(toTimeRef?.current?.value),
  //   });

  //   const formatedValues = type === 'timestamp' ? formatTimeValues()
  //     : { fromVal: fromRef?.current?.value || '', toVal: toRef?.current?.value || '' };

  //   const validatedResult = validateValue(formatedValues.fromVal) && validateValue(formatedValues.toVal);

  //   const areBothFieldsEmpty = !formatedValues.fromVal && !formatedValues.toVal;

  //   setDisableSubmit(!!disabled || areBothFieldsEmpty || !validatedResult);

  //   if (!validatedResult) setError(errorMsgMap[type])
  //   else setError(null);
  // }

  // /**
  //  * performs input format validation based on input type
  // */
  // const validateValue = (value: string): boolean => {
  //   if (!value) return true;

  //   if (type === 'int') return INTEGER_REGEXP.test(value);

  //   if (type === 'float' || type === 'numeric') return FLOAT_REGEXP.test(value);

  //   /**in case type is timestamp and both date n time values are null */
  //   if (type === 'timestamp' && !value) return true;

  //   /**type is either date or timestamp */
  //   const formatString = type === 'date' ? DATE_FORMAT : TIMESTAMP_FORMAT;
  //   const date = momentJS(value, formatString, true);
  //   return date.isValid();
  // }

  // const validateValues = (fromVal: string, toVal: string): string => {
  //   const isfromValid = validateValue(fromVal);

  //   const isToValid = validateValue(toVal);

  //   if (!isfromValid || !isToValid) return type;

  //   /**if only one field is non null then don't perform range check */
  //   if (!fromVal || !toVal) return 'valid';

  //   /**both from and to values are now valid so perform range validations */
  //   return rangeCheck(fromVal, toVal) ? 'valid' : 'range';
  // }

  // const handleSubmit = () => {
  //   const formatedValues = type === 'timestamp' ? formatTimeValues()
  //     : { fromVal: fromRef?.current?.value || '', toVal: toRef?.current?.value || '' };

  //   const validatedResult = validateValues(formatedValues.fromVal, formatedValues.toVal);

  //   if (validatedResult === 'valid') {
  //     /* clear out any previous errors when a new submission is validated */
  //     setError(null);

  //     addRange(formatedValues.fromVal, formatedValues.toVal);
  //   } else {
  //     setError(errorMsgMap[validatedResult]);
  //   }
  // };

  const classTypeName = (type === 'int' || type === 'float' || type === 'numeric') ? 'numeric-width' : type === 'date' ? 'date-width' : 'time-width';

  // addRange -> onSubmit post form level validation

  type FormDefaultValues = {
    [`${name}-min`]: RangeOptions['absMin'];
    [`${name}-max`]: RangeOptions['absMax'];
  };

  const defVals = {
    [`${name}-min`] : absMin,
    [`${name}-max`] : absMax
  };

  console.log({defVals, type, absMin, absMax});

  const methods = useForm<FormDefaultValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defVals,
    resolver: undefined,
    context: undefined,
    criteriaMode: "firstError",
    shouldUnregister: false,
    shouldUseNativeValidation: false,
    delayError: undefined
  });

  /**
   * performs basic range validation : from_value > to_value
  */
  const rangeCheck = (fromVal: string, toVal: string): boolean => {
    if (type === 'int') return parseInt(fromVal) < parseInt(toVal);

    if (type === 'float' || type === 'numeric') return parseFloat(fromVal) < parseFloat(toVal);

    /**type is either date or timestamp */
    const formatString = type === 'date' ? DATE_FORMAT : TIMESTAMP_FORMAT;
    const fromDate = windowRef.moment(fromVal, formatString, true);
    const toDate = windowRef.moment(toVal, formatString, true);
    return toDate.diff(fromDate) > 0
  }

  // const validateValues = (): string => {
  //   const isfromValid = validateValue(fromVal);

  //   const isToValid = validateValue(toVal);

  //   if (!isfromValid || !isToValid) return type;

  //   /**if only one field is non null then don't perform range check */
  //   if (!fromVal || !toVal) return 'valid';

  //   /**both from and to values are now valid so perform range validations */
  //   return rangeCheck(fromVal, toVal) ? 'valid' : 'range';
  // }

  const validateValues = (fromVal, toVal) => { 
    /**if only one field is non null then don't perform range check */
    if (!fromVal || !toVal) return 'valid';

    /**both from and to values are now valid so perform range validations */
    return rangeCheck(fromVal, toVal) ? 'valid' : 'range';
  };

  const onSubmit = (data) => {
    let fromVal = data[`${name}-min`];

    let toVal = data[`${name}-max`];

    const validatedResult = validateValues(fromVal, toVal);

    if (validatedResult === 'valid') {
      /* clear out any previous errors when a new submission is validated */
      setError(null);
      // addRange(fromVal, toVal);
      console.log('data submitted ::::: ', fromVal, toVal);
    } else {
      setError('From value cannot be greater than the To value');
    }
  }

  useEffect(() => {
    let fromVal = methods.getValues(`${name}-min`);

    let toVal = methods.getValues(`${name}-max`);

    setDisableSubmit(!!disabled || (!fromVal && !toVal));
  }, [disabled]);

  const fromVal = useWatch({ control: methods.control, name: `${name}-min` });

  const toVal = useWatch({ control: methods.control, name: `${name}-max` });

  console.log('watched values change::::: ', fromVal, toVal, type);

  /**
   * get form errors and set error message
   */

  const formErrors = methods.formState.errors;

  const errMsg = formErrors[`${name}-min`]?.message || formErrors[`${name}-max`]?.message || '';    
  
  if(error!=errMsg) setError(errMsg);

  // let fromVal = methods.getValues(`${name}-min`);

  // let toVal = methods.getValues(`${name}-max`);

  const areBothFieldsEmpty = !fromVal && !toVal;

  let shouldDisable = Boolean(errMsg) || areBothFieldsEmpty;

  if (shouldDisable!=disableSubmit) setDisableSubmit(shouldDisable);

  return (
    <div className={classes}>
      <div className='range-input-container range-inputs-width'>
      <FormProvider {...methods} > 
        <form className='range-input-form' onSubmit={methods.handleSubmit(onSubmit)}>
          <div className={`range-input ${classTypeName}`}>
            <label>From:
              <InputSwitch
                displayErrors={false}
                name={`${name}-min`}
                type={type}
                value={absMin}
                placeholder={absMin}
                // disableInput={disableSubmit}
                inputClasses={type === 'date' || type === 'timestamp' ? 'ts-date-range-min' : 'range-min'}
                timeClasses='ts-time-range-min'
                clearClasses={type === 'date' || type === 'timestamp' ? 'min-date-clear' : 'min-clear'} 
                clearTimeClasses='min-time-clear'
              />
            </label>
          </div>
          <div className={`range-input ${classTypeName}`}>
            <label>To:
              <InputSwitch
                displayErrors={false}
                name={`${name}-max`}
                type={type}
                value={absMax}
                placeholder={absMax}
                // disableInput={disableSubmit}
                inputClasses={type === 'date' || type === 'timestamp' ? 'ts-date-range-max' : 'range-max'}
                timeClasses='ts-time-range-max'
                clearClasses={type === 'date' || type === 'timestamp' ? 'max-date-clear' : 'max-clear'}
                clearTimeClasses='max-time-clear'
              />
            </label>
          </div>
          <button type="submit" className='chaise-btn chaise-btn-primary range-input-submit-btn' disabled={disableSubmit}>
            <span className='chaise-btn-icon fa-solid fa-check' />
          </button>
        </form>
        </FormProvider>
      </div>
      {
        error && <span className='range-input-error'>{error}</span>
      }
    </div>
  );


  // return (
  //   <div className={classes}>
  //     <div className='range-input-container range-inputs-width'>
  //       <div className={`range-input ${classTypeName}`}>
  //         <label>From:
  //           <InputSwitch
  //             reference={fromRef}
  //             timeRef={fromTimeRef}
  //             type={type}
  //             value={absMin}
  //             placeholder={absMin}
  //             datePlaceholder={(absMin as TimeStamp)?.date}
  //             timePlaceholder={(absMin as TimeStamp)?.time}
  //             showClearBtn={showClearInputs.from && !disabled}
  //             showClearTimeBtn={showClearInputs.fromTime && !disabled}
  //             disableInput={disabled}
  //             handleChange={handleChange}
  //             classes='range-min'
  //             dateClasses='ts-date-range-min'
  //             timeClasses='ts-time-range-min'
  //             clearClasses='min-clear'
  //             dateClearClasses='min-date-clear'
  //             timeClearClasses='min-time-clear'
  //           />
  //         </label>
  //       </div>
  //       <div className={`range-input ${classTypeName}`}>
  //         <label>To:
  //           <InputSwitch
  //             reference={toRef}
  //             timeRef={toTimeRef}
  //             type={type}
  //             value={absMax}
  //             placeholder={absMax}
  //             datePlaceholder={(absMax as TimeStamp)?.date}
  //             timePlaceholder={(absMax as TimeStamp)?.time}
  //             showClearBtn={showClearInputs.to && !disabled}
  //             showClearTimeBtn={showClearInputs.toTime && !disabled}
  //             disableInput={disabled}
  //             handleChange={handleChange}
  //             classes='range-max'
  //             dateClasses='ts-date-range-max'
  //             timeClasses='ts-time-range-max'
  //             clearClasses='max-clear'
  //             dateClearClasses='max-date-clear'
  //             timeClearClasses='max-time-clear'
  //           />
  //         </label>
  //       </div>

  //     </div>
  //     {
  //       error && <span className='range-input-error'>{error}</span>
  //     }
  //   </div>
  // );
};

export default RangeInputs;