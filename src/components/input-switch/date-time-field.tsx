// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import DateField from '@isrd-isi-edu/chaise/src/components/input-switch/date-field';

// hooks
import { useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';

// utils
import { ERROR_MESSAGES, formatDatetime, VALIDATE_VALUE_BY_TYPE } from '@isrd-isi-edu/chaise/src/utils/input-utils';
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
  hasTimezone?: boolean,
  /**
   * whether we should show the extra buttons or not
   */
  displayExtraDateTimeButtons?: boolean
}

const DateTimeField = (props: DateTimeFieldProps): JSX.Element => {

  const { setValue, control, clearErrors, watch, setError } = useFormContext();

  const DATE_TIME_FORMAT = props.hasTimezone ? dataFormats.datetime.return : dataFormats.timestamp;

  useEffect(() => {

    /**
     * this will make sure we're updating the underlying value after
     * each update to the date and time fields.
     *
     * NOTE: just claling setError will not mark the form as invalid and the form.
     * when users submit the form, the validators on the input itself will trigger
     * that's why I'm setting the values to something invalid so it can then invalidate
     * them and disallow submit.
     */
    const sub = watch((data, options) => {
      const name = props.name

      if (options.name && (options.name === `${name}-date` || options.name === `${name}-time`)) {
        const dateVal = data[`${name}-date`];
        let timeVal = data[`${name}-time`];

        // if both are missing, the input is empty
        if (!dateVal && !timeVal) {
          clearErrors(name);
          setValue(name, '');
          return;
        }

        // if date is missing, this is invalid
        if (!dateVal) {
          setError(name, { type: 'custom', message: ERROR_MESSAGES.INVALID_DATE });
          setValue(name, 'invalid-value');
          return;
        }
        // otherwise validate the date value
        else {
          const err = VALIDATE_VALUE_BY_TYPE['date'](dateVal);
          if (typeof err === 'string') {
            setError(name, { type: 'custom', message: err});
            setValue(name, 'invalid-value');
            return;
          }
        }

        // if only time is missing, just use 00:00:00 for it
        if (!timeVal) {
          timeVal = '00:00:00';
        }
        // otherwise validate the time value
        else {
          const err = VALIDATE_VALUE_BY_TYPE['time'](timeVal);
          if (typeof err === 'string') {
            setError(name, { type: 'custom', message: err });
            setValue(name, 'invalid-value');
            return;
          }
        }

        /**
         * concatenate date and time together
         * since time can have multiple formats, we cannot simply concatenate the strings
         * and have to rely on moment to do this for us.
         */
        const date = windowRef.moment(dateVal, dataFormats.date);
        const time = windowRef.moment(timeVal, dataFormats.time);
        const dateTime = date.set({
          hour: time.get('hour'),
          minute: time.get('minute'),
          second: time.get('second')
        });

        // adds the timezone info if needed
        const valueToSet = dateTime.format(DATE_TIME_FORMAT);

        clearErrors(name);
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

  const applyNow = (e: any) => {
    e.stopPropagation();

    const v = formatDatetime(windowRef.moment(), { outputMomentFormat: DATE_TIME_FORMAT })

    setValue(props.name, v?.datetime);
    setValue(`${props.name}-date`, v?.date);
    setValue(`${props.name}-time`, v?.time);
  }

  const handleTimeChange = (v: any) => {
    timeField.onChange(v);
    timeField.onBlur();
  };

  const clearDate = () => {
    clearErrors(`${props.name}-date`);
    setValue(`${props.name}-date`, '');
  }

  const clearTime = () => {
    clearErrors(`${props.name}-time`);
    setValue(`${props.name}-time`, '');
  }

  const showTimeClear = () => Boolean(timeFieldValue);

  return (
    <InputField {...props}
      // make sure to mark the whole input as "touched" if any of the inputs are touched
      checkIsTouched={() => isDateTouched || isTimeTouched}
      /**
       * the validation is done above and this one is technically not needed
       * (it's basically just validating the watch above and not the user action)
       */
      controllerRules={{
        validate: VALIDATE_VALUE_BY_TYPE[(props.hasTimezone ? 'timestamptz' : 'timestamp')]
      }}
    >
      {(field) => (
        <div className='input-switch-datetime'>
          <DateField
            type={'date'}
            name={`${props.name}-date`}
            classes={props.classes ? props.classes : ''}
            inputClasses={props.inputClasses}
            clearClasses={props.clearClasses}
            disableInput={props.disableInput}
            displayErrors={false}
            displayExtraDateTimeButtons={false}
            displayTimePrependText={true}
          />
          <div className='chaise-input-group input-switch-time'>
            <div className='chaise-input-group-prepend'>
              <div className='chaise-input-group-text dt-width'>Time</div>
            </div>
            <div className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
              <input
                className={`${props.timeClasses} input-switch ${showTimeClear() ? 'time-input-show-clear' : ''}`}
                type='text' disabled={props.disableInput} {...timeField} onChange={handleTimeChange}
                placeholder={dataFormats.placeholder.time}
              />
              <ClearInputBtn
                btnClassName={`${props.clearTimeClasses} input-switch-clear`}
                clickCallback={clearTime}
                show={showTimeClear() && !props.disableInput}
              />
            </div>
          </div>
          {!props.disableInput && props.displayExtraDateTimeButtons && <div className='chaise-btn-group'>
            <button type='button' className='chaise-btn chaise-btn-secondary' onClick={applyNow}>Now</button>
            <button type='button' className='chaise-btn chaise-btn-secondary' onClick={() => { clearTime(); clearDate(); }}>Clear</button>
          </div>}
          <input {...field} type='hidden' />
        </div>
      )}
    </InputField>

  );
};

export default DateTimeField;
