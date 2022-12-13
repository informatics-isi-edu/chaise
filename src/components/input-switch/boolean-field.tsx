// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Dropdown from 'react-bootstrap/Dropdown';

// hooks
import { useEffect, useState } from 'react';
import { useFormContext, useController } from 'react-hook-form';

// models
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { formatBoolean } from '@isrd-isi-edu/chaise/src/utils/input-utils';


type BooleanFieldProps = {
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
  onFieldChange?: ((value: string) => void),
  /**
   * The column model representing this field in the form.
   */
  columnModel?: RecordeditColumnModel,
};

const BooleanField = ({
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
  columnModel
}: BooleanFieldProps): JSX.Element => {
  const { setValue, control, clearErrors } = useFormContext();

  const registerOptions = {
    required: columnModel?.isRequired,
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const field = formInput?.field;

  const fieldValue = field?.value;

  const fieldState = formInput?.fieldState;

  const [showClear, setShowClear] = useState<boolean>(typeof fieldValue !== 'boolean');

  const { error, isTouched } = fieldState;

  const clearInput = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setValue(name, '');
    clearErrors(name);
  }

  useEffect(() => {
    if (onFieldChange) {
      onFieldChange(fieldValue);
    }
    const nonEmpty = (typeof fieldValue === 'boolean');
    if (showClear !== nonEmpty) {
      setShowClear(nonEmpty);
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


  const rawOptions = [true, false];
  const displayedOptions = rawOptions.map((op) => columnModel ? formatBoolean(columnModel.column, op) : op.toString());

  return (
    <div className={`${containerClasses} input-switch-boolean input-switch-container-${name}`} style={styles}>
      <Dropdown>
        <Dropdown.Toggle as='div' disabled={disableInput} className='chaise-input-group'>
          <div className={`chaise-input-control has-feedback ${classes} ${disableInput ? ' input-disabled' : ''}`}>
            {typeof fieldValue === 'boolean' ?
              displayedOptions[rawOptions.indexOf(fieldValue)] :
              <span className='chaise-input-placeholder'>Select a value</span>
            }
            <ClearInputBtn btnClassName={`${clearClasses} input-switch-clear`} clickCallback={clearInput} show={showClear} />
          </div>
          <div className='chaise-input-group-append'>
            <button className='chaise-btn chaise-btn-primary' role='button' type='button'>
              <span className='chaise-btn-icon fa-solid fa-chevron-down' />
            </button>
          </div>
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {displayedOptions.map((option: any, index: number) => (
            <Dropdown.Item
              as='li'
              key={`boolean-val-${name}-${index}`}
              // first option is true, and second is false.
              onClick={() => handleChange(rawOptions[index])}
            >
              {option}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      <input {...field} type='hidden' />
      {displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span>}
    </div >
  );
};

export default BooleanField;
