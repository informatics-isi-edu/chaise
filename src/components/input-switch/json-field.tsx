// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';

// hooks
import { useEffect, useState } from 'react';
import { useFormContext, useController } from 'react-hook-form';

// utils
import { ERROR_MESSAGES } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

const jsonFieldValidation = (value: string) => {
  if (!value) return;

  try {
    JSON.parse(value);
    return true;
  } catch (error) {
    return ERROR_MESSAGES.INVALID_JSON;
  }
};

type JsonFieldProps = {
  /**
   *  the name of the field
   */
  name: string,
  /**
  * placeholder text
  */
  placeholder?: string,
  /**
  * classes for styling the input element
  */
  classes?: string,
  inputClasses?: string,
  containerClasses?: string,
  /**
  * classes for styling the clear button
  */
  clearClasses?: string
  /**
  * flag for disabling the input
  */
  disableInput?: boolean,
  /**
  * flag to show error below the input switch component
  */
  displayErrors?: boolean,
  value: string,
  styles?: any,
  /**
  * the handler function called on input change
  */
  onFieldChange?: ((value: string) => void)
};

const JsonField = ({
  name,
  placeholder,
  classes,
  inputClasses,
  clearClasses,
  disableInput,
  displayErrors,
  value,
  containerClasses,
  styles,
  onFieldChange,
}: JsonFieldProps): JSX.Element => {

  // react-hook-form setup
  const { setValue, control, clearErrors } = useFormContext();

  const registerOptions = {
    required: false,
    validate: jsonFieldValidation
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions
  });

  const field = formInput?.field;
  const fieldValue = field?.value;
  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));

  const fieldState = formInput?.fieldState;
  const { error, isTouched } = fieldState;

  useEffect(() => {
    if (onFieldChange) {
      onFieldChange(fieldValue);
    }

    if (showClear != Boolean(fieldValue)) {
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);

  useEffect(() => {
    if (value === undefined) return;
    setValue(name, value);
  }, [value]);

  const handleChange = (v: any) => {
    field.onChange(v);
    field.onBlur();
  };

  const clearInput = () => {
    setValue(name, '');
    clearErrors(name);
  }

  return (
    <div className={`${containerClasses} input-switch-container-${makeSafeIdAttr(name)} input-switch-json-container`} style={styles}>
      <div className={`chaise-input-control has-feedback content-box ${classes} ${disableInput ? ' input-disabled' : ''}`}>
        <textarea placeholder={placeholder} rows={5} className={`${inputClasses} input-switch`} {...field} onChange={handleChange} />
        <ClearInputBtn
          btnClassName={`${clearClasses} input-switch-clear`}
          clickCallback={clearInput}
          show={showClear}
        />
      </div>
      {displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span>}
    </div>
  );
}

export default JsonField;
