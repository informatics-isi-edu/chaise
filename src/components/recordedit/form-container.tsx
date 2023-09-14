// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, RecordeditDisplayMode, SELECT_ALL_INPUT_FORM_VALUE } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// utils
import { getDisabledInputValue } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { copyOrClearValue } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { addTopHorizontalScroll } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

const FormContainer = (): JSX.Element => {

  const {
    columnModels, config, forms, onSubmitValid, onSubmitInvalid, removeForm
  } = useRecordedit();

  const { handleSubmit } = useFormContext();

  const formContainer = useRef<any>(null);

  /**
   * add the top horizontal scroll if needed
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
    }
  }, []);

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
            <div key={`form-header-${formNumber}`} className='form-header entity-value'>
              <span>{formIndex + 1}</span>
              <div className='form-header-buttons-container'>
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
        </div>}
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
 * components instead of having it in the Form.
 *
 */
const FormRow = ({ columnModelIndex }: FormRowProps): JSX.Element => {

  const {
    forms, appMode, reference, columnModels, tuples, activeSelectAll,
    canUpdateValues, columnPermissionErrors, foreignKeyData, waitingForForeignKeyData,
    getRecordeditLogStack, getRecordeditLogAction,
  } = useRecordedit();

  /**
   * which columns should show the permission error.
   * if a user cannot edit a column in one of the rows, we cannot allow them
   * to edit that column in other rows.
   */
  const [showPermissionError, setShowPermissionError] = useState<{ [key: string]: boolean }>({});

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
      const newHeight = container.current?.getBoundingClientRect().height;
      if (newHeight === undefined || newHeight === cachedHeight || !container.current) return;
      cachedHeight = newHeight;
      const header = document.querySelector<HTMLElement>(`.entity-key.entity-key-${columnModelIndex}`);
      if (header) {
        header.style.height = `${cachedHeight}px`;
      }
    });

    return () => {
      sensor.detach();
    }
  }, []);


  // ------------------------ callbacks -----------------------------------//

  /**
   * show the error to users after they clicked on the cell.
   */
  const onPermissionClick = (formIndex: number) => {
    setShowPermissionError((prev) => {
      const res = { ...prev };
      res[formIndex] = true;
      return res;
    });
  };

  // -------------------------- render logic ---------------------- //

  const showSelectAll = activeSelectAll === columnModelIndex;
  const columnModel = columnModels[columnModelIndex];

  /**
 * Returntrue if,
 *  - columnModel is marked as disabled
 *  - based on dynamic ACLs the column cannot be updated (based on canUpdateValues)
 *  - show all
 * @param formNumber
 * @param columnModel
 * @param canUpdateValues
 */
  const getIsDisabled = (formNumber?: number, isSelectAllInput?: boolean): boolean => {
    if (isSelectAllInput) {
      return false;
    }

    if (columnModel.isDisabled || showSelectAll) {
      return true;
    }

    if (typeof formNumber === 'number') {
      const valName = `${formNumber}-${columnModel.column.name}`;
      if (canUpdateValues && valName in canUpdateValues && canUpdateValues[valName] === false) {
        return true;
      }
    }

    return false;
  }

  const renderInput = (formNumber: number, formIndex?: number) => {

    const colName = columnModel.column.name;

    const isDisabled = getIsDisabled(formNumber, formNumber === SELECT_ALL_INPUT_FORM_VALUE);

    let placeholder = '';
    let permissionError = '';
    if (isDisabled) {
      placeholder = getDisabledInputValue(columnModel.column);

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

    const safeClassNameId = `${formNumber}-${makeSafeIdAttr(columnModel.column.displayname.value)}`;

    return (<>
      {permissionError && typeof formIndex === 'number' &&
        <div
          className={`column-permission-overlay column-permission-overlay-${safeClassNameId}`}
          onClick={() => onPermissionClick(formIndex)}
        />
      }
      <InputSwitch
        key={colName}
        displayErrors
        displayExtraDateTimeButtons
        displayDateTimeLabels
        disableInput={isDisabled}
        requiredInput={columnModel.isRequired}
        name={`${formNumber}-${colName}`}
        type={columnModel.inputType}
        classes='column-cell-input'
        placeholder={placeholder}
        columnModel={columnModel}
        appMode={appMode}
        formNumber={formNumber}
        parentReference={reference}
        parentTuple={appMode === appModes.EDIT && typeof formIndex === 'number' ? tuples[formIndex] : undefined}
        parentLogStack={getRecordeditLogStack()}
        parentLogStackPath={getRecordeditLogAction(true)}
        foreignKeyData={foreignKeyData}
        waitingForForeignKeyData={waitingForForeignKeyData}
      />
      {typeof formIndex === 'number' && formIndex in showPermissionError &&
        <div className={`column-permission-warning column-permission-warning-${safeClassNameId}`}>{permissionError}</div>
      }
    </>)
  }

  return (
    <div className={`form-inputs-row ${showSelectAll ? 'highlighted-row' : ''}`} ref={container}>
      <div className='inputs-row'>
        {forms.map((formNumber: number, formIndex: number) => (
          <div key={`form-${formNumber}-input-${columnModelIndex}`} className='entity-value'>
            {renderInput(formNumber, formIndex)}
          </div>
        ))}
      </div>
      {showSelectAll && <SelectAllRow columnModelIndex={columnModelIndex} />}
    </div>
  )

};

