import '@isrd-isi-edu/chaise/src/assets/scss/_input-switch.scss';

// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import ColorField from '@isrd-isi-edu/chaise/src/components/input-switch/color-field';
import BooleanField from '@isrd-isi-edu/chaise/src/components/input-switch/boolean-field';

// hooks
import { useEffect, useState, useRef } from 'react';
import { useFormContext, useController, useWatch } from 'react-hook-form';

// models
import { RangeOption, TimeStamp } from '@isrd-isi-edu/chaise/src/models/range-picker';
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { ERROR_MESSAGES, getDisabledInputValue } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

import { ResizeSensor } from 'css-element-queries';




/**
 * Things to consider
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
  message: ERROR_MESSAGES.INVALID_INTEGER
};

const numericFieldValidation = {
  value: FLOAT_REGEXP,
  message: ERROR_MESSAGES.INVALID_NUMERIC
};


// https://github.com/react-hook-form/react-hook-form/issues/589
const dateFieldValidation =  (value: string) => {
  if (!value) return;
  const date = windowRef.moment(value, DATE_FORMAT, true);
  return date.isValid() || ERROR_MESSAGES.INVALID_DATE;
};

const timestampFieldValidation = (value: string) => {
  if (!value) return;
  const timestamp = windowRef.moment(value, TIMESTAMP_FORMAT, true);
  return timestamp.isValid() || ERROR_MESSAGES.INVALID_TIMESTAMP;
};

const validationFunctionMap : {
  [key: string]: any;
} = {
  'int': integerFieldValidation,
  'integer2': integerFieldValidation,
  'integer4': integerFieldValidation,
  'integer8': integerFieldValidation,
  'float': numericFieldValidation,
  'number': numericFieldValidation,
  'date': dateFieldValidation,
  'timestamp': timestampFieldValidation,
};

const LongTextField = ({ 
  name, 
  placeholder, 
  classes,
  inputClasses,
  clearClasses,
  disableInput,
  displayErrors,
  value,
  containerClasses,
  styles,
  onFieldChange,
}: TextFieldProps): JSX.Element => {
  const { setValue, control, clearErrors } = useFormContext();

  const textAreaRef = useRef(null);

  const registerOptions = {
    required: false,
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const field = formInput?.field;
  
  const fieldValue = field?.value;

  const fieldState = formInput?.fieldState;

  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));
  
  const { error, isTouched } = fieldState;

  useEffect(() => {
    const textAreaElement = textAreaRef.current;
    const sensor = new ResizeSensor(textAreaElement, () => {
      fireCustomEvent('input-switch-error-update', `.input-switch-container-${name}`, { inputFieldName: name, msgCleared: false, type: 'longtext' });
    });

    return () => {
      sensor.detach();
    }
  }, []);

  const clearInput = () => {
    setValue(name, '');
    clearErrors(name);
  }

  useEffect(()=>{
    if(onFieldChange){
      onFieldChange(fieldValue);
    }

    if(showClear!=Boolean(fieldValue)){
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);

  useEffect(() => {
    if (value === undefined) return;
    setValue(name, value);
  }, [value]);

  const handleChange = (v: any) => {
    field.onChange(v);
    field.onBlur();
  };

  useEffect(() => {
    fireCustomEvent('input-switch-error-update', `.input-switch-container-${name}`, { inputFieldName: name, msgCleared: !Boolean(error?.message), type: 'longtext' });
  }, [error?.message]);

  return (
    <div className={`${containerClasses} input-switch-container-${name}`} style={styles}>
      <div className={`chaise-input-control has-feedback content-box ${classes} ${disableInput ? ' input-disabled' : ''}`} ref={textAreaRef}>
        <textarea placeholder={placeholder} rows={5} className={`${inputClasses} input-switch`} {...field} onChange={handleChange} />
        <ClearInputBtn
          btnClassName={`${clearClasses} input-switch-clear`}
          clickCallback={clearInput}
          show={showClear}
        />
      </div>
      { displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span> }
    </div>
  );
}

type TextFieldProps = {
  /**
   *  the name of the field
   */
  name: string,
  /**
  * placeholder text
  */
  placeholder?: string,
  /**
  * classes for styling the input element
  */
  classes?: string,
  inputClasses?: string,
  containerClasses?: string,
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
  value: string,
  styles?: any,
  /**
  * the handler function called on input change
  */
  onFieldChange?: ((value: string) => void)
};

