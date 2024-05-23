// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import { IMaskInput, IMask } from 'react-imask';

// hooks
import { useFormContext } from 'react-hook-form';

// utils
import { VALIDATE_VALUE_BY_TYPE } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

type DateFieldProps = InputFieldProps & {
  /**
   * whether we should show the extra buttons or not
   */
  displayExtraDateTimeButtons?: boolean,
  /**
   * whether we should show the label or not
   */
  displayDateTimeLabels?: boolean
}


const DateField = (props: DateFieldProps): JSX.Element => {

  const { setValue } = useFormContext();

  const rules = {
    validate: VALIDATE_VALUE_BY_TYPE['date']
  };

  const applyToday = (e: any) => {
    e.stopPropagation();
    setValue(props.name, windowRef.moment().format(dataFormats.date));
  }

  return (
    <InputField {...props} controllerRules={rules}>
      {(field, onChange, showClear, clearInput) => (
        <div className='chaise-input-group input-switch-date'>
          {props.displayDateTimeLabels && <div className='chaise-input-group-prepend'>
            <div className='chaise-input-group-text dt-width'>Date</div>
          </div>}
          <div className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
            <IMaskInput
              // ------------ input props ----------- //
              className={`${props.inputClasses} input-switch ${props.inputClassName} ${showClear ? 'date-input-show-clear' : ''}`}
              disabled={props.disableInput}
              placeholder={props.placeholder ? props.placeholder : dataFormats.placeholder.date}
              /**
               * this will make sure we're calling the onChange of react-hook-forms
               * on each data update.
               * if we don't want to show the validation error while user is typing,
               * we can add validation logic to this to skip calling onChange.
               */
              onAccept={(value, mask) => {
                // the value is the "masked" value so we have to make sure we're treating the mask as empty
                onChange({ target: { value : value === dataFormats.date ? '' : value } })
                return true;
              }}
              {...field}
              // ------------ IMask specific props ----------- //
              mask={Date}
              pattern={dataFormats.date}
              /**
               * the underlying value in IMaskInput is a "Date" object.
               * The following two functions will make sure we're properly
               * converting a strored "Date" object to string (what user sees)
               * and vice versa.
               */
              format={(date) => windowRef.moment(date).format(dataFormats.date)}
              parse={(str) => windowRef.moment(str, dataFormats.date)}
              autofix={false}
              /**
               * when lazy is set to true, it will not show the pattern to users.
               * so we set it to true when the input is empty or is disabled.
               */
              lazy={field.value === '' || props.disableInput ? true : false}
              blocks={{
                // `0` in mask means any numbers. so this is saying any numbers.
                YYYY: { mask: '0000', placeholderChar: 'Y' },
                MM: { mask: IMask.MaskedRange, from: 1, to: 12, maxLength: 2, placeholderChar: 'M' },
                DD: { mask: IMask.MaskedRange, from: 1, to: 31, maxLength: 2, placeholderChar: 'D' }
              }}
            />
            <ClearInputBtn
              btnClassName={`${props.clearClasses} input-switch-clear`}
              clickCallback={clearInput}
              show={showClear && !props.disableInput}
            />
          </div>
          {!props.disableInput && props.displayExtraDateTimeButtons && <div className='chaise-input-group-append'>
            <button type='button' className='date-today-btn chaise-btn chaise-btn-secondary' onClick={applyToday}>Today</button>
          </div>}
        </div>
      )}
    </InputField>

  );
};

export default DateField;
