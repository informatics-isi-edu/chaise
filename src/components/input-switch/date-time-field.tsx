// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// hooks
import { useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';

// utils
import { VALIDATE_VALUE_BY_TYPE } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

type DateTimeFieldProps = InputFieldProps & {
  /**
   * classes for styling the input time element
   */
  timeClasses?: string,
  /**
   * classes for styling the clear button for time field
   */
  clearTimeClasses?: string,
  hasTimezone?: boolean
}

const DateTimeField = (props: DateTimeFieldProps): JSX.Element => {

  const { setValue, control, clearErrors, watch } = useFormContext();

  useEffect(() => {

    const sub = watch((data, options) => {
      const name = props.name

      // not sure what this is doing??
      if (options.name && (options.name === `${name}-date` || options.name === `${name}-time`)) {
        const dateVal = data[`${name}-date`];
        if (!dateVal) return;
        let timeVal = data[`${name}-time`];
        if (dateVal && !timeVal) timeVal = '00:00';

        let valueToSet = `${dateVal}T${timeVal}`;
        // adds the timezone info if needed
        if (props.hasTimezone) valueToSet = windowRef.moment(valueToSet).format(dataFormats.datetime.return);
        setValue(name, valueToSet);
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

  const showDateClear = () => Boolean(dateFieldValue);
  const showTimeClear = () => Boolean(timeFieldValue);

  return (
    <InputField {...props}
      checkIsTouched={() => isDateTouched || isDateTouched}
      controllerRules={{
        validate: VALIDATE_VALUE_BY_TYPE[(props.hasTimezone ? 'timestamptz' : 'timestamp')]
      }}
    >
      {(field) => (
        <div className='input-switch-datetime'>
          <div className={`chaise-input-control has-feedback input-switch-date ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
            <input
              className={`${props.inputClasses} input-switch ${showDateClear() ? 'date-input-show-clear' : ''}`}
              type='date' step='1' disabled={props.disableInput}
              {...dateField} onChange={handleDateChange}
            />
            <ClearInputBtn
              btnClassName={`${props.clearClasses} input-switch-clear`}
              clickCallback={clearDate}
              show={showDateClear() && !props.disableInput}
            />
          </div>
          <div className={`chaise-input-control has-feedback input-switch-time ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
            <input
              className={`${props.timeClasses} input-switch ${showTimeClear() ? 'time-input-show-clear' : ''}`}
              type='time' min='00:00:00' max='23:59:59' step='1'
              disabled={props.disableInput}
              {...timeField} onChange={handleTimeChange}
            />
            <ClearInputBtn
              btnClassName={`${props.clearTimeClasses} input-switch-clear`}
              clickCallback={clearTime}
              show={showTimeClear() && !props.disableInput}
            />
          </div>
          <input {...field} type='hidden' />
        </div>
      )}
    </InputField>

  );
};

export default DateTimeField;