/**
 * shows the select all row
 * NOTE this is its own component to avoid rerendering the whole row on each change.
 */
const SelectAllRow = ({ columnModelIndex }: FormRowProps) => {
  const {
    columnModels, forms, reference, waitingForForeignKeyData, foreignKeyData, appMode,
    canUpdateValues, toggleActiveSelectAll, logRecordeditClientAction
  } = useRecordedit();

  const { watch, reset, getValues, formState: { errors } } = useFormContext();

  const [isEmpty, setIsEmpty] = useState(true);

  /**
   * if the selected value is empty, we should disable the apply-all
   * useEffect allows us to look for the value and only rerender when we have to.
   */
  useEffect(() => {
    const subscribe = watch((data, options) => {
      const n = `${SELECT_ALL_INPUT_FORM_VALUE}-${columnModels[columnModelIndex].column.name}`;
      const columnModel = columnModels[columnModelIndex];
      if (!options.name || options.name !== n) return;

      // see if the input is empty
      let temp = !Boolean(data[n]);
      if (columnModel.column.type.name === 'boolean') {
        temp = typeof data[n] !== 'boolean';
      }

      if (isEmpty !== temp) {
        setIsEmpty(temp);
      }

    });
    return () => subscribe.unsubscribe();
  }, [watch, isEmpty]);

  // ------------------------ callbacks -----------------------------------//

  const applyValueToAll = () => {
    const cm = columnModels[columnModelIndex];

    logRecordeditClientAction(
      LogActions.SET_ALL_APPLY,
      cm.logStackPathChild,
      cm.logStackNode,
      undefined,
      cm.column.reference ? cm.column.reference : undefined
    );

    setValueForAllInputs();
  };

  const clearAllValues = () => {
    const cm = columnModels[columnModelIndex];

    logRecordeditClientAction(
      LogActions.SET_ALL_CLEAR,
      cm.logStackPathChild,
      cm.logStackNode,
      undefined,
      cm.column.reference ? cm.column.reference : undefined
    );

    setValueForAllInputs(true);
  };

  const closeSelectAll = () => {
    const cm = columnModels[columnModelIndex];

    logRecordeditClientAction(
      LogActions.SET_ALL_CANCEL,
      cm.logStackPathChild,
      cm.logStackNode,
      undefined,
      cm.column.reference ? cm.column.reference : undefined
    );

    toggleActiveSelectAll(columnModelIndex);
  };

  /**
   * The callback used by functions above to set the values of the row.
   * if clearValue is true, it will use emtpy value, otherwise it will copy the select-all input value
   */
  const setValueForAllInputs = (clearValue?: boolean) => {
    const cm = columnModels[columnModelIndex];

    forms.forEach((formValue: number) => {
      // ignore the ones that cannot be updated
      if (appMode === appModes.EDIT && canUpdateValues && !canUpdateValues[`${formValue}-${cm.column.name}`]) {
        return;
      }
      reset(copyOrClearValue(cm, getValues(), foreignKeyData.current, formValue, SELECT_ALL_INPUT_FORM_VALUE, clearValue));
    });
  };

  // -------------------------- render logic ---------------------- //

  const columnModel = columnModels[columnModelIndex];
  const colName = columnModel.column.name;
  const inputName = `${SELECT_ALL_INPUT_FORM_VALUE}-${colName}`;

  const btnClass = `${makeSafeIdAttr(columnModel.column.displayname.value)} chaise-btn chaise-btn-secondary`;

  return (
    <div className='select-all-row match-entity-value'>
      <div className='select-all-text'>Set value for all records: </div>
      <div className='select-all-input'>
        <InputSwitch
          key={colName}
          displayErrors
          displayExtraDateTimeButtons
          displayDateTimeLabels
          disableInput={false}
          requiredInput={false}
          name={inputName}
          type={columnModel.inputType}
          classes='column-cell-input'
          columnModel={columnModel}
          appMode={appMode}
          formNumber={SELECT_ALL_INPUT_FORM_VALUE}
          parentReference={reference}
          foreignKeyData={foreignKeyData}
          waitingForForeignKeyData={waitingForForeignKeyData}
        />
      </div>
      <div className='chaise-btn-group select-all-buttons'>
        <ChaiseTooltip tooltip='Click to apply the value to all records.' placement='bottom'>
          <button
            type='button' className={`select-all-apply-${btnClass}`} onClick={applyValueToAll}
            // we should disable it when its empty or has error
            // NOTE I couldn't use `errors` in the watch above since it was always one cycle behind.
            disabled={isEmpty || (errors && inputName in errors)}
          >
            Apply All
          </button>
        </ChaiseTooltip>
        <ChaiseTooltip tooltip='Click to clear all values for all records.' placement='bottom'>
          <button type='button' className={`select-all-clear-${btnClass}`} onClick={clearAllValues}>
            Clear All
          </button>
        </ChaiseTooltip>
        <ChaiseTooltip tooltip='Click to close the set all input.' placement='bottom'>
          <button type='button' className={`select-all-close-${btnClass}`} onClick={closeSelectAll}>
            Close
          </button>
        </ChaiseTooltip>
      </div>
    </div>
  )
}

export default FormContainer;
