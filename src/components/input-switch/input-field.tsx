import '@isrd-isi-edu/chaise/src/assets/scss/_input-switch.scss';

// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';

// hooks
import { useEffect, useState, useRef } from 'react';
import { useFormContext, useController, useWatch, ControllerRenderProps, FieldValues } from 'react-hook-form';

// models
import { RangeOption, TimeStamp } from '@isrd-isi-edu/chaise/src/models/range-picker';
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { arrayFieldPlaceholder, ERROR_MESSAGES } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';


export type InputFieldProps = {
  /**
   * the typename of the column
   */
  type: string,
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
  clearClasses?: string,
  /**
   * whether this input is required or not
   */
  requiredInput?: boolean,
  /**
  * flag for disabling the input
  */
  disableInput?: boolean,
  /**
  * flag to show error below the input switch component
  */
  displayErrors?: boolean,
  /**
   * The styles attached to the container
   */
  styles?: any,
}


type InputFieldChildFn = (
  (
    field: ControllerRenderProps<FieldValues, string>,
    onChange: (value: any) => void,
    showClear: boolean,
    clearInput: (e: any) => void
  ) => JSX.Element
)


export type InputFieldCompProps = InputFieldProps & {
  children: JSX.Element | InputFieldChildFn,
  /**
  * the handler function called on input clear
  */
  onClear?: ((e: any) => void),
  /**
   * if not
   */
  controllerRules?: any,
  /**
   * a callback that accepts the value, and return true if value is non-empty.
   * if this callback is not defined, we will use a simple Boolean(value) check.
   */
  checkHasValue?: (val: any) => boolean,
  /**
   * a callback that will be called on change of the value
   * if it's defined and returns false, we will not change the value.
   */
  handleChange?: (event: any) => boolean,
  /**
   * a callback that is called to see if the input has been touched or not.
   * this is useful in date-time when we're not touching the actual input.
   */
  checkIsTouched?: () => boolean,
};

const InputField = ({
  children,
  name,
  requiredInput,
  displayErrors,
  containerClasses,
  styles,
  onClear,
  controllerRules,
  checkHasValue,
  handleChange,
  checkIsTouched
}: InputFieldCompProps): JSX.Element => {

  const { setValue, control, clearErrors } = useFormContext();

  controllerRules = isObjectAndNotNull(controllerRules) ? controllerRules : {};
  if (requiredInput) {
    controllerRules.required = ERROR_MESSAGES.REQUIRED;
  }

  const formInput = useController({
    name,
    control,
    rules: controllerRules,
  });

  const field = formInput?.field;

  const fieldValue = field?.value;

  const fieldState = formInput?.fieldState;

  const hasValue = checkHasValue ? checkHasValue(fieldValue) : Boolean(fieldValue);
  const [showClear, setShowClear] = useState<boolean>(hasValue);

  const { error, isTouched } = fieldState;

  const clearInput = (e: any) => {
    if (onClear) {
      onClear(e);
    }
    e.stopPropagation();
    e.preventDefault();
    setValue(name, '');
    clearErrors(name);
  }

  useEffect(() => {

    const hasValue = checkHasValue ? checkHasValue(fieldValue) : Boolean(fieldValue);
    if (showClear != hasValue) {
      setShowClear(hasValue);
    }
  }, [fieldValue]);

  const onChange = (e: any) => {
    if (handleChange && !handleChange(e)) {
      return;
    }
    field.onChange(e);
    field.onBlur();
  };

  /**
   * we don't want to show the required error until it's submitted
   */
  let showError = !!error?.message && displayErrors;
  if (showError) {
    if (error?.type === 'required') {
      showError = formInput.formState.isSubmitted;
    } else {
      showError = checkIsTouched ? checkIsTouched() : isTouched;
    }
  }

  return (
    <div className={`${containerClasses} input-switch-container-${makeSafeIdAttr(name)}`} style={styles}>
      {typeof children === 'function' ? children(field, onChange, showClear, clearInput) : children}
      {showError && error?.message && <span className='input-switch-error text-danger'>{error.message}</span>}
    </div>
  );
};


export default InputField;
