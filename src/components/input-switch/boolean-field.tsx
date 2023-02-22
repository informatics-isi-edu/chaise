// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import Dropdown from 'react-bootstrap/Dropdown';


// utils
import { formatBoolean } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

type BooleanFieldProps = InputFieldProps & {
  columnModel?: any,
}

const BooleanField = (props: BooleanFieldProps): JSX.Element => {

  /**
   * input-field checks for falsy values, but "false" is a
   * valid value here and we need to check the type instead.
   */
  const hasValue = (v: any) => {
    return (typeof v === 'boolean');
  };

  // first option is true, and second is false.
  const rawOptions = [true, false];
  const displayedOptions = rawOptions.map((op) => props.columnModel ? formatBoolean(props.columnModel.column, op) : op.toString());

  return (
    <InputField {...props} checkHasValue={hasValue}>
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-boolean'>
          <Dropdown aria-disabled={props.disableInput}>
            <Dropdown.Toggle as='div' className='chaise-input-group' disabled={props.disableInput} aria-disabled={props.disableInput}>
              <div className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
                {typeof field?.value === 'boolean' ?
                  displayedOptions[rawOptions.indexOf(field?.value)] :
                  <span className='chaise-input-placeholder'>{props.placeholder ? props.placeholder : 'Select a value'}</span>
                }
                <ClearInputBtn
                  btnClassName={`${props.clearClasses} input-switch-clear`}
                  clickCallback={clearInput} show={!props.disableInput && showClear}
                />
              </div>
              {!props.disableInput && <div className='chaise-input-group-append'>
                <button className='chaise-btn chaise-btn-primary' role='button' type='button'>
                  <span className='chaise-btn-icon fa-solid fa-chevron-down' />
                </button>
              </div>}
            </Dropdown.Toggle>
            {!props.disableInput && <Dropdown.Menu>
              {displayedOptions.map((option: any, index: number) => (
                <Dropdown.Item
                  as='li'
                  key={`boolean-val-${makeSafeIdAttr(props.name)}-${index}`}
                  onClick={() => onChange(rawOptions[index])}
                >
                  {option}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>}
          </Dropdown>
          <input className={props.inputClasses} {...field} type='hidden' />
        </div>
      )}
    </InputField>

  );
};

export default BooleanField;
