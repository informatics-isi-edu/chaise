import { useState, useRef } from 'react';


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


const isInt = (value) => value.indexOf('.') === -1;

type RangeInputProps = {
    placeholder?: string,
    classes?: string,
    reference: React.RefObject<HTMLInputElement>,
    type: number
};

const RangeInput = ({ placeholder = 'Enter', classes = '', reference, type }: RangeInputProps) => {

    return type === 0 ? <input type='number' placeholder={placeholder} className={classes} ref={reference} />
        : type === 1 ? <input type='number' placeholder={placeholder} className={classes} ref={reference} />
            : <input type='text' placeholder={placeholder} className={classes} ref={reference} />;

};

type RangeInputHOCProps = {
    type: number
};

const RangeInputHOC = ({ type }: RangeInputHOCProps) => {

    const fromRef = useRef<HTMLInputElement>(null);
    const toRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState(null);


    const validateValues = () => {
        console.log('validating values...');
        // write logic to validate from and to values based on type prop

        // if validation falis -> setError accordingly

        // if validation passes -> call handleSubmit with the validated values

        handleSubmit();
    }


    const handleSubmit = () => {
        console.log('submit clicked', fromRef, toRef);
        if (fromRef?.current && toRef?.current) {
            console.log('submitted values', fromRef.current.value, toRef.current.value);
        }

    };

    return (
        <div className='range-input-container'>
            <div className='range-input'>
                <RangeInput placeholder='from' reference={fromRef} classes='range-input-from' type={type} />
                <RangeInput placeholder='to' reference={toRef} classes='range-input-to' type={type} />
                <button className='chaise-btn chaise-btn-primary icon-btn' onClick={validateValues}>
                    <span className='chaise-btn-icon glyphicon glyphicon-ok'>
                        ✓
                    </span>
                </button>
            </div>
            {
                error && <span className='range-inputs-error'>{error}</span>
            }
        </div>
    );
};



export default RangeInputHOC;