// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import { VALIDATE_VALUE_BY_TYPE } from '@isrd-isi-edu/chaise/src/utils/input-utils';


const NumericField = (props: InputFieldProps): JSX.Element => {
  let rules;
  if (props.type === 'integer2' || props.type === 'integer4' || props.type === 'integer8') {
    rules = {
      validate: VALIDATE_VALUE_BY_TYPE[props.type]
    }
  } else {
    rules = {
      pattern: VALIDATE_VALUE_BY_TYPE[props.type]
    }
  }
  

  return (
    <InputField {...props} controllerRules={rules}>
      {(field, onChange, showClear, clearInput) => (
        <div className={`chaise-input-control has-feedback input-switch-numeric ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
          <input
            className={`${props.inputClasses} input-switch`} {...field}
            disabled={props.disableInput} placeholder={props.placeholder} onChange={onChange}
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

export default NumericField;
