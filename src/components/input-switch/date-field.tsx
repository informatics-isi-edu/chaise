// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import { VALIDATE_VALUE_BY_TYPE } from '@isrd-isi-edu/chaise/src/utils/input-utils';


const DateField = (props: InputFieldProps): JSX.Element => {

  const rules = {
    validate: VALIDATE_VALUE_BY_TYPE['date']
  };

  return (
    <InputField {...props} controllerRules={rules}>
      {(field, onChange, showClear, clearInput) => (
        <div className={`chaise-input-control has-feedback input-switch-date ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
          <input
            className={`${props.inputClasses} input-switch ${showClear ? 'date-input-show-clear' : ''}`} {...field}
            onChange={onChange} type='date' step='1' pattern='\d{4}-\d{2}-\d{2}' disabled={props.disableInput}
            // TODO are the following needed?
            min='1970-01-01' max='2999-12-31'
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

export default DateField;
