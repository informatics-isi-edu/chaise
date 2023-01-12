// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';

// hooks
import { useEffect, useState, useRef } from 'react';
import { useFormContext, useController } from 'react-hook-form';

// utils
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { ResizeSensor } from 'css-element-queries';


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
  const { setValue, control, clearErrors } = useFormContext();

  const textAreaRef = useRef(null);

  const registerOptions = {
    required: false,
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const field = formInput?.field;

  const fieldValue = field?.value;

  const fieldState = formInput?.fieldState;

  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));

  const { error, isTouched } = fieldState;

  useEffect(() => {
    const textAreaElement = textAreaRef.current;
    if (!textAreaElement) return;
    const sensor = new ResizeSensor(textAreaElement, () => {
      fireCustomEvent(
        'input-switch-error-update',
        `.input-switch-container-${makeSafeIdAttr(name)}`,
        { inputFieldName: name, msgCleared: false, type: 'json' }
      );
    });

    return () => {
      sensor.detach();
    }
  }, []);

  const clearInput = () => {
    setValue(name, '');
    clearErrors(name);
  }

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

  useEffect(() => {
    fireCustomEvent(
      'input-switch-error-update',
      `.input-switch-container-${makeSafeIdAttr(name)}`,
      { inputFieldName: name, msgCleared: !Boolean(error?.message), type: 'json' }
    );
  }, [error?.message]);

  return (
    <div className={`${containerClasses} input-switch-container-${makeSafeIdAttr(name)} input-switch-json-container`} style={styles}>
      <div className={`chaise-input-control has-feedback content-box ${classes} ${disableInput ? ' input-disabled' : ''}`} ref={textAreaRef}>
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