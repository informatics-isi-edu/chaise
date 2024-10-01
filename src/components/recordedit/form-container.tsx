// components
import FormRow from '@isrd-isi-edu/chaise/src/components/recordedit/form-row';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';
import { useLayoutEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

// models
import { RecordeditDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { addTopHorizontalScroll } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

type FormContainerProps = {
  /* the index of column that is showing the select all input */
  activeMultiForm: number;
  /* change the active select all */
  toggleActiveMultiForm: (colIndex: number) => void;
}

const FormContainer = ({
  activeMultiForm,
  toggleActiveMultiForm
}: FormContainerProps): JSX.Element => {

  const {
    columnModels, config, forms, onSubmitValid, onSubmitInvalid, removeForm
  } = useRecordedit();

  const { handleSubmit } = useFormContext();

  const formContainer = useRef<any>(null);

  // This state variable is to set the form index on click of remove btton
  const [removeFormIndex, setRemoveFormIndex] = useState<number>(0);

  // This state variable is to set the boolean to know if the remove is clicked or not
  const [removeClicked, setRemoveClicked] = useState<boolean>(false);

  /**
   * does the following:
   * 1. add the top horizontal scroll if needed
   * 2. set a max-width to multi-form-input-row as the width of the visible area
   */
  useLayoutEffect(() => {
    if (!formContainer.current) return;

    const sensors = addTopHorizontalScroll(
      formContainer.current,
      /**
       * we want to show the scrollbar outside of the container
       */
      true,
      /**
       * this will make sure we're also changing the state of
       * scrollbar when the users add or remove forms.
       * NOTE: it's a bit hacky as we're looking at the children
       *       of the component. But given that it's useLayoutEffect it should be fine.
       */
      document.querySelector('.form-inputs-row') as HTMLElement
    );

    return () => {
      sensors?.forEach((sensor) => sensor.detach());
    };
  }, []);

  /**
   * This callback is called when we want to delete the form, we are setting the form index and
   * a boolean to know the remove button is clicked
   *
   * TODO this can be improved. we might be able to do this with less state variables
  */
  const handleRemoveForm = (formIndex: number, formNumber: number) => {
    setRemoveFormIndex(formNumber);
    setRemoveClicked(true);

    removeForm([formIndex]);
  };

  return (
    <div className='form-container' ref={formContainer}>
      <div className='chaise-table-top-scroll-wrapper'>
        <div className='chaise-table-top-scroll'></div>
      </div>
      <form
        id='recordedit-form'
        className='recordedit-form chaise-hr-scrollable'
        onSubmit={handleSubmit(onSubmitValid, onSubmitInvalid)}
        // onSubmit={
        //   (e: any) => {
        //     e.preventDefault();
        //     // make sure to pass event along too or react-hook-form will silently fail
        //     // NOTE: event is still triggering even with prevent default
        //     handleSubmit(onSubmitValid, onSubmitInvalid)(e);
        //   }
        // }
        ref={formContainer}
      >
        {/* form header */}

        {config.displayMode !== RecordeditDisplayMode.POPUP && <div className='form-header-row'>
          {forms.map((formNumber: number, formIndex: number) => (
            <div
              key={`form-header-${formNumber}`}
              className='form-header entity-value'
            >
              <span>{formIndex + 1}</span>
              <div className='form-header-buttons-container'>
                {forms.length > 1 && (
                  <ChaiseTooltip
                    placement='bottom'
                    tooltip='Click to remove this record from the form.'
                  >
                    <button
                      className='chaise-btn chaise-btn-secondary pull-right remove-form-btn'
                      onClick={() => handleRemoveForm(formIndex, formNumber)}
                    >
                      <i className='fa-solid fa-xmark' />
                    </button>
                  </ChaiseTooltip>
                )}
              </div>
            </div>
          ))}
        </div>}
        {/* inputs for each column */}
        {columnModels.map(({ }, idx) => (
          <FormRow
            isActiveForm={activeMultiForm === idx}
            removeClicked={removeClicked}
            setRemoveClicked={setRemoveClicked}
            removeFormIndex={removeFormIndex}
            key={`form-row-${idx}`}
            columnModelIndex={idx}
            toggleActiveMultiForm={toggleActiveMultiForm}
          />
        ))}
      </form>
    </div>
  );
};

export default FormContainer;
