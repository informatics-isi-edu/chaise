// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import Dropdown from 'react-bootstrap/Dropdown';
import EllipsisWrapper from '@isrd-isi-edu/chaise/src/components/ellipsis-wrapper';

// utils
import { ERROR_MESSAGES } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { formatBoolean } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { useRef } from 'react';

type BooleanFieldProps = InputFieldProps & {
  columnModel?: any,
}

const BooleanField = (props: BooleanFieldProps): JSX.Element => {


  const ellipsisRef = useRef(null);

  /**
   * input-field checks for falsy values, but "false" is a
   * valid value here and we need to check the type instead.
   */
  const hasValue = (v: any) => {
    return (typeof v === 'boolean');
  };

  /**
   * check if the parameter is empty
   */
  const isEmptyValue = (v: any) => {
    return v === '' || v === null || v === undefined;
  }

  /**
   * defining the validators this way, so we can also modify the "required" check.
   * The default react-hook-forms check is "truthy" which will not allow "false"
   * values for required inputs.
   */
  const booleanFieldValidation = {
    required: (v: any) => {
      if (props.requiredInput && isEmptyValue(v)) {
        return ERROR_MESSAGES.REQUIRED;
      }
      return true;
    },
    validateBoolean: (v: any) => {
      // ignore empty values as we're handling them in the "required" validator
      if (isEmptyValue(v)) {
        return true;
      }

      // if it has a boolean value, then it's valid
      if (typeof v === 'boolean') {
        return true;
      }

      // this won't happen through the current UI but added for completeness
      return ERROR_MESSAGES.INVALID_BOOLEAN;
    }
  }

  const onToggle = (show: boolean) => {
    const formContainer = document.querySelector('.form-container .recordedit-form') as HTMLElement

    if (show) {
      formContainer.classList.add('dropdown-open');
    } else {
      formContainer.classList.remove('dropdown-open');
    }
  }

  // first option is true, and second is false.
  const rawOptions = [true, false];
  const displayedOptions = rawOptions.map((op) => props.columnModel ? formatBoolean(props.columnModel.column, op) : op.toString());

  return (
    <InputField {...props}
      requiredInput={false} checkHasValue={hasValue}
      controllerRules={{
        validate: booleanFieldValidation
      }}
    >
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-boolean'>
          <Dropdown onToggle={onToggle} aria-disabled={props.disableInput}>
            <Dropdown.Toggle as='div' className='chaise-input-group no-caret' disabled={props.disableInput} aria-disabled={props.disableInput}>
              <EllipsisWrapper
                elementRef={ellipsisRef}
                tooltip={field?.value}
              >
                <div className={`chaise-input-control has-feedback ellipsis ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`} ref={ellipsisRef}>
                  {typeof field?.value === 'boolean' ?
                    displayedOptions[rawOptions.indexOf(field?.value)] :
                    <span className='chaise-input-placeholder'>{props.placeholder ? props.placeholder : 'Select a value'}</span>
                  }
                  <ClearInputBtn
                    btnClassName={`${props.clearClasses} input-switch-clear`}
                    clickCallback={clearInput} show={!props.disableInput && showClear}
                  />
                </div>
              </EllipsisWrapper>
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
          <input className={`${props.inputClasses} ${props.inputClassName}`} {...field} type='hidden' />
        </div>
      )}
    </InputField>

  );
};

export default BooleanField;
