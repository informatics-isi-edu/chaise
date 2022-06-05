import { useState, useRef } from 'react';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';



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

const errorMsgMap = {
    0: 'Please enter both From and To values',
    1: 'From value cannot be greater than the To value',
    2: 'Please enter an integer value',
    3: 'Please enter a decimal value',
    4: 'Please enter a date value in YYYY-MM-DD format',
    5: 'Please enter a time value in 24-hr HH:MM:SS format'
}

type RangeInputProps = {
    placeholder?: string,
    classes?: string,
    reference: React.RefObject<HTMLInputElement>,
    type: number,
    value: string
};

const RangeInput = ({ placeholder = 'Enter', classes = '', reference, type, value }: RangeInputProps): JSX.Element => {

    return type in [0, 1] ? <input type='number' placeholder={placeholder} className={classes} ref={reference} />
        : type === 2 ? <input type='date' className={classes} ref={reference}
            defaultValue={value} required pattern='\d{4}-\d{2}-\d{2}' />
            : <input type='datetime-local' className={classes} ref={reference} required />;

};

type RangeInputHOCProps = {
    type: number
};

const RangeInputHOC = ({ type }: RangeInputHOCProps) => {

    const fromRef = useRef<HTMLInputElement>(null);
    const toRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | null>(null);


    const validateValues = (fromVal: string, toVal: string): number => {
        console.log('validating values...');

        let error = 0;

        /* 
        Error Map:

        */

        if (type === 0) {
            if (!INTEGER_REGEXP.test(fromVal) || !INTEGER_REGEXP.test(toVal)) {
                error = 2;
                return error;
            }

            if (parseInt(fromVal) > parseInt(toVal)) {
                error = 1;
                return error;
            }
        }

        if (type === 1) {
            if (!FLOAT_REGEXP.test(fromVal) || !FLOAT_REGEXP.test(toVal)) {
                error = 3;
                return error;
            }

            if (parseInt(fromVal) > parseInt(toVal)) {
                error = 1;
                return error;
            }
        }

        if (type === 2 || type === 3) {
            const momentJS = windowRef.moment;

            const fromDate = momentJS(fromVal);
            const toDate = momentJS(fromVal);

            if (!fromDate.isValid() || !toDate.isValid()) {
                error = type === 2 ? 4 : 5;
                return error;
            }

            if (fromDate.diff(toDate) >= 0) {
                error = 1;
                return error;
            }
        }

        return error;


        // write logic to validate from and to values based on type prop

        // if validation falis -> setError accordingly

        // if validation passes -> call handleSubmit with the validated values

        // handleSubmit();
    }


    const handleSubmit = () => {
        console.log('submit clicked', fromRef, toRef);
        if (!fromRef?.current || !toRef?.current) {
            setError(errorMsgMap[0]);
        }

        if (fromRef?.current && toRef?.current) {
            console.log('submitted values', fromRef.current.value, toRef.current.value);

            const validatedResult = validateValues(fromRef.current.value, toRef.current.value);
            console.log('validatedResult:', validatedResult);
            if (validatedResult === 0) {
                console.log('values validated: ', fromRef.current.value, toRef.current.value);
            } else {
                setError(errorMsgMap[validatedResult]);
            }
        }

    };

    return (
        <div className='range-input-container'>
            <div className='range-input'>
                <RangeInput placeholder='from' reference={fromRef} classes='range-input-from' type={type} value='2015-06-01' />
                <RangeInput placeholder='to' reference={toRef} classes='range-input-to' type={type} value='2018-08-29' />
                <button className='chaise-btn chaise-btn-primary icon-btn' onClick={handleSubmit}>
                    <span className='chaise-btn-icon glyphicon glyphicon-ok'>
                        ✓
                    </span>
                </button>
            </div>
            {
                error && <span className='range-input-error'>{error}</span>
            }
        </div>
    );
};



export default RangeInputHOC;