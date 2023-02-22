// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import { VALIDATE_VALUE_BY_TYPE } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { useEffect, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

type DateTimeFieldProps = InputFieldProps & {
  /**
   * classes for styling the input time element
   */
  timeClasses?: string,
  /**
   * classes for styling the clear button for time field
   */
  clearTimeClasses?: string
}

const DateTimeField = (props: DateTimeFieldProps): JSX.Element => {

  const { setValue, control, clearErrors, watch } = useFormContext();

  useEffect(() => {

    const sub = watch((data, options) => {
      const name = props.name;

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

  const formInputDate = useController({
    name: `${props.name}-date`,
    control,
    rules: {
      required: false
    },
  });
  const dateField = formInputDate?.field;
  const dateFieldValue = dateField?.value;
  const dateFieldState = formInputDate?.fieldState;
  const { isTouched: isDateTouched } = dateFieldState;


  const formInputTime = useController({
    name: `${props.name}-time`,
    control,
    rules: {
      required: false
    },
  });
  const timeField = formInputTime?.field;
  const timeFieldValue = timeField?.value;
  const timeFieldState = formInputTime?.fieldState;
  const { isTouched: isTimeTouched } = timeFieldState;

  const [showClear, setShowClear] = useState<{ time: boolean, date: boolean }>({
    time: Boolean(timeFieldValue),
    date: Boolean(dateFieldValue)
  });

  useEffect(() => {
    if (showClear.date != Boolean(dateFieldValue)) {
      setShowClear({ ...showClear, date: Boolean(dateFieldValue) });
    }
  }, [dateFieldValue]);

  useEffect(() => {
    if (showClear.time != Boolean(timeFieldValue)) {
      setShowClear({ ...showClear, time: Boolean(timeFieldValue) });
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

  const clearDate = () => {
    setValue(`${props.name}-date`, '');
    clearErrors(`${props.name}-date`);
  }

  const clearTime = () => {
    setValue(`${props.name}-time`, '');
    clearErrors(`${props.name}-time`);
  }

  return (
    <InputField {...props}
      checkIsTouched={() => isDateTouched || isDateTouched}
      controllerRules={{
        validate: VALIDATE_VALUE_BY_TYPE['timestamp']
      }}
    >
      {(field) => (
        <div className='input-switch-datetime'>
          <div className={`chaise-input-control has-feedback input-switch-date ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
            <input
              className={`${props.inputClasses} input-switch ${showClear.date ? 'date-input-show-clear' : ''}`}
              type='date' min='1970-01-01' max='2999-12-31' step='1'
              disabled={props.disableInput}
              {...dateField} onChange={handleDateChange}
            />
            <ClearInputBtn
              btnClassName={`${props.clearClasses} input-switch-clear`}
              clickCallback={clearDate}
              show={showClear.date && !props.disableInput}
            />
          </div>
          <div className={`chaise-input-control has-feedback input-switch-time ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
            <input
              className={`${props.timeClasses} input-switch ${showClear.time ? 'time-input-show-clear' : ''}`}
              type='time' min='00:00:00' max='23:59:59' step='1'
              disabled={props.disableInput}
              {...timeField} onChange={handleTimeChange}
            />
            <ClearInputBtn
              btnClassName={`${props.clearTimeClasses} input-switch-clear`}
              clickCallback={clearTime}
              show={showClear.time && !props.disableInput}
            />
          </div>
          <input {...field} type='hidden' />
        </div>
      )}
    </InputField>

  );
};

export default DateTimeField;
