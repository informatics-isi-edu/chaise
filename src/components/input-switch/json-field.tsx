// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

//hooks
import { useRef, type JSX } from 'react';

// utils
import { ERROR_MESSAGES } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { hasVerticalScrollbar } from '@isrd-isi-edu/chaise/src/utils/input-utils';

const JsonField = (props: InputFieldProps): JSX.Element => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
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
              placeholder={props.placeholder} 
              rows={5} 
              className={`${props.inputClasses} input-switch ${props.inputClassName} ${
                hasVerticalScrollbar(textAreaRef.current) ? 'has-scrollbar' : ''
              }`}
              {...field} 
              onChange={onChange} 
              disabled={props.disableInput}
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

  );
};

export default JsonField;