const TextField = ({
  name,
  placeholder,
  classes,
  inputClasses,
  clearClasses,
  disableInput,
  displayErrors,
  value,
  containerClasses,
  styles,
  onFieldChange,
}: TextFieldProps): JSX.Element => {

  const { setValue, control, clearErrors } = useFormContext();

  const registerOptions = {
    required: false,
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const field = formInput?.field;

  const fieldValue = field?.value;

  const fieldState = formInput?.fieldState;

  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));

  const { error, isTouched } = fieldState;

  const clearInput = () => {
    setValue(name, '');
    clearErrors(name);
  }

  useEffect(()=>{
    if(onFieldChange){
      onFieldChange(fieldValue);
    }

    if(showClear!=Boolean(fieldValue)){
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);

  useEffect(() => {
    if (value === undefined) return;
    setValue(name, value);
  }, [value]);

  const handleChange = (v: any) => {
    field.onChange(v);
    field.onBlur();
  };

  useEffect(() => {
    fireCustomEvent('input-switch-error-update', `.input-switch-container-${name}`, { inputFieldName: name, msgCleared: !Boolean(error?.message), type: 'text' });
  }, [error?.message]);

  return (
    <div className={`${containerClasses} input-switch-container-${name}`} style={styles}>
      <div className={`chaise-input-control has-feedback ${classes} ${disableInput ? ' input-disabled' : ''}`}>
        <input placeholder={placeholder} className={`${inputClasses} input-switch`} {...field} onChange={handleChange} />
        <ClearInputBtn
          btnClassName={`${clearClasses} input-switch-clear`}
          clickCallback={clearInput}
          show={showClear}
        />
      </div>
      { displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span> }
    </div>
  );
};

type DisabledFieldProps = {
  classes?: string;
  containerClasses?: string;
  inputClasses?: string;
  name: string;
  placeholder: string;
}

const DisabledField = ({
  classes,
  containerClasses,
  inputClasses,
  name,
  placeholder
}: DisabledFieldProps): JSX.Element => {

  const { control } = useFormContext();

  const registerOptions = {
    required: false
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  return (
    <div className={`${containerClasses} input-switch-container-${name}`}>
      <div className={`chaise-input-control input-disabled ${classes}`}>
        <input
          className={`${inputClasses} input-switch`}
          disabled={true}
          placeholder={placeholder}
          {...formInput.field}
        />
      </div>
    </div>
  )
}

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
  clearClasses?: string,
  inputClasses?: string,
  containerClasses?: string,
  styles?: any,
  /**
   * flag for disabling the input
   */
  disableInput?: boolean,
  /**
   * flag to show error below the input switch component
   */
  displayErrors?: boolean,
  value: string,
  /**
   * the handler function called on input change
   */
  onFieldChange?: ((value: string) => void),
};

const NumericField = ({
  name,
  type,
  placeholder,
  classes,
  inputClasses,
  clearClasses,
  disableInput,
  displayErrors,
  value,
  containerClasses,
  styles,
  onFieldChange,
}: NumericFieldProps): JSX.Element => {

  const { setValue, control, clearErrors } = useFormContext();

  const registerOptions = {
    required: false,
    pattern: validationFunctionMap[type],
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const field = formInput?.field;

  const fieldValue = field?.value;

  const fieldState = formInput?.fieldState;

  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));

  const { error, isTouched } = fieldState;

  const clearInput = () => {
    setValue(name, '');
    clearErrors(name);
  }

  useEffect(()=>{
    if(onFieldChange){
      onFieldChange(fieldValue);
    }

    if(showClear!=Boolean(fieldValue)){
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);

  useEffect(() => {
    if (value === undefined) return;
    setValue(name, value);
  }, [value]);

  const handleChange = (v: any) => {
    field.onChange(v);
    field.onBlur();
  };

  useEffect(() => {
    fireCustomEvent('input-switch-error-update', `.input-switch-container-${name}`, { inputFieldName: name, msgCleared: !Boolean(error?.message), type: 'number' });
  }, [error?.message])

  return (
    <div className={`${containerClasses} input-switch-container-${name}`} style={styles}>
      <div className={`chaise-input-control has-feedback input-switch-numeric ${classes} ${disableInput ? ' input-disabled' : ''}`}>
        <input placeholder={placeholder} className={`${inputClasses} input-switch`} {...field} onChange={handleChange}/>
        <ClearInputBtn
          btnClassName={`${clearClasses} input-switch-clear`}
          clickCallback={clearInput}
          show={showClear}
        />
      </div>
      { displayErrors && isTouched && error?.message && <div className='input-switch-error text-danger'>{error.message}</div> }
    </div>
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
  clearClasses?: string,
  inputClasses?: string,
  containerClasses?: string,
  styles?: any,
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
  inputClasses,
  containerClasses,
  clearClasses,
  disableInput,
  displayErrors,
  value,
  onFieldChange,
  styles,
}: DateFieldProps): JSX.Element => {

  const { setValue, control, clearErrors } = useFormContext();


  const registerOptions = {
    required: false,
    validate: validationFunctionMap['date'],
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const field = formInput?.field;

  const fieldValue = field?.value;

  const fieldState = formInput?.fieldState;

  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));

  const { error, isTouched } = fieldState;

  const clearInput = () => {
    setValue(name, '');
    clearErrors(name);
  };

  useEffect(()=>{
    if(onFieldChange){
      onFieldChange(fieldValue);
    }

    if(showClear!=Boolean(fieldValue)){
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);

  useEffect(() => {
    if (value === undefined) return;
    setValue(name, value);
  }, [value]);

  const handleChange = (v: any) => {
    field.onChange(v);
    field.onBlur();
  };

  useEffect(() => {
    fireCustomEvent('input-switch-error-update', `.input-switch-container-${name}`, { inputFieldName: name, msgCleared: !Boolean(error?.message), type: 'date' });
  }, [error?.message])

  return (
    <div className={`${containerClasses} input-switch-container-${name}`} style={styles}>
      <div className={`chaise-input-control has-feedback input-switch-date ${classes} ${disableInput ? ' input-disabled' : ''}`}>
        <input className={`${inputClasses} input-switch ${showClear ? 'date-input-show-clear' : ''}`} {...field} onChange={handleChange} type='date' step='1' pattern='\d{4}-\d{2}-\d{2}'
        min='1970-01-01' max='2999-12-31' />
        <ClearInputBtn
          btnClassName={`${clearClasses} input-switch-clear`}
          clickCallback={clearInput}
          show={showClear}
        />
      </div>
      { displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span> }
    </div>
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
  clearClasses?: string,
  inputClasses?: string,
  containerClasses?: string,
  /**
   * classes for styling the clear button for time field
   */
  clearTimeClasses?: string
  /**
   * the default date value
   */
  value: TimeStamp,
  styles?: any,
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

const TimestampField = ({
  name,
  value,
  classes,
  inputClasses,
  containerClasses,
  timeClasses,
  clearClasses,
  clearTimeClasses,
  disableInput,
  displayErrors,
  styles,
  onFieldChange
}: TimestampFieldProps): JSX.Element => {

  const { setValue, control, clearErrors, watch } = useFormContext();

  useEffect(() => {

    const sub = watch((data, options) => {
      // not sure what this is doing??
      if (options.name && (options.name == `${name}-date` || options.name == `${name}-time`)) {
        const dateVal = data[`${name}-date`];
        if (!dateVal) return;
        let timeVal = data[`${name}-time`];
        if (dateVal && !timeVal) timeVal = '00:00';
        setValue(name, `${dateVal}T${timeVal}`);
      }
    });

    return () => sub.unsubscribe();
  }, [watch]);

  const registerOptions = {
    disabled: disableInput,
    required: false,
    validate: validationFunctionMap['timestamp'],
  };

  const registerOptionsDate = {
    disabled: disableInput,
    required: false,
  };

  const registerOptionsTime = {
    disabled: disableInput,
    required: false,
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const formInputDate = useController({
    name: `${name}-date`,
    control,
    rules: registerOptionsDate,
  });

  const formInputTime = useController({
    name: `${name}-time`,
    control,
    rules: registerOptionsTime,
  });

  const field = formInput?.field;
  const fieldValue = field?.value;
  const fieldState = formInput?.fieldState;
  const { error } = fieldState;

  const dateField = formInputDate?.field;
  const dateFieldValue = dateField?.value;
  const dateFieldState = formInputDate?.fieldState;
  const { isTouched: isDateTouched } = dateFieldState;

  const timeField = formInputTime?.field;
  const timeFieldValue = timeField?.value;
  const timeFieldState = formInputTime?.fieldState;
  const { isTouched: isTimeTouched } = timeFieldState;

  const [showClear, setShowClear] = useState<any>({ time: Boolean(timeFieldValue), date: Boolean(dateFieldValue) });

  useEffect(() => {
    if (value === undefined) return;
    setValue(`${name}-date`, value);
  }, [value]);

  useEffect(()=>{
    if(onFieldChange){
      onFieldChange(dateFieldValue);
    }

    if(showClear.date!=Boolean(dateFieldValue)){
      setShowClear({...showClear, date: Boolean(dateFieldValue)});
    }
  }, [dateFieldValue]);

  useEffect(()=>{
    if(onFieldChange){
      onFieldChange(timeFieldValue);
    }

    if(showClear.time!=Boolean(timeFieldValue)){
      setShowClear({...showClear, time: Boolean(timeFieldValue)});
    }
  }, [timeFieldValue]);

  const handleDateChange = (v: any) => {
    dateField.onChange(v);
    dateField.onBlur();
  };

  const handleTimeChange = (v: any) => {
    timeField.onChange(v);
    timeField.onBlur();
  };

  useEffect(() => {
    fireCustomEvent('input-switch-error-update', `.input-switch-container-${name}`, { inputFieldName: name, msgCleared: !Boolean(error?.message), type: 'timestamp' });
  }, [error?.message])

  const clearDate = () => {
    setValue(`${name}-date`, '');
    clearErrors(`${name}-date`);
  }

  const clearTime = () => {
    setValue(`${name}-time`, '');
    clearErrors(`${name}-time`);
  }

  return (
    <div className={`${containerClasses} input-switch-container-${name}`} style={styles}>
      <div className='input-switch-datetime'>
        <div className={`chaise-input-control has-feedback input-switch-date ${classes} ${disableInput ? ' input-disabled' : ''}`}>
          <input className={`${inputClasses} input-switch ${showClear.date ? 'date-input-show-clear' : ''}`} type='date' min='1970-01-01' max='2999-12-31' step='1'
          {...dateField} onChange={handleDateChange}/>
          <ClearInputBtn
            btnClassName={`${clearClasses} input-switch-clear`}
            clickCallback={clearDate}
            show={showClear.date}
          />
        </div>
        <div className={`chaise-input-control has-feedback input-switch-time ${classes} ${disableInput ? ' input-disabled' : ''}`}>
          <input className={`${timeClasses} input-switch ${showClear.time ? 'time-input-show-clear' : ''}`} type='time' min='00:00' max='23:59'
          {...timeField} onChange={handleTimeChange}/>
          <ClearInputBtn
            btnClassName={`${clearTimeClasses} input-switch-clear`}
            clickCallback={clearTime}
            show={showClear.time}
          />
        </div>
        <input {...field} type='hidden' />
      </div>
      { displayErrors && (isDateTouched || isTimeTouched) && error?.message && <span className='input-switch-error text-danger'>{error.message}</span> }
    </div>
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
  placeholder?: RangeOption | string,
  /**
   * classes for styling the numeric and date input element
   */
  classes?: string,
  inputClasses?: string,
  containerClasses?: string,
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
  value?: RangeOption | string,
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
  onFieldChange?: ((value: string) => void),
  /**
   * inline styling for the input switch component
   */
  styles?: object,
  /**
   * The column model that is used for this input
   * boolean and foreignkey inputs need this. other types might need it as well.
   */
  columnModel?: RecordeditColumnModel
};

const InputSwitch = ({
  type,
  name,
  placeholder,
  classes = '',
  inputClasses='',
  containerClasses='',
  timeClasses = '',
  clearClasses,
  clearTimeClasses,
  value,
  disableInput,
  displayErrors = true,
  onFieldChange,
  styles={},
  columnModel,
}: InputSwitchProps): JSX.Element | null => {

  return (() => {
    switch (type) {
      case 'timestamp':
        return <TimestampField
          name={name}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          timeClasses={timeClasses}
          clearClasses={clearClasses}
          clearTimeClasses={clearTimeClasses}
          value={value as TimeStamp}
          disableInput={disableInput}
          styles={styles}
          onFieldChange={onFieldChange}
        />
      case 'integer2':
      case 'integer4':
      case 'integer8':
      case 'number':
        return <NumericField
          type={type}
          name={name}
          displayErrors={displayErrors}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          value={value as string}
          placeholder={placeholder as string}
          clearClasses={clearClasses}
          disableInput={disableInput}
          styles={styles}
          onFieldChange={onFieldChange}
        />
      case 'date':
        return <DateField
          name={name}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          value={value as string}
          disableInput={disableInput}
          displayErrors={displayErrors}
          styles={styles}
          onFieldChange={onFieldChange}
        />
      case 'color':
        return <ColorField
          name={name}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          value={value as string}
          disableInput={disableInput}
          onFieldChange={onFieldChange}
        />
      case 'boolean':
        return <BooleanField
          name={name}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          value={value as string}
          disableInput={disableInput}
          onFieldChange={onFieldChange}
          columnModel={columnModel}
        />
      case 'disabled':
          return <DisabledField
            name={name}
            classes={classes}
            inputClasses={inputClasses}
            containerClasses={containerClasses}
            placeholder={placeholder as string}
          />
      case 'longtext':
        return <LongTextField
          name={name}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          value={value as string}
          disableInput={disableInput}
          onFieldChange={onFieldChange} 
        />
      case 'text':
      default:
        return <TextField
          name={name}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          value={value as string}
          disableInput={disableInput}
          onFieldChange={onFieldChange}
        />
    }
  })();
};

export default InputSwitch;
