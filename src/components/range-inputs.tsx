import '@isrd-isi-edu/chaise/src/assets/scss/_range-input.scss';
import { useState, useRef } from 'react';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

const INTEGER_REGEXP = /^\-?\d+$/;

const FLOAT_REGEXP = /^\-?(\d+)?((\.)?\d+)?$/;

const TIME_FORMAT = 'YYYY-MM-DDTHH:mm';

const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * an object for mapping the error codes to the error messages
 */
const errorMsgMap: {
    [key: number]: string;
} = {
    0: 'Please enter both From and To values',
    1: 'From value cannot be greater than the To value',
    2: 'Please enter an integer value',
    3: 'Please enter a decimal value',
    4: 'Please enter a date value in YYYY-MM-DD format',
    5: 'Please enter a time value in YYYY-MM-DD HH:MM format'
};

type DateTimePickerProps = {
    classes?: string,
    id: string,
    value: string
};

const DateTimePicker = ({ classes, id, value }: DateTimePickerProps): JSX.Element => {

    const clearInput = (event: React.SyntheticEvent) => {
        const elementId = (event.target as HTMLInputElement)?.dataset.id;
        const element = document.querySelector(`#${elementId}`) as HTMLInputElement;

        event.preventDefault();

        if (element?.value) {
            element.value = '';
        }

        return;
    }

    return (
        <div className='range-input-datetime'>
            <div className='range-input-field'>
                <input id={`${id}-date`} className={classes} type='date'
                    placeholder='YYYY-MM-DD' min='1970-01-01' max='2999-12-31' step='1' defaultValue={value} required />
                <span className='fa-solid fa-x range-input-clear' data-id={`${id}-date`} onClick={clearInput} />
            </div>
            <div className='range-input-field'>
                <input id={`${id}-time`} className={classes} type='time'
                    placeholder='HH:MM' min='00:00' max='23:59' defaultValue='00:00' required />
                <span className='fa-solid fa-x range-input-clear' data-id={`${id}-time`} onClick={clearInput} />
            </div>
        </div>
    );
};


type RangeInputProps = {
    placeholder?: string,
    classes?: string,
    reference: React.RefObject<HTMLInputElement>,
    type: number,
    id: string,
    value: string
};

const RangeInput = ({ placeholder = 'Enter', classes = '', reference, type, value, id }: RangeInputProps): JSX.Element => {

    const clearInput = () => {
        const element = document.querySelector(`#${id}`) as HTMLInputElement;
        if (element?.value) {
            element.value = '';
        }
    }

    return (
        type === 3 ? (
            <DateTimePicker classes={classes} id={id} value={value} />
        ) : (
            <div className='range-input-field'>
                {
                    type in [0, 1] ? <input id={id} type='number' placeholder={placeholder} className={classes} ref={reference} />
                        : <input id={id} type='date' className={classes} ref={reference} step='1'
                            defaultValue={value} required pattern='\d{4}-\d{2}-\d{2}' min='1970-01-01' max='2999-12-31' />
                }
                <span className='fa-solid fa-x range-input-clear' onClick={clearInput} />
            </div>
        )

    )
};


type RangeInputHOCProps = {
    /**
     * an enum for the type of input expected
     * 0 - int
     * 1 - float
     * 2 - date
     * 3 - timestamp
     */
    type: number,
    /**
     * use for applying custom styles on the component
     */
    classes?: string
};

const RangeInputHOC = ({ type, classes }: RangeInputHOCProps) => {
    const momentJS = windowRef.moment;
    const fromRef = useRef<HTMLInputElement>(null);
    const toRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | null>(null);

    const validateValues = (fromVal: string, toVal: string): number => {
        if (!fromVal || !toVal) {
            return 0;
        }

        if (type === 0) {
            if (!INTEGER_REGEXP.test(fromVal) || !INTEGER_REGEXP.test(toVal)) {
                return 2;
            }

            if (parseInt(fromVal) > parseInt(toVal)) {
                return 1;
            }
        }

        if (type === 1) {
            if (!FLOAT_REGEXP.test(fromVal) || !FLOAT_REGEXP.test(toVal)) {
                return 3;
            }

            if (parseInt(fromVal) > parseInt(toVal)) {
                return 1;
            }
        }

        if (type === 2 || type === 3) {
            const formatString = type === 2 ? DATE_FORMAT : TIME_FORMAT;
            const fromDate = momentJS(fromVal, formatString, true);
            const toDate = momentJS(toVal, formatString, true);

            if (!fromDate.isValid() || !toDate.isValid()) {
                return type === 2 ? 4 : 5;
            }

            if (fromDate.diff(toDate) >= 0) {
                return 1;
            }
        }

        return -1;
    }

    const formatTimeValues = () => {
        const fromDateVal = (document.querySelector('#range-from-val-date') as HTMLInputElement)?.value;
        const fromTimeVal = (document.querySelector('#range-from-val-time') as HTMLInputElement)?.value || '00:00';

        const toDateVal = (document.querySelector('#range-to-val-date') as HTMLInputElement)?.value;
        const toTimeVal = (document.querySelector('#range-to-val-time') as HTMLInputElement)?.value || '00:00';

        return { fromVal: `${fromDateVal}T${fromTimeVal}`, toVal: `${toDateVal}T${toTimeVal}` }
    }




    const handleSubmit = () => {
        const formatedValues = type === 3 ? formatTimeValues() : { fromVal: fromRef?.current?.value || '', toVal: toRef?.current?.value || '' };

        console.log('submitted values', formatedValues);

        const validatedResult = validateValues(formatedValues.fromVal, formatedValues.toVal);

        console.log('validation result:', validatedResult);

        if (validatedResult === -1) {
            /* clear out any previous errors when a new submission is validated */
            setError(null);

            /* eslint-disable  @typescript-eslint/no-non-null-assertion */
            console.log('values sent to server', formatedValues);
            /* eslint-enable  @typescript-eslint/no-non-null-assertion */
        } else {
            setError(errorMsgMap[validatedResult]);
        }
    };

    const classTypeName = type in [0, 1] ? 'numeric-width' : type === 2 ? 'date-width' : 'time-width'

    return (
        <div className={classes}>
            <div className='range-input-container'>
                <div className={`range-input ${classTypeName}`}>
                    <label htmlFor='range-from-val'>From:</label>
                    <RangeInput id='range-from-val' reference={fromRef} type={type} value='2015-06-01'
                        classes='chaise-input-control has-feedback' />
                </div>

                <div className={`range-input ${classTypeName}`}>
                    <label htmlFor='range-to-val'>To:</label>
                    <RangeInput id='range-to-val' reference={toRef} type={type} value='2018-08-29'
                        classes='chaise-input-control has-feedback' />
                </div>

                <button className='chaise-btn chaise-btn-primary range-input-submit-btn' onClick={handleSubmit}>
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