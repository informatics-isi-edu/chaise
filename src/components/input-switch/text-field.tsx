// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

const TextField = (props: InputFieldProps): JSX.Element => {

  return (
    <InputField {...props}>
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
