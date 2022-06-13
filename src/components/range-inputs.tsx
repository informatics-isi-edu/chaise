import '@isrd-isi-edu/chaise/src/assets/scss/_range-input.scss';
import { useState, useRef } from 'react';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
// import { ClearInputBtn } from '@isrd-isi-edu/chaise/src/components/clear-input-btn';


/* 
type: 
0 - int
1 - float
2 - date
3 - timestamp
*/

/*
Todo:
Will this component be used in other places - if yes then move the css of out _faceting.css
*/

const INTEGER_REGEXP = /^\-?\d+$/;

const FLOAT_REGEXP = /^\-?(\d+)?((\.)?\d+)?$/;

const TIME_FORMAT = 'YYYY-MM-DDTHH:mm';

const DATE_FORMAT = 'YYYY-MM-DD';

const errorMsgMap: {
    [key: number]: string;
} = {
    0: 'Please enter both From and To values',
    1: 'From value cannot be greater than the To value',
    2: 'Please enter an integer value',
    3: 'Please enter a decimal value',
    4: 'Please enter a date value in YYYY-MM-DD format',
    5: 'Please enter a time value in 24-hr YYYY-MM-DDTHH:MM format'
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
        <div className='range-input-field chaise-input-control has-feedback'>
            {
                type in [0, 1] ? <input id={id} type='number' placeholder={placeholder} className={classes} ref={reference} />
                    : type === 2 ? <input id={id} type='date' className={classes} ref={reference} step='1'
                        defaultValue={value} required pattern='\d{4}-\d{2}-\d{2}' min='1970-01-01' max='2999-12-31' />
                        : <input id={id} type='datetime-local' placeholder='YYYY-MM-DDTHH:MM' className={classes} ref={reference}
                            min='1970-01-01T00:00' max='2999-12-31T11:59' required />

            }
            <span className='fa-solid fa-x range-input-clear' onClick={clearInput} />
            {/* <ClearInputBtn
                btnClassName='chaise-input-control-feedback'
                clickCallback={clearVal}
                show
            /> */}
        </div>
    )
}
    ;


type RangeInputHOCProps = {
    type: number,
    classes?: string
};

const RangeInputHOC = ({ type, classes }: RangeInputHOCProps) => {
    const momentJS = windowRef.moment;
    const fromRef = useRef<HTMLInputElement>(null);
    const toRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | null>(null);

    const validateValues = (fromVal: string, toVal: string): number => {
        console.log('validating values...');

        /* this error is assigned based on the error codes defined above in the errorMsgMap */
        // let error = -1;

        if (!fromVal || !toVal) {
            // error = 0;
            return 0;
        }

        if (type === 0) {
            if (!INTEGER_REGEXP.test(fromVal) || !INTEGER_REGEXP.test(toVal)) {
                // error = 2;
                return 2;
            }

            if (parseInt(fromVal) > parseInt(toVal)) {
                // error = 1;
                return 1;
            }
        }

        if (type === 1) {
            if (!FLOAT_REGEXP.test(fromVal) || !FLOAT_REGEXP.test(toVal)) {
                // error = 3;
                return 3;
            }

            if (parseInt(fromVal) > parseInt(toVal)) {
                // error = 1;
                return 1;
            }
        }

        if (type === 2 || type === 3) {

            const formatString = type === 2 ? DATE_FORMAT : TIME_FORMAT;

            const fromDate = momentJS(fromVal, formatString, true);
            const toDate = momentJS(toVal, formatString, true);

            if (!fromDate.isValid() || !toDate.isValid()) {
                // error = type === 2 ? 4 : 5;
                return type === 2 ? 4 : 5;
            }

            if (fromDate.diff(toDate) >= 0) {
                // error = 1;
                return 1;
            }
        }

        return -1;
    }


    const handleSubmit = () => {
        console.log('submitted values', { fromRef: fromRef?.current?.value, toRef: toRef?.current?.value });

        const validatedResult = validateValues(fromRef?.current?.value || '', toRef?.current?.value || '');

        console.log('validation result:', validatedResult);

        if (validatedResult === -1) {
            // clear out any previous errors when a new submission is validated
            setError(null);

            // no longer needed sine we throw an error in case format is not as expected when checking with moment.isValid

            // if (type in [2, 3]) {
            //     fromVal = momentJS(fromVal).format(type === 2 ? DATE_FORMAT : TIME_FORMAT);
            //     toVal = momentJS(toVal).format(type === 2 ? DATE_FORMAT : TIME_FORMAT);
            // }

            /* eslint-disable  @typescript-eslint/no-non-null-assertion */
            console.log('values sent to server', { fromVal: fromRef.current!.value, toVal: toRef.current!.value });
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
                    <RangeInput id='range-from-val' placeholder='from' reference={fromRef} type={type} value='2015-06-01' />
                </div>

                <div className={`range-input ${classTypeName}`}>
                    <label htmlFor='range-to-val'>To:</label>
                    <RangeInput id='range-to-val' placeholder='to' reference={toRef} type={type} value='2018-08-29' />
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