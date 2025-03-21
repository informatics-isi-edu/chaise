// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import DateField from '@isrd-isi-edu/chaise/src/components/input-switch/date-field';

// hooks
import { useEffect, type JSX } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';

// utils
import { CUSTOM_ERROR_TYPES, ERROR_MESSAGES, formatDatetime, VALIDATE_VALUE_BY_TYPE } from '@isrd-isi-edu/chaise/src/utils/input-utils';
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
  displayExtraDateTimeButtons?: boolean,
  /**
   * whether we should show the labels or not
   */
  displayDateTimeLabels?: boolean
}

const DateTimeField = (props: DateTimeFieldProps): JSX.Element => {

  // NOTE: Including these context properties causes this component to redraw every time a change to the form occurs
  //   Can this functionality be done in a different way with react-hook-form to prevent so much rerendering when the component hasn't changed?
  const { setValue, control, clearErrors, setError, getFieldState, trigger } = useFormContext();
  const dateTimeVal = useWatch({ name: props.name });
  const dateVal = useWatch({ name: `${props.name}-date` });
  const timeVal = useWatch({ name: `${props.name}-time` });

  const DATE_TIME_FORMAT = props.hasTimezone ? dataFormats.datetime.return : dataFormats.timestamp;

  // since we're showing a manual error, we're also setting the input as this value so the form is also invalid.
  const invalidValue = 'invalid-value';

  useEffect(() => {
    // Set default values if they exists
    if (!dateVal && !timeVal && dateTimeVal) {
      const v = formatDatetime(dateTimeVal, { outputMomentFormat: DATE_TIME_FORMAT })

      setValue(`${props.name}-date`, v?.date);
      setValue(`${props.name}-time`, v?.time);
    }
  }, [])

  useEffect(() => {/**
     * this will make sure we're updating the underlying value after
     * each update to the date and time fields.
     *
     * NOTE: just calling setError will not mark the form as invalid and the form.
     * when users submit the form, the validators on the input itself will trigger
     * that's why I'm setting the values to something invalid so it can then invalidate
     * them and disallow submit.
     */
    const datetimeFieldState = getFieldState(props.name);

    // if both are missing, the input is empty
    if (!dateVal && !timeVal) {
      if (datetimeFieldState.error) clearErrors(props.name);
      setValue(props.name, '');
      void trigger(props.name);
      return;
    }

    // if date is missing, this is invalid
    if (!dateVal) {
      setError(props.name, { type: CUSTOM_ERROR_TYPES.INVALID_DATE_TIME, message: ERROR_MESSAGES.INVALID_DATE });
      setValue(props.name, invalidValue);
      return;
    }
    // otherwise validate the date value
    else {
      const err = VALIDATE_VALUE_BY_TYPE['date'](dateVal);
      if (typeof err === 'string') {
        setError(props.name, { type: CUSTOM_ERROR_TYPES.INVALID_DATE_TIME, message: err });
        setValue(props.name, invalidValue);
        return;
      }
    }

    // if time is missing, use 00:00:00 for it
    let usedTimeVal = timeVal;
    if (!timeVal) {
      usedTimeVal = '00:00:00';
      setValue(`${props.name}-time`, usedTimeVal);
    }
    // otherwise validate the time value
    else {
      const err = VALIDATE_VALUE_BY_TYPE['time'](timeVal);
      if (typeof err === 'string') {
        setError(props.name, { type: CUSTOM_ERROR_TYPES.INVALID_DATE_TIME, message: err });
        setValue(props.name, invalidValue);
        return;
      }
    }

    /**
     * concatenate date and time together
     * since time can have multiple formats, we cannot simply concatenate the strings
     * and have to rely on moment to do this for us.
     */
    const date = windowRef.moment(dateVal, dataFormats.date);
    const time = windowRef.moment(usedTimeVal, dataFormats.time);
    const dateTime = date.set({
      hour: time.get('hour'),
      minute: time.get('minute'),
      second: time.get('second')
    });

    // adds the timezone info if needed
    const valueToSet = dateTime.format(DATE_TIME_FORMAT);
    if (datetimeFieldState.error) clearErrors(props.name);
    setValue(props.name, valueToSet);

    // we have to call trigger to trigger all the validators again
    // (needed for the ARRAY_ADD_OR_DISCARD_VALUE error to show up)
    void trigger(props.name);

  }, [dateVal, timeVal]);

  /**
   * we have to make sure to trigger all the validators after we've manually changed the value.
   *
   * NOTE:
   * - This is needed for the ARRAY_ADD_OR_DISCARD_VALUE error or any other custom validators that we have to show up.
   */
  useEffect(() => {
    /**
     * if we set the value to "invalid value", we also have defined a custom error that we want to show.
     * so we're excluding that from here to make sure the custom error is not replaced by a generic one.
     */
    if (dateTimeVal !== invalidValue) void trigger(props.name);
  }, [dateTimeVal])

  const formInputDate = useController({
    name: `${props.name}-date`,
    defaultValue: '',
    control,
    rules: {
      required: props.requiredInput
    },
  });
  const dateField = formInputDate?.field;
  const dateFieldValue = dateField?.value;
  const dateFieldState = formInputDate?.fieldState;
  const { isTouched: isDateTouched } = dateFieldState;

  const formInputTime = useController({
    name: `${props.name}-time`,
    defaultValue: '',
    control,
    rules: {
      required: props.requiredInput
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
        validate: VALIDATE_VALUE_BY_TYPE[(props.hasTimezone ? 'timestamptz' : 'timestamp')],
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
            placeholder={props.placeholder ? props.placeholder : dataFormats.placeholder.date}
            disableInput={props.disableInput}
            displayErrors={false}
            displayExtraDateTimeButtons={false}
            displayDateTimeLabels={props.displayDateTimeLabels}
            inputClassName={`${props.inputClassName}-date`}
          />
          <div className='chaise-input-group input-switch-time'>
            {props.displayDateTimeLabels && <div className='chaise-input-group-prepend'>
              <div className='chaise-input-group-text dt-width'>Time</div>
            </div>}
            <div className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
              <input
                className={`${props.timeClasses} input-switch ${props.inputClassName}-time ${
                  showTimeClear() ? 'time-input-show-clear' : ''
                }`}
                type='text'
                disabled={props.disableInput}
                {...timeField}
                onChange={handleTimeChange}
                placeholder={props.placeholder ? props.placeholder : dataFormats.placeholder.time}
              />
              <ClearInputBtn
                btnClassName={`${props.clearTimeClasses} input-switch-clear`}
                clickCallback={clearTime}
                show={showTimeClear() && !props.disableInput}
              />
            </div>
          </div>
          {/*'translateY' - Prevents overlap of error message and button group in case of arrayField by moving the button group lower*/}
          {!props.disableInput && props.displayExtraDateTimeButtons &&
            <div className={`chaise-btn-group ${getFieldState(props.name)?.error ? 'translateY' : ''}`}>
              <button type='button' className='date-time-now-btn chaise-btn chaise-btn-secondary' onClick={applyNow}>
                Now
              </button>
              <button type='button' className='date-time-clear-btn chaise-btn chaise-btn-secondary' onClick={() => { clearTime(); clearDate(); }}>
                Clear
              </button>
            </div>
          }
          <input className={props.inputClassName} {...field} type='hidden' />
        </div>
      )}
    </InputField>

  );
};

export default DateTimeField;
