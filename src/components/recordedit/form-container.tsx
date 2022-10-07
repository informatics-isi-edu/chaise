
import { useEffect, useState, useRef } from 'react';


const BlackBox = ({ idx }) => (
    <div className='black-box'>
        {`sample form container ${idx}`}
    </div>
)



const FormContainer = () => {
    const [forms, setForms] = useState([1]);

    const addForm = () => {
        setForms(forms => [...forms, forms.length+1]);
    };


    const removeForm = (idx) => {
        // write logic to remove form here
    }

    console.log({forms});

    useEffect(() => {
        const formContainer = document.querySelector('.form-container') as HTMLElement;

        formContainer.addEventListener('add-form', addForm);

        return ()=> {
            formContainer.removeEventListener('add-form', addForm);
        }
    }, []);



    // need a unique key for each generated form to keep track of it in the array
    const elements = forms.map(f => <BlackBox idx={f} key={f}/>)


    return(
        <div className='form-container'>
            {elements}
        </div>
    );

}

export default FormContainer;