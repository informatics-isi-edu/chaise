import '@isrd-isi-edu/chaise/src/assets/scss/_range-input.scss';

// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FieldError, FormProvider, useForm, useWatch } from 'react-hook-form';

// models
import { RangeOptions } from '@isrd-isi-edu/chaise/src/models/range-picker';

// services
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

const TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
const DATE_FORMAT = 'YYYY-MM-DD';

type RangeInputsProps = {
  /**
   * a string for the type of input expected returned from getInputType():
   * integer2, integer4, integer8
   * number
   * date
   * timestamp[tz]
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
    case 'integer2':
    case 'integer4':
    case 'integer8':
      type = 'int';
      break;
    case 'number':
      type = 'number';
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

  const type = getType(inputType);
  const classTypeName = (type === 'int' || type === 'number') ? 'numeric-width' : type === 'date' ? 'date-width' : 'time-width';

  const defVals = {
    [`${name}-min`]: absMin,
    [`${name}-max`]: absMax
  };

  const methods = useForm<any>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defVals,
    resolver: undefined,
    context: undefined,
    criteriaMode: 'firstError',
    shouldUnregister: false,
    shouldUseNativeValidation: false,
    delayError: undefined
  });

  const [error, setError] = useState<any>(null);
  const [disableSubmit, setDisableSubmit] = useState<boolean>(disabled || (type === 'int' || type === 'number'));

  const fromVal = useWatch({ control: methods.control, name: `${name}-min` });
  const toVal = useWatch({ control: methods.control, name: `${name}-max` });

  useLayoutEffect(() => {
    // set value for form 
    methods.resetField(`${name}-min`, { defaultValue: absMin });
    methods.resetField(`${name}-max`, { defaultValue: absMax });

    // enable the submit button if we have a min/max
    setDisableSubmit(!!disabled);
  }, [absMax, absMin])

  const handleChange = () => {
    const formErrors = methods.formState.errors;
    const errMessage = formErrors[`${name}-min`]?.message || formErrors[`${name}-max`]?.message || '';
    console.log('error message: ', errMessage);

    // update if the message is not the same
    if (errMessage !== error) setError(errMessage);

    // TODO: this doesn't check if timestamp is empty properly
    const areBothFieldsEmpty = !fromVal && !toVal;
    setDisableSubmit(!!disabled || Boolean(errMessage) || areBothFieldsEmpty)
  }

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

  /**
   * performs basic range validation : from_value > to_value
  */
  const rangeCheck = (fromVal: string, toVal: string): boolean => {
    if (type === 'int') return parseInt(fromVal) < parseInt(toVal);

    if (type === 'number') return parseFloat(fromVal) < parseFloat(toVal);

    /**type is either date or timestamp */
    const formatString = type === 'date' ? DATE_FORMAT : TIMESTAMP_FORMAT;
    const fromDate = windowRef.moment(fromVal, formatString, true);
    const toDate = windowRef.moment(toVal, formatString, true);
    return toDate.diff(fromDate) > 0
  }

  const validateValues = (fromVal: string, toVal: string) => {
    // if only one field is non null then don't perform range check
    if (!fromVal || !toVal) return 'valid';

    // both from and to values are now valid so perform range validations
    return rangeCheck(fromVal, toVal) ? 'valid' : 'range';
  };

  const onSubmit = (data: any) => {
    console.log(data);

    const submitFromVal = data[`${name}-min`];
    const submitToVal = data[`${name}-max`];

    const validatedResult = validateValues(submitFromVal, submitToVal);

    if (validatedResult === 'valid') {
      addRange(fromVal, toVal);
    } else {
      setError('From value cannot be greater than the To value');
    }
  }

  // useEffect(() => {
  //   const values: any = methods.getValues();
  //   const disabledFromVal = values[`${name}-min`];
  //   const disabledtoVal = values[`${name}-max`];

  //   setDisableSubmit(!!disabled || (!disabledFromVal && !disabledtoVal));
  // }, [disabled]);

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
                  type={inputType}
                  placeholder={absMin}
                  // disableInput={disableSubmit}
                  inputClasses={type === 'date' || type === 'timestamp' ? 'ts-date-range-min' : 'range-min'}
                  timeClasses='ts-time-range-min'
                  clearClasses={type === 'date' || type === 'timestamp' ? 'min-date-clear' : 'min-clear'}
                  clearTimeClasses='min-time-clear'
                  onFieldChange={handleChange}
                />
              </label>
            </div>
            <div className={`range-input ${classTypeName}`}>
              <label>To:
                <InputSwitch
                  displayErrors={false}
                  name={`${name}-max`}
                  type={inputType}
                  placeholder={absMax}
                  // disableInput={disableSubmit}
                  inputClasses={type === 'date' || type === 'timestamp' ? 'ts-date-range-max' : 'range-max'}
                  timeClasses='ts-time-range-max'
                  clearClasses={type === 'date' || type === 'timestamp' ? 'max-date-clear' : 'max-clear'}
                  clearTimeClasses='max-time-clear'
                  onFieldChange={handleChange}
                />
              </label>
            </div>
            <button type='submit' className='chaise-btn chaise-btn-primary range-input-submit-btn' disabled={disableSubmit}>
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
};

export default RangeInputs;