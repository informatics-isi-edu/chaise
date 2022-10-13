import { ClearInputBtn } from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import '@isrd-isi-edu/chaise/src/assets/scss/_input-switch.scss';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { useEffect, useState } from 'react';
import { RangeOption, TimeStamp } from '@isrd-isi-edu/chaise/src/models/range-picker';
import { useFormContext, useController } from "react-hook-form";

/**
 * Things to consider'
 * 1. need to move the defaultvalue logic to the HOC component
 * 2. how to handle validate on change for each field
 * 3. how to handle merging validation logic for date n time inputs for type timestamp
 * 4. handle integrating these fields into a formik component
 * 5. how to create a HOC that handles/manages multiple forms  
 */

const INTEGER_REGEXP = /^\-?\d+$/;

const FLOAT_REGEXP = /^\-?(\d+)?((\.)?\d+)?$/;

const TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH:mm';

const DATE_FORMAT = 'YYYY-MM-DD';

const integerFieldValidation = {
  value:  INTEGER_REGEXP,
  message: 'Please enter a valid integer value'
};

const numericFieldValidation = {
  value: FLOAT_REGEXP,
  message: 'Please enter a valid decimal value'
};


// https://github.com/react-hook-form/react-hook-form/issues/589
const dateFieldValidation =  (value: string) => {
  const date = windowRef.moment(value, DATE_FORMAT, true);
  return date.isValid() ? true : 'Please enter a valid date value';
};

const timestampFieldValidation = {
  validate: (value: string) => {
    const timestamp = windowRef.moment(value, TIMESTAMP_FORMAT, true);
    return !timestamp.isValid();
  },
  message: 'Please enter a valid date and time value',
};

const validationFunctionMap : { 
  [key: string]: any;
} = {
  'int': integerFieldValidation,
  'float': numericFieldValidation,
  'numeric': numericFieldValidation,
  'date': dateFieldValidation,
  'timestamp': timestampFieldValidation,
};

type NumericFieldProps = {
  /**
   *  the name of the field
   */
  name: string,
  /**
   * the type of numeric field - int | float/numeric
   */
  type: string, 
  /** 
   * placeholder text for int and float input types
   */
  placeholder?: string,
  /**
   * classes for styling the input element
   */
  classes?: string,
  /**
   * classes for styling the clear button
   */
  clearClasses?: string
  /**
   * flag for disabling the input
   */
  disableInput?: boolean,
  /**
   * flag to show error below the input switch component
   */
  displayErrors?: boolean,
  /**
   * the handler function called on input change
   */
  onFieldChange?: ((value: string) => void)
};

