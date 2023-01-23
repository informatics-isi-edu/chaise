// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';

// hooks
import { useEffect, useState, useRef } from 'react';
import { useFormContext, useController } from 'react-hook-form';

// utils
import { getSimpleColumnType } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { ResizeSensor } from 'css-element-queries';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

type ArrayFieldProps = {
  /* the type of each element in the array */
  baseArrayType: string,
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

const ArrayField = ({
  baseArrayType,
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
}: ArrayFieldProps): JSX.Element => {
  const arrayFieldValidation = (value: string) => {
    if (!value) return;

    // make sure it's an array
    let validArray = false, arr;
    try {
      arr = JSON.parse(value);
      validArray = Array.isArray(arr);
    } catch (e) {}

    if (!validArray) {
      return 'Please enter a valid array structure' + ((baseArrayType === 'text') ? ' e.g. [\"value1\", \"value2\"]' : '.');
    }

    const moment = windowRef.moment;
    // validate individual array values
    for (let i = 0; i < arr.length; i++) {
      let isValid = false;
      const val = arr[i];

      // null is a valid value for any type
      if (val === null) continue;

      switch (baseArrayType) {
        case 'timestamptz':
        case 'timestamp':
          isValid = moment(val, moment.ISO_8601, true).isValid();
          break;
        case 'date':
          isValid = moment(val, ['YYYY-MM-DD', 'YYYY-M-DD', 'YYYY-M-D', 'YYYY-MM-D'], true).isValid();
          break;
        case 'numeric':
        case 'float4':
        case 'float8':
          isValid = dataFormats.regexp.float.test(val);
          break;
        case 'int2':
        case 'int4':
        case 'int8':
          isValid = dataFormats.regexp.integer.test(val);
          break;
        case 'boolean':
          isValid = (typeof val === 'boolean');
          break;
        default:
          isValid = (typeof val === 'string' || val instanceof String);
          break;
      }

      if (!isValid) {
        return '`' + val + '` is not a valid ' + getSimpleColumnType(baseArrayType) + ' value.';
      }
    }

    return true;
  };

  const textAreaRef = useRef(null);

  // react-hook-form setup
  const { setValue, control, clearErrors } = useFormContext();
  const registerOptions = {
    required: false,
    validate: arrayFieldValidation
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const field = formInput?.field;
  const fieldValue = field?.value;
  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));

  const fieldState = formInput?.fieldState;
  const { error, isTouched } = fieldState;

  // hooks
  useEffect(() => {
    const textAreaElement = textAreaRef.current;
    if (!textAreaElement) return;
    const sensor = new ResizeSensor(textAreaElement, () => {
      fireCustomEvent(
        'input-switch-error-update',
        `.input-switch-container-${makeSafeIdAttr(name)}`,
        { inputFieldName: name, msgCleared: false, type: 'array' }
      );
    });

    return () => {
      sensor.detach();
    }
  }, []);

  useEffect(() => {
    if (onFieldChange) {
      onFieldChange(fieldValue);
    }

    if (showClear != Boolean(fieldValue)) {
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);

  useEffect(() => {
    if (value === undefined) return;
    setValue(name, value);
  }, [value]);

  useEffect(() => {
    fireCustomEvent(
      'input-switch-error-update',
      `.input-switch-container-${makeSafeIdAttr(name)}`,
      { inputFieldName: name, msgCleared: !Boolean(error?.message), type: 'array' }
    );
  }, [error?.message]);

  // acllback functions
  const handleChange = (v: any) => {
    field.onChange(v);
    field.onBlur();
  };

  const clearInput = () => {
    setValue(name, '');
    clearErrors(name);
  }

  return (
    <div className={`${containerClasses} input-switch-container-${makeSafeIdAttr(name)} input-switch-array-container`} style={styles}>
      <div className={`chaise-input-control has-feedback content-box ${classes} ${disableInput ? ' input-disabled' : ''}`} ref={textAreaRef}>
        <textarea placeholder={placeholder} rows={5} className={`${inputClasses} input-switch`} {...field} onChange={handleChange} />
        <ClearInputBtn
          btnClassName={`${clearClasses} input-switch-clear`}
          clickCallback={clearInput}
          show={showClear}
        />
      </div>
      {displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span>}
    </div>
  );
}

export default ArrayField;