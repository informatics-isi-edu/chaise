// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import Overlay from 'react-bootstrap/Overlay';

// hooks
import { useState, useRef, useCallback } from 'react';
import useClickOutside from '@isrd-isi-edu/chaise/src/hooks/click-outside';


// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';


const ColorField = (props: InputFieldProps): JSX.Element => {

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

  /**
   * The color preview rectangle. used in two places
   * @param fieldValue the field value
   * @param cls the class that we should add to the element
   * @param isMain if true, this is the main input and we will attach the `ref` (used for positioning the popup).
   */
  const renderPreview = (fieldValue: any, cls?: string, isMain?: boolean) => {
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
   * @param fieldValue the filed value
   * @param onChange the onChange callback from input-field
   */
  const renderInput = (fieldValue: any, onChange: any) => {
    return <HexColorInput
      className={props.inputClasses} placeholder={props.placeholder}
      disabled={props.disableInput} color={fieldValue} onChange={onChange} prefixed
    />;
  };

  return (
    <InputField {...props}>
      {(field, onChange, showClear, clearInput) => (
        <div className='chaise-input-group input-switch-color'>
          <div
            className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}
            {... (!props.disableInput && { onClick: toggleColorPopup })}
          >
            {renderPreview(field.value, '', true)}
            {renderInput(field.value, onChange)}
            <ClearInputBtn
              btnClassName={`${props.clearClasses} input-switch-clear`}
              clickCallback={clearInput} show={!props.disableInput && showClear}
            />
          </div>
          {!props.disableInput && <div className='chaise-input-group-append' onClick={toggleColorPopup}>
            <ChaiseTooltip placement='bottom' tooltip='Select a color.'>
              <button className='chaise-btn chaise-btn-primary' role='button' type='button'>
                <span className='chaise-btn-icon fa-solid fa-chevron-down' />
              </button>
            </ChaiseTooltip>
          </div>}
          <Overlay placement='bottom-start' target={colorMainInput.current} show={showColorPopup} ref={colorPopup}>
            {({ placement, arrowProps, show: _show, popper, ...props }) => (
              // `props` are passed from Overlay to its child. it will attach the css rules for positioning and etc.
              <div {...props} className='popover chaise-color-picker-popup'>
                <HexColorPicker color={field.value} onChange={onChange} />
                <div className='popover-controls'>
                  {renderInput(field.value, onChange)}
                  <div className='popover-buttons'>
                    {renderPreview(field.value, 'chaise-btn')}
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
        </div>
      )}
    </InputField>

  );
};

export default ColorField;
