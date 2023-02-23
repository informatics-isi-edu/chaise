import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

const JsonField = (props: InputFieldProps): JSX.Element => {

  return (
    <InputField {...props}>
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
