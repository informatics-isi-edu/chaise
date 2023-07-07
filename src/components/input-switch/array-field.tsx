// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
//hooks
import { useRef } from 'react';
// utils
import { getSimpleColumnType } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { arrayFieldPlaceholder } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { hasVerticalScrollbar } from '@isrd-isi-edu/chaise/src/utils/input-utils';
type ArrayFieldProps = InputFieldProps & {
  /* the type of each element in the array */
  baseArrayType: string,
};

const ArrayField = (props : ArrayFieldProps): JSX.Element => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const arrayFieldValidation = (value: string) => {
    if (!value) return;

    // make sure it's an array
    let validArray = false, arr;
    try {
      arr = JSON.parse(value);
      validArray = Array.isArray(arr);
    } catch (e) {}

    if (!validArray) {
      return 'Please enter a valid array structure' + ((props.baseArrayType === 'text') ? ' e.g. [\"value1\", \"value2\"]' : '.');
    }

    const moment = windowRef.moment;
    // validate individual array values
    for (let i = 0; i < arr.length; i++) {
      let isValid = false;
      const val = arr[i];

      // null is a valid value for any type
      if (val === null) continue;

      switch (props.baseArrayType) {
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
        return '`' + val + '` is not a valid ' + getSimpleColumnType(props.baseArrayType) + ' value.';
      }
    }

    return true;
  };

  const placeholder = props.placeholder ? props.placeholder : arrayFieldPlaceholder(props.baseArrayType);

  return (
    <InputField {...props}
      controllerRules={{
        validate: arrayFieldValidation
      }}
    >
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-array'>
          <div className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
            <textarea
              placeholder={placeholder} rows={5} className={`${props.inputClasses} input-switch ${
                hasVerticalScrollbar(textAreaRef.current) ? 'has-scrollbar' : ''
              }`}
              {...field} onChange={onChange} disabled={props.disableInput}
              ref={textAreaRef}
            />
            <ClearInputBtn
              btnClassName={`${props.clearClasses} input-switch-clear ${
                hasVerticalScrollbar(textAreaRef.current) ? 'has-scrollbar-clear' : ''
              }`}
              clickCallback={clearInput}
              show={showClear && !props.disableInput}
            />
          </div>
        </div>
      )}
    </InputField>
  )
}

export default ArrayField;
