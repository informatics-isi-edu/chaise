import '@isrd-isi-edu/chaise/src/assets/scss/_range-input.scss';
import { useState, useRef } from 'react';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { ClearInputBtn } from '@isrd-isi-edu/chaise/src/components/clear-input-btn';


const INTEGER_REGEXP = /^\-?\d+$/;

const FLOAT_REGEXP = /^\-?(\d+)?((\.)?\d+)?$/;

const TIME_FORMAT = 'YYYY-MM-DDTHH:mm';

const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * an object for mapping the error codes to the error messages
 */
const errorMsgMap: {
    [key: string]: string;
} = {
    'empty': 'Please enter either From or To value',
    'range': 'From value cannot be greater than the To value',
    'int': 'Please enter an integer value',
    'float': 'Please enter a decimal value',
    'date': 'Please enter a date value in YYYY-MM-DD format',
    'timestamp': 'Please enter a time value in YYYY-MM-DD HH:MM format'
};

type DateTimePickerProps = {
    classes?: string,
    id: string,
    value: string,
    dateRef: React.RefObject<HTMLInputElement>,
    timeRef: React.RefObject<HTMLInputElement>,
    handleChange: ((value: string) => void)
};

const DateTimePicker = ({ classes, id, value, handleChange, dateRef, timeRef }: DateTimePickerProps): JSX.Element => {

    const changeHandler = () => {
        const dateVal = dateRef?.current?.value;
        let timeVal = timeRef?.current?.value;

        console.log({ dateVal, timeVal });

        if (dateVal && !timeVal) timeVal = '00:00';

        handleChange(`${dateVal || ''}T${timeVal}`);
    }

    const handleTimeClear = () => {
        if (timeRef?.current) timeRef.current.value = '';
        changeHandler();
    }

    const handleDateClear = () => {
        if (dateRef?.current) dateRef.current.value = '';
        changeHandler();
    }

    return (
        <div className='range-input-datetime'>
            <div className='chaise-input-control has-feedback'>
                <input id={`${id}-date`} className={classes} type='date' ref={dateRef}
                    placeholder='YYYY-MM-DD' min='1970-01-01' max='2999-12-31' step='1' defaultValue={value} onChange={changeHandler} />
                <ClearInputBtn
                    btnClassName='range-input-clear'
                    clickCallback={handleDateClear}
                    show
                />
            </div>
            <div className='chaise-input-control has-feedback'>
                <input id={`${id}-time`} className={classes} type='time' ref={timeRef}
                    placeholder='HH:MM' min='00:00' max='23:59' defaultValue='00:00' onChange={changeHandler} />
                <ClearInputBtn
                    btnClassName='range-input-clear'
                    clickCallback={handleTimeClear}
                    show
                />
            </div>
        </div>
    );
};

type RangeInputProps = {
    placeholder?: string,
    classes?: string,
    reference: React.RefObject<HTMLInputElement>,
    timeRef: React.RefObject<HTMLInputElement>,
    type: string,
    id: string,
    value: string,
    handleChange: ((value: string) => void)
};

const RangeInput = ({ placeholder = 'Enter', classes = '', reference, timeRef, type, value, id, handleChange }: RangeInputProps): JSX.Element => {

    const changeHandler = () => handleChange(reference?.current?.value || '');

    const clearInput = () => {
        if (reference?.current) reference.current.value = '';
        changeHandler();
    }

    return (
        type === 'timestamp' ? (
            <DateTimePicker classes={classes} id={id} value={value} dateRef={reference} timeRef={timeRef} handleChange={handleChange} />
        ) : (
            <div className='chaise-input-control has-feedback'>
                {
                    type === 'int' || type === 'float' ? <input id={id} type='number' placeholder={placeholder} className={classes}
                        ref={reference} onChange={changeHandler} />
                        : <input id={id} type='date' className={classes} ref={reference} step='1'
                            defaultValue={value} pattern='\d{4}-\d{2}-\d{2}' min='1970-01-01' max='2999-12-31' onChange={changeHandler} />
                }
                <ClearInputBtn
                    btnClassName='range-input-clear'
                    clickCallback={clearInput}
                    show
                />
            </div>
        )

    )
};


type RangeInputHOCProps = {
    /**
     * an string for the type of input expected:
     * int
     * float
     * date
     * timestamp
     */
    inputType: string,
    /**
     * use for applying custom styles on the component
     */
    classes?: string
};

const getType = (inputType: string): string => {

    if (inputType.indexOf('int') > -1) return 'int';

    if (inputType.indexOf('float') > -1) return 'float';

    if (inputType.indexOf('date') > -1) return 'date';

    if (inputType.indexOf('timestamp') > -1) return 'timestamp';

    return 'Invalid_Type';
}

