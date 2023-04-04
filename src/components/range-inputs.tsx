import '@isrd-isi-edu/chaise/src/assets/scss/_range-input.scss';

// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';

// constants
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';

// hooks
import { useEffect, useLayoutEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

// models
import { RangeOptions } from '@isrd-isi-edu/chaise/src/models/range-picker';

// services
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

// utils
import { formatDatetime, replaceNullOrUndefined } from '@isrd-isi-edu/chaise/src/utils/input-utils';

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
   * the range options that holds the values
   */
  rangeOptions: RangeOptions,
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

const RangeInputs = ({
  inputType,
  classes,
  addRange,
  rangeOptions,
  disabled,
  name
}: RangeInputsProps) => {

  const { absMax, absMin } = rangeOptions;

  const type = getType(inputType);

  const className = (type === 'timestamp') ? 'range-inputs-timestamp-width' : '';
  const inputWrapperClassName = (type === 'int' || type === 'number') ? 'numeric-width' : type === 'date' ? 'date-width' : 'time-width';

  const minName = `${name}-min`;
  const maxName = `${name}-max`;

  const timestampOptions = { outputMomentFormat: dataFormats.datetime.return }
  if (type === 'timestamptz') timestampOptions.outputMomentFormat = dataFormats.timestamp;

  let defVals = {};
  if (type.indexOf('timestamp') !== -1) {
    const timestampMinValue = formatDatetime(absMin as string, timestampOptions);
    const timestampMaxValue = formatDatetime(absMax as string, timestampOptions);

    defVals = {
      // initial min defaults
      [`${minName}`]: timestampMinValue?.datetime || '',
      [`${minName}-date`]: timestampMinValue?.date || '',
      [`${minName}-time`]: timestampMinValue?.time || '',
      // initial max defaults
      [`${maxName}`]: timestampMaxValue?.datetime || '',
      [`${maxName}-date`]: timestampMaxValue?.date || '',
      [`${maxName}-time`]: timestampMaxValue?.time || ''
    };
  } else {
    defVals = {
      [minName]: absMin,
      [maxName]: absMax
    };
  }

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

  const [rangeError, setRangeError] = useState<any>(null);

  const fromVal = useWatch({ control: methods.control, name: minName });
  const toVal = useWatch({ control: methods.control, name: maxName });

  // if the absMin/absMax are updated, update the value in the form
  // can occur when this facet is open and another facet is used
  useLayoutEffect(() => {
    const { absMax: currAbsMax, absMin: currAbsMin } = rangeOptions;

    // match timestamp and timestamptz
    if (type.indexOf('timestamp') !== -1) {
      const timestampMinValue = formatDatetime(currAbsMin as string, timestampOptions);
      methods.resetField(`${minName}`, { defaultValue: timestampMinValue?.datetime || '' });
      methods.resetField(`${minName}-date`, { defaultValue: timestampMinValue?.date || '' });
      methods.resetField(`${minName}-time`, { defaultValue: timestampMinValue?.time || '' });

      const timestampMaxValue = formatDatetime(currAbsMax as string, timestampOptions);
      methods.resetField(`${maxName}`, { defaultValue: timestampMaxValue?.datetime || '' });
      methods.resetField(`${maxName}-date`, { defaultValue: timestampMaxValue?.date || '' });
      methods.resetField(`${maxName}-time`, { defaultValue: timestampMaxValue?.time || '' });
    } else {
      methods.resetField(minName, { defaultValue: replaceNullOrUndefined(currAbsMin, '') });
      methods.resetField(maxName, { defaultValue: replaceNullOrUndefined(currAbsMax, '') });
    }
  },
    /**
     * instead of looking at individual absMin and absMax we have to look
     * at the rangeOptions to make sure we're always updating values.
     * this will support the scenario where even if the value of min/max has changed,
     * we're still going to populate them based on the latest value.
     * if we just use absMin and absMax, then it will only update when the underlying value
     * has changed. so for example if we remove the input, it will not update anymore.
     */
    [rangeOptions]
  )

  useEffect(() => {
    const subscribe = methods.watch((data, options) => {
      if (options.name !== minName && options.name !== maxName) return;

      if (rangeError) setRangeError(null);
    });
    return () => subscribe.unsubscribe();
  });

  // performs basic range validation : from_value > to_value
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

  const disableSubmit = () => {
    const hasError = Boolean(minName in methods.formState.errors || maxName in methods.formState.errors || rangeError);
    const areBothFieldsEmpty = !fromVal && !toVal;
    return (!!disabled || hasError || areBothFieldsEmpty);
  }

  const onSubmit = (data: any) => {
    const submitFromVal = data[minName];
    const submitToVal = data[maxName];

    const validatedResult = validateValues(submitFromVal, submitToVal);

    if (validatedResult === 'valid') {
      addRange(fromVal, toVal);
    } else {
      setRangeError('From value cannot be greater than the To value');
    }
  }

  const renderErrors = () => {
    const minError = methods.formState.errors[minName]?.message;
    const maxError = methods.formState.errors[maxName]?.message;
    if (!minError && !maxError && !rangeError) return;

    return <span className='range-input-error'>{minError || maxError || rangeError}</span>
  }

  return (
    <div className={classes}>
      <div className={`range-input-container range-inputs-width${className ? ' ' + className : ''}`}>
        <FormProvider {...methods} >
          <form className='range-input-form' onSubmit={(event) => {
            // this will make sure only the current form is submitted and not outter forms.
            // (submitting this in the fk popup, was submitting the recordedit form)
            event.stopPropagation();
            methods.handleSubmit(onSubmit)(event);
          }}>
            <div className={`range-input ${inputWrapperClassName}`}>
              <label>From:
                <InputSwitch
                  displayErrors={false}
                  disableInput={disabled}
                  name={minName}
                  type={inputType}
                  // when it's timestamp, we don't want to show placeholder as it could
                  // be confusing when users only enter only time or date.
                  placeholder={type === 'timestamp' ? undefined : absMin as string}
                  inputClasses={type === 'timestamp' ? 'ts-date-range-min' : 'range-min'}
                  timeClasses='ts-time-range-min'
                  clearClasses={type === 'timestamp' ? 'min-date-clear' : 'min-clear'}
                  clearTimeClasses='min-time-clear'
                />
              </label>
            </div>
            <div className={`range-input ${inputWrapperClassName}`}>
              <label>To:
                <InputSwitch
                  displayErrors={false}
                  disableInput={disabled}
                  name={maxName}
                  type={inputType}
                  // when it's timestamp, we don't want to show placeholder as it could
                  // be confusing when users enter only time or date.
                  placeholder={type === 'timestamp' ? undefined : absMax as string}
                  inputClasses={type === 'timestamp' ? 'ts-date-range-max' : 'range-max'}
                  timeClasses='ts-time-range-max'
                  clearClasses={type === 'timestamp' ? 'max-date-clear' : 'max-clear'}
                  clearTimeClasses='max-time-clear'
                />
              </label>
            </div>
            <button type='submit' className='chaise-btn chaise-btn-primary range-input-submit-btn' disabled={disableSubmit()}>
              <span className='chaise-btn-icon fa-solid fa-check' />
            </button>
          </form>
        </FormProvider>
      </div>
      {renderErrors()}
    </div>
  );
};

export default RangeInputs;
