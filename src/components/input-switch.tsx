import { ClearInputBtn } from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import '@isrd-isi-edu/chaise/src/assets/scss/_input-switch.scss';

type DateTimePickerProps = {
  /**
   * classes for styling the input element
   */
  classes?: string,
  /**
   * the default date value being used
   */
  value: string,
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
  showClearnTimeBtn: boolean,
  /**
   * the handler function called on input change
   */
  handleChange: (() => void)
};

const DateTimePicker = ({ classes, value, handleChange, dateRef,
  timeRef, showClearDateBtn, showClearnTimeBtn }: DateTimePickerProps): JSX.Element => {

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
      <div className='chaise-input-control has-feedback'>
        <input className={classes} type='date' ref={dateRef}
          placeholder='YYYY-MM-DD' min='1970-01-01' max='2999-12-31' step='1' defaultValue={value} onChange={handleChange} />
        <ClearInputBtn
          btnClassName='input-switch-clear'
          clickCallback={handleDateClear}
          show={showClearDateBtn}
        />
      </div>
      <div className='chaise-input-control has-feedback'>
        <input className={classes} type='time' ref={timeRef}
          placeholder='HH:MM' min='00:00' max='23:59' defaultValue='00:00' onChange={handleChange} />
        <ClearInputBtn
          btnClassName='input-switch-clear'
          clickCallback={handleTimeClear}
          show={showClearnTimeBtn}
        />
      </div>
    </div>
  );
};

type InputSwitchProps = {
  /** 
   * placeholder text for int and float input types
  */
  placeholder?: string,
  /**
   * classes for styling the input element
   */
  classes?: string,
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
  value: string,
  /**
   * flag for showing clear button on input field
   */
  showClearBtn: boolean,
  /**
   * flag for showing clear button on time field in case type is timestamp
   */
  showClearnTimeBtn: boolean,
  /**
   * the handler function called on input change
   */
  handleChange: (() => void),
};

const InputSwitch = ({ placeholder = 'Enter', classes = '', reference, timeRef,
  type, value, handleChange, showClearBtn, showClearnTimeBtn }: InputSwitchProps): JSX.Element | null => {

  const clearInput = () => {
    if (reference?.current) reference.current.value = '';
    handleChange();
  }

  return (() => {
    switch (type) {
      case 'timestamp':
        return <DateTimePicker classes={`${classes} input-switch`} value={value} dateRef={reference}
          timeRef={timeRef} showClearDateBtn={showClearBtn} showClearnTimeBtn={showClearnTimeBtn} handleChange={handleChange} />
      case 'int':
      case 'float':
      case 'numeric':
        return (
          <div className='chaise-input-control has-feedback'>
            <input type='number' placeholder={placeholder} className={`${classes} input-switch`} ref={reference} onChange={handleChange} />
            <ClearInputBtn
              btnClassName='input-switch-clear'
              clickCallback={clearInput}
              show={showClearBtn}
            />
          </div>
        );
      case 'date':
        return (
          <div className='chaise-input-control has-feedback'>
            <input type='date' className={`${classes} input-switch`} ref={reference} step='1' defaultValue={value}
              pattern='\d{4}-\d{2}-\d{2}' min='1970-01-01' max='2999-12-31' onChange={handleChange} />
            <ClearInputBtn
              btnClassName='input-switch-clear'
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