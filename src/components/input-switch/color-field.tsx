// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import Overlay from 'react-bootstrap/Overlay';

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

  const [showColorPopup, setShowColorPopup] = useState(false);
  const toggleColorPopup = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setShowColorPopup((val) => !val)
  };
  const close = useCallback(() => setShowColorPopup(false), []);

  // used by Overlay to position the popup
  const colorMainInput = useRef<any>();

  // used for the outside click
  const colorPopup = useRef<any>();

  // close the popup when clicked outside
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
   * The color preview rectangle. used in two places
   * @param cls the class that we should add to the element
   * @param isMain if true, this is the main input and we will attach the `ref` (used for positioning the popup).
   */
  const renderPreview = (cls?: string, isMain?: boolean) => {
    let className = 'chaise-color-picker-preview';
    // if value is empty, show special background image instead of the color
    if (!isStringAndNotEmpty(fieldValue)) className += ' no-color';
    if (cls) className += ` ${cls}`;
    return (
      <div className={className} style={{ backgroundColor: `${fieldValue}` }} {...(isMain && { ref: colorMainInput })} />
    );
  };

  /**
   * the text input for writing the color hex value. used in two places
   */
  const renderInput = () => {
    return <HexColorInput className={inputClasses} placeholder={placeholder} color={fieldValue} onChange={handleChange} prefixed />;
  };

  return (
    <div className={`${containerClasses} chaise-input-group input-switch-color input-switch-container-${name}`} style={styles}>
      <div
        className={`chaise-input-control has-feedback ${classes} ${disableInput ? ' input-disabled' : ''}`}
        onClick={toggleColorPopup}
      >
        {renderPreview('', true)}
        {renderInput()}
        <ClearInputBtn btnClassName={`${clearClasses} input-switch-clear`} clickCallback={clearInput} show={showClear} />
      </div>
      <div className='chaise-input-group-append' onClick={toggleColorPopup}>
        <ChaiseTooltip placement='bottom' tooltip='Select a color.'>
          <button className='chaise-btn chaise-btn-primary' role='button' type='button'>
            <span className='chaise-btn-icon fa-solid fa-chevron-down' />
          </button>
        </ChaiseTooltip>
      </div>
      <Overlay placement='bottom-start' target={colorMainInput.current} show={showColorPopup} ref={colorPopup}>
        {({ placement, arrowProps, show: _show, popper, ...props }) => (
          // `props` are passed from Overlay to its child. it will attach the css rules for positioning and etc.
          <div {...props} className='popover chaise-color-picker-popup'>
            <HexColorPicker color={fieldValue} onChange={handleChange} />
            <div className='popover-controls'>
              {renderInput()}
              <div className='popover-buttons'>
                {renderPreview('chaise-btn')}
                <ChaiseTooltip placement='bottom' tooltip='Clear the value.'>
                  <button className='chaise-btn chaise-btn-secondary' type='button' onClick={clearInput}>Clear</button>
                </ChaiseTooltip>
                <ChaiseTooltip placement='bottom' tooltip='Close the color picker.'>
                  <button className='chaise-btn chaise-btn-secondary' type='button' onClick={toggleColorPopup}>Close</button>
                </ChaiseTooltip>
              </div>
            </div>
          </div>
        )}
      </Overlay>
      {displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span>}
    </div >
  );
};

export default ColorField;