const RangeInputHOC = ({ inputType, classes }: RangeInputHOCProps) => {
    const momentJS = windowRef.moment;

    const fromRef = useRef<HTMLInputElement>(null);

    const toRef = useRef<HTMLInputElement>(null);

    const fromTimeRef = useRef<HTMLInputElement>(null);

    const toTimeRef = useRef<HTMLInputElement>(null);

    const type = getType(inputType);

    const [error, setError] = useState<string | null>(null);

    const [disableSubmit, setDisableSubmit] = useState<boolean>(type === 'int' || type === 'float');

    const disableSubmitBtn = () => {
        if (!disableSubmit) setDisableSubmit(true);
    }

    const enableSubmitBtn = () => {
        if (disableSubmit) setDisableSubmit(false);
    }

    const formatTimeValues = () => {
        const fromDateVal = fromRef?.current?.value;
        let fromTimeVal = fromTimeRef?.current?.value;

        if (fromDateVal && !fromTimeVal) fromTimeVal = '00:00';

        const toDateVal = toRef?.current?.value;
        let toTimeVal = toTimeRef?.current?.value;

        if (toDateVal && !toTimeVal) toTimeVal = '00:00';

        return {
            fromVal: fromDateVal || fromTimeVal ? `${fromDateVal}T${fromTimeVal}` : '',
            toVal: toDateVal || toTimeVal ? `${toDateVal}T${toTimeVal}` : '',
        };
    }

    /**checks if both inputs are empty and disables the submit button */
    const handleChange = (value: string) => {
        const formatedValues = type === 'timestamp' ? formatTimeValues()
            : { fromVal: fromRef?.current?.value || '', toVal: toRef?.current?.value || '' };

        console.log(formatedValues);

        if (!formatedValues.fromVal && !formatedValues.toVal) disableSubmitBtn();
        else enableSubmitBtn();

        const validatedResult = validateValue(value);

        if (!validatedResult) setError(errorMsgMap[type]);

        if (validatedResult && !error) setError(null);
    }

    const validateValue = (value: string): boolean => {
        if (!value) return true;

        if (type === 'int') return INTEGER_REGEXP.test(value);

        if (type === 'float') return FLOAT_REGEXP.test(value);

        /**type is either date or timestamp */
        const formatString = type === 'date' ? DATE_FORMAT : TIME_FORMAT;
        const date = momentJS(value, formatString, true);
        return date.isValid();
    }

    const rangeCheck = (fromVal: string, toVal: string): boolean => {
        if (type === 'int') return parseInt(fromVal) < parseInt(toVal);

        if (type === 'float') return parseInt(fromVal) < parseInt(toVal);

        /**type is either date or timestamp */
        const formatString = type === 'date' ? DATE_FORMAT : TIME_FORMAT;
        const fromDate = momentJS(fromVal, formatString, true);
        const toDate = momentJS(toVal, formatString, true);
        return toDate.diff(fromDate) > 0
    }


    const validateValues = (fromVal: string, toVal: string): string => {
        const isfromValid = validateValue(fromVal);

        const isToValid = validateValue(toVal);

        if (!isfromValid || !isToValid) return type;

        /**if only one field is non null then don't perform range check */
        if (!fromVal || !toVal) return 'valid';

        /**both from and to values are now valid so perform range validations */
        return rangeCheck(fromVal, toVal) ? 'valid' : 'range';
    }

    const handleSubmit = () => {
        const formatedValues = type === 'timestamp' ? formatTimeValues()
            : { fromVal: fromRef?.current?.value || '', toVal: toRef?.current?.value || '' };

        const validatedResult = validateValues(formatedValues.fromVal, formatedValues.toVal);

        console.log('validation result: ', validatedResult);

        if (validatedResult === 'valid') {
            /* clear out any previous errors when a new submission is validated */
            setError(null);

            /* eslint-disable  @typescript-eslint/no-non-null-assertion */
            console.log('values sent to server', formatedValues);
            /* eslint-enable  @typescript-eslint/no-non-null-assertion */
        } else {
            setError(errorMsgMap[validatedResult]);
        }
    };

    const classTypeName = (type === 'int' || type === 'float') ? 'numeric-width' : type === 'date' ? 'date-width' : 'time-width';

    return (
        <div className={classes}>
            <div className='range-input-container'>
                <div className={`range-input ${classTypeName}`}>
                    <label htmlFor={`range-from-val-${type}`}>From:</label>
                    <RangeInput id={`range-from-val-${type}`} reference={fromRef} timeRef={fromTimeRef} type={type} value='2015-06-01'
                        handleChange={handleChange} />
                </div>

                <div className={`range-input ${classTypeName}`}>
                    <label htmlFor={`range-to-val-${type}`}>To:</label>
                    <RangeInput id={`range-to-val-${type}`} reference={toRef} timeRef={toTimeRef} type={type} value='2018-08-29'
                        handleChange={handleChange} />
                </div>

                <button className='chaise-btn chaise-btn-primary range-input-submit-btn' disabled={disableSubmit} onClick={handleSubmit}>
                    <span className='chaise-btn-icon fa-solid fa-check' />
                </button>
            </div>
            {
                error && <span className='range-input-error'>{error}</span>
            }
        </div>
    );
};

export default RangeInputHOC;