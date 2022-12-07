// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { HexColorPicker, HexColorInput } from 'react-colorful';

// hooks
import { useEffect, useState, useRef, useCallback } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import useClickOutside from '@isrd-isi-edu/chaise/src/hooks/click-outside';

// utils
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';


type ColorFieldProps = {
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

const ColorField = ({
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
}: ColorFieldProps): JSX.Element => {

  const { setValue, control, clearErrors } = useFormContext();

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

  const [showHexSign, setShowHexSign] = useState(false);
  const [showColorPopup, setShowColorPopup] = useState(false);
  const toggleColorPopup = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setShowColorPopup((val) => !val)
  };
  const close = useCallback(() => setShowColorPopup(false), []);

  const colorPopup = useRef<any>();
  useClickOutside(colorPopup, close);

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
    fireCustomEvent('input-switch-error-update', `.input-switch-container-${name}`, { inputFieldName: name, msgCleared: !Boolean(error?.message) });
  }, [error?.message]);

  /**
   * since we have the preview button in both places, I decided to create a
   * function for it.
   */
  const renderPreview = (cls?: string) => {
    let className = 'chaise-color-picker-preview';
    if (!isStringAndNotEmpty(fieldValue)) className += ' no-color';
    if (cls) className += ` ${cls}`;
    return (
      <div className={className} style={{ backgroundColor: `${fieldValue}` }} />
    )
  };

  const renderInput = () => {
    return <HexColorInput color={fieldValue} onChange={handleChange} prefixed />;
  }

  return (
    <div className={`${containerClasses} chaise-input-group input-switch-color input-switch-container-${name}`} style={styles}>
      <div
        className={`chaise-input-control has-feedback ${classes} ${disableInput ? ' input-disabled' : ''}`}
        onClick={toggleColorPopup}
      >
        {renderPreview()}
        {/* <span className='hex-sign'>#</span> */}
        {renderInput()}
        <ClearInputBtn
          btnClassName={`${clearClasses} input-switch-clear`}
          clickCallback={(e: any) => { e.stopPropagation(); clearInput(); }}
          show={showClear}
        />
      </div>
      <div className='chaise-input-group-append' onClick={toggleColorPopup}>
        <ChaiseTooltip placement='bottom' tooltip='Select a color.'>
          <button className='chaise-btn chaise-btn-primary' role='button' type='button'>
            <span className='chaise-btn-icon fa-solid fa-chevron-down' />
          </button>
        </ChaiseTooltip>
      </div>
      {showColorPopup &&
        <div className='popover' ref={colorPopup}>
          <HexColorPicker color={fieldValue} onChange={handleChange} />
          {/* <span>color is {fieldValue}</span> */}
          <div className='popover-controls'>
            {renderInput()}
            <div className='popover-buttons'>
              {renderPreview('chaise-btn')}
              <ChaiseTooltip
                placement='bottom'
                tooltip='Clear the value.'
              >
                <button className='chaise-btn chaise-btn-secondary' type='button' onClick={clearInput}>Clear</button>
              </ChaiseTooltip>
              <ChaiseTooltip
                placement='bottom'
                tooltip='Close the color picker.'
              >
                <button className='chaise-btn chaise-btn-secondary' type='button' onClick={toggleColorPopup}>Close</button>
              </ChaiseTooltip>
            </div>
          </div>
        </div>
      }
      {displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span>}
    </div >
  );
};

export default ColorField;
