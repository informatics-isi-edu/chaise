import '@isrd-isi-edu/chaise/src/assets/scss/_input-switch.scss';

// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';

// models
import { RangeOption,TimeStamp } from '@isrd-isi-edu/chaise/src/models/range-picker';

type DateTimePickerProps = {
  /**
   * classes for styling the date input element
   */
  dateClasses?: string,
  /**
   * classes for styling the time input element
   */
  timeClasses?: string,
  /**
   * classes for styling the clear button in the date input
   */
  dateClearClasses?: string,
  /**
   * classes for styling the clear button in the time input
   */
  timeClearClasses?: string,
  /**
   * placeholder for the date input of datetime
   */
  datePlaceholder?: string,
  /**
   * placeholder for the time input of datetime
   */
  timePlaceholder?: string,
  /**
   * the default date value being used
   */
  value?: TimeStamp,
  /**
   * the react ref object referencing the date input element
   */
  dateRef?: React.RefObject<HTMLInputElement>,
  /**
   * the react ref object referencing the time input element
   */
  timeRef?: React.RefObject<HTMLInputElement>,
  /**
   * flag for showing clear button on date field
   */
  showClearDateBtn: boolean,
  /**
   * flag for showing clear button on time field
   */
  showClearTimeBtn: boolean,
  /**
   * flag for disbaling the inputs
   */
  disableInput?: boolean,
  /**
   * the handler function called on input change
   */
  handleChange: (() => void)
};

const DateTimePicker = ({
  dateClasses,
  timeClasses,
  dateClearClasses,
  timeClearClasses,
  datePlaceholder,
  timePlaceholder,
  value,
  handleChange,
  dateRef,
  timeRef,
  showClearDateBtn,
  showClearTimeBtn,
  disableInput,
}: DateTimePickerProps): JSX.Element => {

  const handleTimeClear = () => {
    if (timeRef?.current) timeRef.current.value = '';
    handleChange();
  }

  const handleDateClear = () => {
    if (dateRef?.current) dateRef.current.value = '';
    handleChange();
  }

  return (
    <div className='input-switch-datetime'>
      <div className={'input-switch-date chaise-input-control has-feedback' + (disableInput ? ' input-disabled' : '')}>
        <input className={dateClasses} type='date' ref={dateRef} disabled={disableInput}
          placeholder={datePlaceholder} min='1970-01-01' max='2999-12-31' step='1' defaultValue={value?.date} onChange={handleChange} required />
        <ClearInputBtn
          btnClassName={'input-switch-clear' + (dateClearClasses ? ' ' + dateClearClasses : '') }
          clickCallback={handleDateClear}
          show={showClearDateBtn}
        />
      </div>
      <div className={'input-switch-time chaise-input-control has-feedback' + (disableInput ? ' input-disabled' : '')}>
        <input className={timeClasses} type='time' ref={timeRef} disabled={disableInput}
          placeholder={timePlaceholder} min='00:00:00' max='23:59:59' step='1' defaultValue={value?.time} onChange={handleChange} required />
        <ClearInputBtn
          btnClassName={'input-switch-clear' + (timeClearClasses ? ' ' + timeClearClasses : '') }
          clickCallback={handleTimeClear}
          show={showClearTimeBtn}
        />
      </div>
    </div>
  );
};

type InputSwitchProps = {
  /**
   * placeholder text for inputs
  */
  placeholder?: RangeOption,
  /**
   * placeholder for the date input of datetime
   */
  datePlaceholder?: string,
  /**
   * placeholder for the time input of datetime
   */
  timePlaceholder?: string,
  /**
   * classes for styling the input element
   */
  classes?: string,
  /**
   * classes for styling the date input element
   */
  dateClasses?: string,
  /**
  * classes for styling the time input element
  */
  timeClasses?: string,
  /**
   * classes for styling the clear button in the input
   */
  clearClasses?: string,
  /**
   * classes for styling the clear button in the date input
   */
  dateClearClasses?: string,
  /**
   * classes for styling the clear button in the time input
   */
  timeClearClasses?: string,
  /**
   * the react ref object referencing the input element
  */
  reference?: React.RefObject<HTMLInputElement>,
  /**
   * the react ref object referencing the input time element in case of timestamp type
  */
  timeRef?: React.RefObject<HTMLInputElement>,
  /**
   * the type of input :
   * int
   * float
   * numeric
   * date
   * timestamp
   */
  type: string,
  /**
   * the default date value being used in case of date and timestamp types
   */
  value?: RangeOption,
  /**
   * flag for showing clear button on input field
   */
  showClearBtn: boolean,
  /**
   * flag for showing clear button on time field in case type is timestamp
   */
  showClearTimeBtn: boolean,
  /**
   * flag for disabling the input
   */
  disableInput?: boolean,
  /**
   * the handler function called on input change
   */
  handleChange: (() => void),
};

const InputSwitch = ({
  placeholder = 'Enter',
  datePlaceholder= 'YYYY-MM-DD',
  timePlaceholder= 'HH:mm:ss',
  classes = '',
  dateClasses = '',
  timeClasses = '',
  reference,
  timeRef,
  type,
  value,
  handleChange,
  clearClasses = '',
  dateClearClasses = '',
  timeClearClasses = '',
  showClearBtn,
  showClearTimeBtn,
  disableInput
}: InputSwitchProps): JSX.Element | null => {

  const clearInput = () => {
    if (reference?.current) reference.current.value = '';
    handleChange();
  }

  return (() => {
    switch (type) {
      case 'timestamp':
        return <DateTimePicker
          dateClasses={`${dateClasses} input-switch`}
          timeClasses={`${timeClasses} input-switch`}
          value={value as TimeStamp}
          dateRef={reference}
          timeRef={timeRef}
          dateClearClasses={dateClearClasses}
          timeClearClasses={timeClearClasses}
          showClearDateBtn={showClearBtn}
          showClearTimeBtn={showClearTimeBtn}
          handleChange={handleChange}
          disableInput={disableInput}
          datePlaceholder={datePlaceholder}
          timePlaceholder={timePlaceholder}
        />
      case 'int':
      case 'float':
      case 'numeric':
        return (
          <div className={'input-switch-date chaise-input-control has-feedback' + (disableInput ? ' input-disabled' : '')}>
            <input
              className={`${classes} input-switch`}
              defaultValue={value as number}
              onChange={handleChange}
              placeholder={placeholder as string}
              ref={reference}
              disabled={disableInput}
            />
            <ClearInputBtn
              btnClassName={'input-switch-clear' + (clearClasses ? ' ' + clearClasses : '') }
              clickCallback={clearInput}
              show={showClearBtn}
            />
          </div>
        );
      case 'date':
        return (
          <div className={'input-switch-date chaise-input-control has-feedback' + (disableInput ? ' input-disabled' : '')}>
            <input
              className={`${classes} input-switch`}
              defaultValue={value as string}
              onChange={handleChange}
              pattern='\d{4}-\d{2}-\d{2}'
              placeholder={placeholder as string}
              ref={reference}
              required
              step='1'
              type='date'
              disabled={disableInput}
            />
            <ClearInputBtn
              btnClassName={'input-switch-clear' + (clearClasses ? ' ' + clearClasses : '') }
              clickCallback={clearInput}
              show={showClearBtn}
            />
          </div>
        );
      default:
        return null
    }
  })();
};


export default InputSwitch;
