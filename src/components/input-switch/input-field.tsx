import '@isrd-isi-edu/chaise/src/assets/scss/_input-switch.scss';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import React, { useEffect, useState } from 'react';
import { useFormContext, useController, ControllerRenderProps, FieldValues, UseControllerReturn } from 'react-hook-form';

// utils
import { ERROR_MESSAGES } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';


export type InputFieldProps = {
  /**
   * the typename of the column
   */
  type: string,
  /**
   * the name of the field for react hook form (with no special characters)
   */
  name: string,
  /**
   * the name of the field for attaching a specific class to input-switch-container and the input
   */
  inputName: string,
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
  /**
   * if true, do not intercept on enter
   * by default, we are capturing the "enter" key event and stopping it
   */
  allowEnter?: boolean
  /**
   * display required error regardless of whether the form has been submitted or not.
   */
  displayRequiredErrorBeforeSubmit? : boolean
  /**
   * `optional`additional controller rules for the input field.
   *  Check allowed rules here - https://react-hook-form.com/docs/useform/register#options
   */
   additionalControllerRules?: {
    [key: string]: (string | number | boolean | RegExp | Function | Object) | {
      value: (boolean | number | RegExp),
      /**
       * Error message
       */
      message: string
    }
  }
}


type InputFieldChildFn = (
  (
    field: ControllerRenderProps<FieldValues, string>,
    onChange: (event?: any) => void,
    showClear: boolean,
    clearInput: (e: any) => void,
    formInput: UseControllerReturn<FieldValues, string>,
  ) => JSX.Element
)


export type InputFieldCompProps = InputFieldProps & {
  children: JSX.Element | InputFieldChildFn,
  /**
  * the handler function called on input clear
  */
  onClear?: ((e: any) => void),
  /**
   * the rules attached to the input. can be used to define a custome validator
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
  inputName,
  requiredInput,
  displayErrors,
  containerClasses = '',
  styles,
  allowEnter = false,
  displayRequiredErrorBeforeSubmit,
  onClear,
  controllerRules,
  checkHasValue,
  handleChange,
  checkIsTouched,
  additionalControllerRules,
}: InputFieldCompProps): JSX.Element => {

  const { setValue, control, clearErrors ,trigger} = useFormContext();

  controllerRules = isObjectAndNotNull(controllerRules) ? controllerRules : {};
  if (requiredInput) {
    controllerRules.required = ERROR_MESSAGES.REQUIRED;
  }

  const formInput = useController({
    name,
    control,
    rules: {...controllerRules, ...additionalControllerRules},
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
    clearErrors(name);
    setValue(name, '');
    trigger(name); // triggers validation on the form field
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

  // intercept enter key down event and stop it from submitting the form
  // input types that we "allowEnter" include:
  //   - array, markdown, longtext, json, and jsonb
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!allowEnter && event.key === 'Enter') event.preventDefault();
  }

  /**
   * we don't want to show the required error until it's submitted
   */
  let showError = !!error?.message && displayErrors;
  if (showError) {
    if (error?.type === 'required') {
      // We always show this error for array-input fields. In case of other fields, we show this once form submit event is triggered.
      showError = formInput.formState.isSubmitted || displayRequiredErrorBeforeSubmit; 
    } else {
      showError = checkIsTouched ? checkIsTouched() : isTouched;
    }
  }

  return (
    <div className={`${containerClasses} input-switch-container-${makeSafeIdAttr(inputName)}`} style={styles} onKeyDown={handleKeyDown}>
      {typeof children === 'function' ? children(field, onChange, showClear, clearInput, formInput) : children}
      {showError && error?.message &&
        <DisplayValue internal as='span' className='input-switch-error text-danger' value={{ isHTML: true, value: error.message }} />
      }
    </div>
  );
};


export default React.memo(InputField);
