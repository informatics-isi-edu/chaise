import { useState, useRef } from 'react';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { ClearInputBtn } from '@isrd-isi-edu/chaise/src/components/clear-input-btn';


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


const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const DATE_FORMAT = 'HH:mm:ss';

const errorMsgMap: {
    [key: number]: string;
} = {
    0: 'Please enter both From and To values',
    1: 'From value cannot be greater than the To value',
    2: 'Please enter an integer value',
    3: 'Please enter a decimal value',
    4: 'Please enter a date value in YYYY-MM-DD format',
    5: 'Please enter a time value in 24-hr HH:MM:SS format'
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

    const clearVal = () => {
        const element = document.querySelector(`#${id}`) as HTMLInputElement;
        if (element?.value) {
            element.value = '';
        }
    }

    return (
        <div className='range-input'>
            {
                type in [0, 1] ? <input id={id} type='number' placeholder={placeholder} className={classes} ref={reference} />
                    : type === 2 ? <input id={id} type='date' className={classes} ref={reference}
                        defaultValue={value} required pattern='\d{4}-\d{2}-\d{2}' min='1970-01-01' max='2999-12-31' />
                        : <input id={id} type='datetime-local' className={classes} ref={reference} required
                            min='1970-01-01T00:00:00' max='2999-12-31T11:59:59' />

            }
            <ClearInputBtn
                btnClassName='range-remove-btn'
                clickCallback={clearVal}
                show
            />
        </div>
    )
}
    ;


type RangeInputHOCProps = {
    type: number
};

const RangeInputHOC = ({ type }: RangeInputHOCProps) => {
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
            const fromDate = momentJS(fromVal);
            const toDate = momentJS(toVal);

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
            /* eslint-disable  @typescript-eslint/no-non-null-assertion */
            let fromVal = fromRef.current!.value;
            let toVal = fromRef.current!.value;
            /* eslint-enable  @typescript-eslint/no-non-null-assertion */


            if (type in [2, 3]) {
                fromVal = momentJS(fromVal).format(type === 2 ? DATE_FORMAT : TIME_FORMAT);
                toVal = momentJS(toVal).format(type === 2 ? DATE_FORMAT : TIME_FORMAT);
            }

            console.log('values sent to server', { fromVal, toVal });
        } else {
            setError(errorMsgMap[validatedResult]);
        }
    };

    return (
        <>
            <div className='range-input-container'>
                <div className='range-input-from'>
                    <label htmlFor='from-val'>From:</label>
                    <RangeInput id='from-val' placeholder='from' reference={fromRef} type={type} value='2015-06-01' />
                </div>

                <div className='range-input-to'>
                    <label htmlFor='to-val'>To:</label>
                    <RangeInput id='to-val' placeholder='to' reference={toRef} type={type} value='2018-08-29' />
                </div>

                <button className='chaise-btn chaise-btn-primary' onClick={handleSubmit}>
                    <span className='chaise-btn-icon fa-solid fa-check' />
                </button>
            </div>
            {
                error && <span className='range-input-error'>{error}</span>
            }
        </>
    );
};

export default RangeInputHOC;