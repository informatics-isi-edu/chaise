// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import { ERROR_MESSAGES } from '@isrd-isi-edu/chaise/src/utils/input-utils';

const JsonField = (props: InputFieldProps): JSX.Element => {

  const jsonFieldValidation = (value: string) => {
    if (!value) return;

    try {
      JSON.parse(value);
      return true;
    } catch (error) {
      return ERROR_MESSAGES.INVALID_JSON;
    }
  };

  return (
    <InputField {...props}
      controllerRules={{
        validate: jsonFieldValidation
      }}
    >
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-json'>
          <div className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
            <textarea
              placeholder={props.placeholder} rows={5} className={`${props.inputClasses} input-switch`}
              {...field} onChange={onChange} disabled={props.disableInput}
            />
            <ClearInputBtn
              btnClassName={`${props.clearClasses} input-switch-clear`}
              clickCallback={clearInput}
              show={showClear && !props.disableInput}
            />
          </div>
        </div>
      )}
    </InputField>

  );
};

export default JsonField;
