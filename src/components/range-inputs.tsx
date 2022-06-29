import '@isrd-isi-edu/chaise/src/assets/scss/_range-input.scss';
import { useState, useRef } from 'react';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch';

const INTEGER_REGEXP = /^\-?\d+$/;

const FLOAT_REGEXP = /^\-?(\d+)?((\.)?\d+)?$/;

const TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH:mm';

const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * an object for mapping the error types to error messages
 */
const errorMsgMap: {
    [key: string]: string;
} = {
    'empty': 'Please enter either From or To value',
    'range': 'From value cannot be greater than the To value',
    'int': 'Please enter an integer value',
    'float': 'Please enter a decimal value',
    'date': 'Please enter a date value',
    'timestamp': 'Please enter a valid date and time value'
};

type RangeInputProps = {
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

const RangeInput = ({ inputType, classes }: RangeInputProps) => {
    const momentJS = windowRef.moment;

    const fromRef = useRef<HTMLInputElement>(null);

    const toRef = useRef<HTMLInputElement>(null);

    const fromTimeRef = useRef<HTMLInputElement>(null);

    const toTimeRef = useRef<HTMLInputElement>(null);

    const type = getType(inputType);

    const [error, setError] = useState<string | null>(null);

    const [disableSubmit, setDisableSubmit] = useState<boolean>(type === 'int' || type === 'float');

    const toggleSubmitBtn = (value: boolean) => {
        if (disableSubmit !== value) setDisableSubmit(value);
    };

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

    /**
     * checks if both inputs are empty and disables the submit button 
     * validates both fields and shows/hides validation errors
    */
    const handleChange = () => {
        const formatedValues = type === 'timestamp' ? formatTimeValues()
            : { fromVal: fromRef?.current?.value || '', toVal: toRef?.current?.value || '' };

        console.log(formatedValues);

        const validatedResult = validateValue(formatedValues.fromVal) && validateValue(formatedValues.toVal);

        const areBothFieldsEmpty = !formatedValues.fromVal && !formatedValues.toVal;

        toggleSubmitBtn(areBothFieldsEmpty || !validatedResult);

        if (!validatedResult) setError(errorMsgMap[type])
        else setError(null);
    }

    /**
     * performs input format validation based on input type
    */
    const validateValue = (value: string): boolean => {
        if (!value) return true;

        if (type === 'int') return INTEGER_REGEXP.test(value);

        if (type === 'float') return FLOAT_REGEXP.test(value);

        /**in case type is timestamp and both date n time values are null */
        if (type === 'timestamp' && !value) return true;

        /**type is either date or timestamp */
        const formatString = type === 'date' ? DATE_FORMAT : TIMESTAMP_FORMAT;
        const date = momentJS(value, formatString, true);
        return date.isValid();
    }

    /**
     * performs basic range validation : from_value > to_value
    */
    const rangeCheck = (fromVal: string, toVal: string): boolean => {
        if (type === 'int') return parseInt(fromVal) < parseInt(toVal);

        if (type === 'float') return parseInt(fromVal) < parseInt(toVal);

        /**type is either date or timestamp */
        const formatString = type === 'date' ? DATE_FORMAT : TIMESTAMP_FORMAT;
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
                    <InputSwitch id={`range-from-val-${type}`} reference={fromRef} timeRef={fromTimeRef} type={type} value='2015-06-01'
                        handleChange={handleChange} />
                </div>

                <div className={`range-input ${classTypeName}`}>
                    <label htmlFor={`range-to-val-${type}`}>To:</label>
                    <InputSwitch id={`range-to-val-${type}`} reference={toRef} timeRef={toTimeRef} type={type} value='2018-08-29'
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

export default RangeInput;