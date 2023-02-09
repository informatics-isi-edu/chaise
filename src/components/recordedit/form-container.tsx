// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { getDisabledInputValue, getInputTypeOrDisabled } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { Prev } from 'react-bootstrap/esm/PageItem';

const FormContainer = (): JSX.Element => {

  const {
    onSubmitValid, onSubmitInvalid, forms, removeForm, columnModels, appMode, tuples
  } = useRecordedit();

  const { handleSubmit } = useFormContext();
  return (
    <div className='form-container'>
      <form id='recordedit-form' className='recordedit-form' onSubmit={handleSubmit(onSubmitValid, onSubmitInvalid)}>
        {/* form header */}
        <div className='form-header-row'>
          {forms.map((formNumber: number, formIndex: number) => (
            <div key={`form-header-${formNumber}`} className='form-header entity-value'>
              <span>{formIndex + 1}</span>
              <div className='form-header-buttons-container'>
                {appMode === appModes.EDIT && tuples && !tuples[formIndex].canUpdate &&
                  <ChaiseTooltip placement='bottom' tooltip='This record cannot be modified.'>
                    <i className='disabled-row-icon fas fa-ban'></i>
                  </ChaiseTooltip>
                }
                {forms.length > 1 &&
                  <ChaiseTooltip
                    placement='bottom'
                    tooltip='Click to remove this record from the form.'
                  >
                    <button className='chaise-btn chaise-btn-secondary pull-right remove-form-btn' onClick={() => removeForm([formIndex])}>
                      <i className='fa-solid fa-xmark' />
                    </button>
                  </ChaiseTooltip>
                }
              </div>
            </div>
          ))}
        </div>
        {/* inputs for each column */}
        {columnModels.map(({ }, idx) => (
          <FormRow key={`form-row-${idx}`} columnModelIndex={idx} />
        ))}
      </form>
    </div>
  )
};

type FormRowProps = {
  columnModelIndex: number
};

/**
 * each row in the form
 * to make the height logic simpler, I decided to extract the rows as separate
 * components instead of having it in the FormContainer.
 *
 */
const FormRow = ({ columnModelIndex }: FormRowProps): JSX.Element => {

  const {
    forms, appMode, reference, columnModels, tuples,
    canUpdateValues, columnPermissionErrors, foreignKeyData, waitingForForeignKeyData,
  } = useRecordedit();

  /**
   * which columns should show the permission error.
   * if a user cannot edit a column in one of the rows, we cannot allow them
   * to edit that column in other rows.
   */
  const [showPermissionError, setShowPermissionError] = useState<{[key: string]: boolean}>({});

  /**
   * reset the state of showing permission errors whenever the errors changed
   */
  useEffect(() => {
    setShowPermissionError({});
  }, [columnPermissionErrors]);

  const container = useRef<HTMLDivElement>(null);

  /**
   * make sure the column names (key-column.tsx) have the same height as FormRow
   */
  useLayoutEffect(() => {
    if (!container || !container.current) return;

    let cachedHeight = -1;
    const sensor = new ResizeSensor(container.current as Element, (dimension) => {
      if (container.current?.offsetHeight === cachedHeight || !container.current) return;
      cachedHeight = container.current?.offsetHeight;
      const header = document.querySelector<HTMLElement>(`.entity-key.entity-key-${columnModelIndex}`);
      if (header) {
        header.style.height = `${cachedHeight}px`;
      }
    });

    return () => {
      sensor.detach();
    }
  }, []);

  /**
   * show the error to users after they clicked on the cell.
   */
  const onPermissionClick = (formIndex: number) => {
    setShowPermissionError((prev) => {
      const res = {...prev};
      res[formIndex] = true;
      return res;
    });
  };

  const renderInput = (formNumber: number, formIndex: number) => {
    const cm = columnModels[columnModelIndex];

    const colName = cm.column.name;

    const inputType = getInputTypeOrDisabled(formNumber, cm, canUpdateValues);
    let placeholder = '';
    let permissionError = '';
    if (inputType === 'disabled') {
      placeholder = getDisabledInputValue(cm.column);

      // TODO: extend this for edit mode
      // if value is empty string and we are in edit mode, use the previous value
      // if (placeholder == '' && context.mode == context.modes.EDIT) {
      //   placeholder = value;
      // }
    }
    // set the error if we're supposed to show it
    else if (appMode === appModes.EDIT && isObjectAndKeyDefined(columnPermissionErrors, colName)) {
      permissionError = columnPermissionErrors[colName];
    }

    return (<>
      {permissionError && <div className='column-permission-overlay' onClick={() => onPermissionClick(formIndex)} />}
      <InputSwitch
        key={colName}
        displayErrors={true}
        name={`${formNumber}-${colName}`}
        type={inputType}
        classes='column-cell-input'
        placeholder={placeholder}
        // styles={{ 'height': heightparam }}
        columnModel={cm}
        appMode={appMode}
        formNumber={formNumber}
        parentReference={reference}
        parentTuple={appMode === appModes.EDIT ? tuples[formIndex] : undefined}
        foreignKeyData={foreignKeyData}
        waitingForForeignKeyData={waitingForForeignKeyData}
      />
      {formIndex in showPermissionError &&
        <div className='column-permission-warning'>{permissionError}</div>
      }
    </>)
  }

  return (
    <div className='form-inputs-row' ref={container}>
      {forms.map((formNumber: number, formIndex: number) => (
        <div key={`form-${formNumber}-input-${columnModelIndex}`} className='entity-value'>
          {renderInput(formNumber, formIndex)}
        </div>
      ))}
    </div>
  )

};

export default FormContainer;