const NumericField = ({ 
  name, 
  type, 
  placeholder, 
  classes,
  clearClasses,
  disableInput,
  displayErrors,
  value,
  onFieldChange,
}: NumericFieldProps): JSX.Element => {

  const { setValue, control } = useFormContext();

  const registerOptions = {
    required: false,
    pattern: validationFunctionMap[type],
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const fieldValue = formInput?.field?.value;

  const fieldState = formInput?.fieldState;

  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));
  
  const { error, isTouched } = fieldState;
  
  const clearInput = () => setValue(name, '');

  useEffect(()=>{
    if(onFieldChange){
      onFieldChange(fieldValue);
    }

    if(showClear!=Boolean(fieldValue)){
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);

  useEffect(() => {
    setValue(name, value);
  }, [value])

  return (
    <>
      <div className={`chaise-input-control has-feedback input-switch-numeric ${disableInput ? ' input-disabled' : ''}`}>
        <input placeholder={placeholder} className={`${classes} input-switch`} {...formInput.field} />
        <ClearInputBtn
          btnClassName={`${clearClasses} input-switch-clear`}
          clickCallback={clearInput}
          show={showClear}
        />
      </div>
      { displayErrors && isTouched && error?.message && <span className='input-switch-error'>{error.message}</span> }
    </>
  );
};

type DateFieldProps = {
  /**
   *  the name of the field
   */
  name: string,
  /**
   * the default date value
   */
  value: RangeOption,
  /**
   * classes for styling the input element
   */
  classes?: string,
  /**
   * classes for styling the clear button
   */
  clearClasses?: string
  /**
   * flag for disabling the input
   */
  disableInput?: boolean,
  /**
   * flag to show error below the input switch component
   */
  displayErrors?: boolean,
  /**
   * the handler function called on input change
   */
  onFieldChange?: ((value: string) => void)
};

const DateField = ({ 
  name, 
  classes, 
  clearClasses,
  disableInput,
  displayErrors,
  value,
  onFieldChange,
}: DateFieldProps): JSX.Element => {

  const { setValue, control } = useFormContext();

  const registerOptions = {
    required: false,
    validate: validationFunctionMap['date'],
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const fieldValue = formInput?.field?.value;

  const fieldState = formInput?.fieldState;

  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));
  
  const { error, isTouched } = fieldState;

  const clearInput = () => setValue(name, '');

  useEffect(()=>{
    if(onFieldChange){
      onFieldChange(fieldValue);
    }

    if(showClear!=Boolean(fieldValue)){
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);


  useEffect(() => {
    console.log('value change date useEffect triggered', value, name);
    setValue(name, value);
  }, [value])

  return (
    <>
      <div className={`chaise-input-control has-feedback input-switch-date ${disableInput ? ' input-disabled' : ''}`}>
        <input type='date' className={`${classes} input-switch`} step='1' pattern='\d{4}-\d{2}-\d{2}'
        min='1970-01-01' max='2999-12-31' {...formInput.field} />
        <ClearInputBtn
          btnClassName={`${clearClasses} input-switch-clear`}
          clickCallback={clearInput}
          show={showClear}
        />
      </div>
      { displayErrors && isTouched && error?.message && <span className='input-switch-error'>{error.message}</span> }
    </>
  );
};

type TimestampFieldProps = {
  /**
   *  the name of the field
   */
  name: string,
  /** 
   * placeholder text for numeric and date fields
   */
  placeholder?: string,
  /**
   * classes for styling the input date element
   */
  classes?: string,
  /**
   * classes for styling the input time element
   */
  timeClasses?: string,
  /**
   * classes for styling the clear button
   */
  clearClasses?: string
  /**
   * classes for styling the clear button for time field
   */
  clearTimeClasses?: string
  /**
   * the default date value
   */
  value: TimeStamp,
  /**
   * flag for disabling the input
   */
  disableInput?: boolean,
  /**
   * the handler function called on input change
   */
  onFieldChange?: ((value: string) => void)
};

const TimestampField = ({ 
  name, 
  value, 
  classes, 
  timeClasses, 
  clearClasses,
  clearTimeClasses,
  disableInput,
  onFieldChange 
}: TimestampFieldProps): JSX.Element => {

  const { 
    register,
    formState,
    getFieldState,
    setValue,
    getValues,
    watch 
  } = useFormContext();

  useEffect(() => {
    
    const sub = watch((data, options) => {
      if (options.name in [`${name}-date`, `${name}-date`]) {
        const dateVal = data[`${name}-date`];
        let timeVal = data[`${name}-time`];
        if (dateVal && !timeVal) timeVal = '00:00';
        setValue(name, `${dateVal}T${timeVal}`); 
      }

      if (options.name === `${name}-date`) {
        setValue('lastName', 'bill')
      }
    });


    return () => sub.unsubscribe();
  }, [watch]);

  const registerOptions = {
    disabled: disableInput,
    validate: validationFunctionMap['timestamp'],
  };

  const registerOptionsDate = {
    disabled: disableInput,
  };

  const registerOptionsTime = {
    disabled: disableInput,
  };

  const formInput = register(name, registerOptions); 

  const formInputDate = register(`${name}-date`, registerOptionsDate); 

  const formInputTime = register(`${name}-time`, registerOptionsTime); 

  const { error } = getFieldState(name, formState);

  const { isTouched: isDateTouched } = getFieldState(`${name}-date`, formState);

  const { isTouched: isTimeTouched } = getFieldState(`${name}-time`, formState);

  const clearDate = () => setValue(`${name}-date`, '');
  
  const clearTime = () => setValue(`${name}-time`, '');

  const fieldValue = getValues(name);

  const dateFieldValue = getValues(`${name}-date`);

  const timeFieldValue = getValues(`${name}-time`);

  useEffect(() => {
    onFieldChange && onFieldChange(fieldValue);
  }, [fieldValue]);
 
  return (
    <>
      <div className='input-switch-datetime'>
        <div className={`chaise-input-control has-feedback input-switch-date ${disableInput ? ' input-disabled' : ''}`}>
          <input className={`${classes} input-switch`} type='date' placeholder='YYYY-MM-DD'
          min='1970-01-01' max='2999-12-31' step='1' defaultValue={value} disabled={disableInput} {...formInputDate}/>
          <ClearInputBtn
            btnClassName={`${clearClasses} input-switch-clear`}
            clickCallback={clearDate}
            show={dateFieldValue}
          />
        </div>
        <div className={`chaise-input-control has-feedback input-switch-time ${disableInput ? ' input-disabled' : ''}`}>
          <input className={`${timeClasses} input-switch`} type='time' placeholder='HH:MM' 
          min='00:00' max='23:59' defaultValue='00:00' disabled={disableInput} {...formInputTime}/>
          <ClearInputBtn
            btnClassName={`${clearTimeClasses} input-switch-clear`}
            clickCallback={clearTime}
            show={timeFieldValue}
          />
        </div>
        <input type='hidden' {...formInput}/>
      </div>
      { (isDateTouched || isTimeTouched) && error?.message && <span className='input-switch-error'>{error.message}</span> }
    </>
  );
};



type InputSwitchProps = {
  /**
   * the type of input :
   * int
   * float
   * numeric
   * date
   * timestamp
   */
  type: string,
  /**
   *  the name of the field
   */
  name: string,
  /** 
   * placeholder text for numeric and date fields
   */
  placeholder?: RangeOption,
  /**
   * classes for styling the numeric and date input element
   */
  classes?: string,
  /**
   * classes for styling the time input element
   */
  timeClasses?: string,
  /**
   * classes for styling the clear button
   */
  clearClasses?: string
  /**
   * classes for styling the clear button for time field
   */
  clearTimeClasses?: string
  /** 
   * the default date value being used in case of date and timestamp types
   */
  value: RangeOption,
  /**
   * flag for disabling the input
   */
  disableInput?: boolean,
  /**
   * flag to show error below the input switch component
   */
  displayErrors?: boolean,
  /**
   * the handler function called on input change
   */
  onFieldChange?: ((value: string) => void)
};

const InputSwitch = ({ 
  type,
  name, 
  placeholder = 'Enter',
  classes = '',
  timeClasses = '',
  clearClasses,
  clearTimeClasses,
  value,
  disableInput,
  displayErrors = true,
  onFieldChange 
}: InputSwitchProps): JSX.Element | null => {

  return (() => {
    switch (type) {
      case 'timestamp':
        return null
        return <TimestampField 
          name={name} 
          classes={classes} 
          timeClasses={timeClasses} 
          clearClasses={clearClasses}
          clearTimeClasses={clearTimeClasses}
          value={value as TimeStamp}
          disableInput={disableInput}
          onFieldChange={onFieldChange} 
        />
      case 'int':
      case 'float':
      case 'numeric':
        return <NumericField 
          type={type}
          name={name}   
          displayErrors={displayErrors} 
          classes={classes} 
          value={value}
          placeholder={placeholder} 
          clearClasses={clearClasses}
          disableInput={disableInput}
          onFieldChange={onFieldChange} 
        />
      case 'date':
        // return null;
        return <DateField 
          name={name} 
          classes={classes}
          clearClasses={clearClasses}
          value={value}
          disableInput={disableInput}
          onFieldChange={onFieldChange} 
        />
      default:
        return null
    }
  })();
};

export default InputSwitch;