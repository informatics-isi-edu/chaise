import type { JSX } from 'react';

// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import { VALIDATE_VALUE_BY_TYPE } from '@isrd-isi-edu/chaise/src/utils/input-utils';

const TextField = (props: InputFieldProps): JSX.Element => {

  const rules = {
    validate: VALIDATE_VALUE_BY_TYPE['text']
  };

  return (
    <InputField {...props} controllerRules={rules}>
      {(field, onChange, showClear, clearInput) => (
        <div className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
          <input
            className={`${props.inputClasses} input-switch ${props.inputClassName}`}
            {...field}
            disabled={props.disableInput}
            placeholder={props.placeholder}
            onChange={onChange}
          />
          <ClearInputBtn
            btnClassName={`${props.clearClasses} input-switch-clear`}
            clickCallback={clearInput}
            show={showClear && !props.disableInput}
          />
        </div>
      )}
    </InputField>

  );
};

export default TextField;
