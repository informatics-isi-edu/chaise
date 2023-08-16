// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { appModes, RecordeditDisplayMode, SELECT_ALL_INPUT_FORM_VALUE } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { getDisabledInputValue } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { copyOrClearValue } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { addTopHorizontalScroll } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

const FormContainer = (): JSX.Element => {

  const {
    columnModels, config, forms, onSubmitValid, onSubmitInvalid, removeForm,
  } = useRecordedit();

  const { handleSubmit } = useFormContext();

  const formContainer = useRef<any>(null);
  const [removeFormIndex, setRemoveForm] = useState<number>(0);
  const [removeClicked, setRemoveClicked] = useState<boolean>(false);
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
    };
  }, []);

  // This useffect is added to set a max-width to select-all-row as the width of the visible area
  useEffect(() => {
    const mainResizeSensor = new ResizeSensor(
      formContainer.current as Element,
      () => {
        handleScroll();
      }
    );

    return () => {
      mainResizeSensor.detach();
    };
  }, []);

  /* Callback event for scroll functionality on recordedit-form to set a max-width to select-all-row as the
  width of the visible area */
  const handleScroll = () => {
    const parentContainer: any = document.querySelector('.recordedit-form');
    const nonScrollableDiv: any = document.querySelector('.select-all-row');

    if (parentContainer && nonScrollableDiv) {
      const visibleWidth = parentContainer.offsetWidth; // Width of the visible area
      nonScrollableDiv.style.maxWidth = visibleWidth + 'px'; // Set the max-width to the visible width
    }
  };

  /* This callback is called when we want to delete the form, we are setting the form index and
  a boolean to know the remove button is clicked */
  const deleteForm = (formIndex: number, formNumber: number) => {
    setRemoveForm(formNumber);
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
        onScroll={handleScroll}
        onSubmit={handleSubmit(onSubmitValid, onSubmitInvalid)}
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
                      onClick={() => deleteForm(formIndex, formNumber)}
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
            removeClicked={removeClicked}
            setRemoveClicked={setRemoveClicked}
            removeForm={removeFormIndex}
            key={`form-row-${idx}`}
            columnModelIndex={idx}
          />
        ))}
      </form>
    </div>
  );
};

type FormRowProps = {
  columnModelIndex: number;
  activeForm?: any[];
  setActiveForm?: any;
  removeForm?: number;
  removeClicked?: boolean;
  setRemoveClicked?: any;
};

/**
 * each row in the form
 * to make the height logic simpler, I decided to extract the rows as separate
 * components instead of having it in the Form.
 *
 */
const FormRow = ({
  columnModelIndex,
  removeForm,
  removeClicked,
  setRemoveClicked,
}: FormRowProps): JSX.Element => {
  const {
    forms,
    appMode,
    reference,
    columnModels,
    tuples,
    activeSelectAll,
    canUpdateValues,
    columnPermissionErrors,
    foreignKeyData,
    waitingForForeignKeyData,
    getRecordeditLogStack,
    getRecordeditLogAction,
  } = useRecordedit();
  const [activeForm, setActiveForm] = useState<number[]>([]);
  /**
   * which columns should show the permission error.
   * if a user cannot edit a column in one of the rows, we cannot allow them
   * to edit that column in other rows.
   */
  const [showPermissionError, setShowPermissionError] = useState<{
    [key: string]: boolean;
  }>({});

  /**
   * reset the state of showing permission errors whenever the errors changed
   */
  useEffect(() => {
    setShowPermissionError({});
  }, [columnPermissionErrors]);

  const container = useRef<HTMLDivElement>(null);
  const cm = columnModels[columnModelIndex];

  /**
   * make sure the column names (key-column.tsx) have the same height as FormRow
   */
  useLayoutEffect(() => {
    if (!container || !container.current) return;

    let cachedHeight = -1;
    const sensor = new ResizeSensor(
      container.current as Element,
      (dimension) => {
        const newHeight = container.current?.getBoundingClientRect().height;
        if (
          newHeight === undefined ||
          newHeight === cachedHeight ||
          !container.current
        )
          return;
        cachedHeight = newHeight;
        const header = document.querySelector<HTMLElement>(
          `.entity-key.entity-key-${columnModelIndex}`
        );
        if (header) {
          header.style.height = `${cachedHeight}px`;
        }
      }
    );

    return () => {
      sensor.detach();
    };
  }, []);
  /*
  * This useffect is to remove the form from the acitve forms if we delete the form
  */
  useEffect(() => {
    if (removeForm && activeForm?.length > 0) {
      setRemoveClicked(false);
      setActiveForm((prevActiveForms) => {
        if (prevActiveForms?.includes(removeForm)) {
          return prevActiveForms?.filter(
            (prevFormNumber) => prevFormNumber !== removeForm
          );
        } else {
          return prevActiveForms; // If the form to remove is not present in activeForm, return the original activeForm
        }
      });
    }
  }, [removeClicked]);
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

  /**
   * callback to handle form click.
   * It sets the forms selected in the state variable on select and remove it on deselect
   */
  const handleFormClick = (formNumber: number) => {
    setActiveForm((prevActiveForms: number[]) => {
      if (prevActiveForms.includes(formNumber)) {
        return prevActiveForms.filter(
          (prevFormNumber) => prevFormNumber !== formNumber
        );
      } else {
        return [...prevActiveForms, formNumber];
      }
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
  const getIsDisabled = (
    formNumber?: number,
    isSelectAllInput?: boolean
  ): boolean => {
    if (isSelectAllInput) {
      return false;
    }

    if (columnModel.isDisabled || showSelectAll) {
      return true;
    }

    if (typeof formNumber === 'number') {
      const valName = `${formNumber}-${columnModel.column.name}`;
      if (
        canUpdateValues &&
        valName in canUpdateValues &&
        canUpdateValues[valName] === false
      ) {
        return true;
      }
    }

    return false;
  };

  const renderInput = (formNumber: number, formIndex?: number) => {
    const colName = columnModel.column.name;

    const isDisabled = getIsDisabled(
      formNumber,
      formNumber === SELECT_ALL_INPUT_FORM_VALUE
    );

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
    else if (
      appMode === appModes.EDIT &&
      isObjectAndKeyDefined(columnPermissionErrors, colName)
    ) {
      permissionError = columnPermissionErrors[colName];
    }

    const safeClassNameId = `${formNumber}-${makeSafeIdAttr(
      columnModel.column.displayname.value
    )}`;

    return (
      <>
        {permissionError && typeof formIndex === 'number' && (
          <div
            className={`column-permission-overlay column-permission-overlay-${safeClassNameId}`}
            onClick={() => onPermissionClick(formIndex)}
          />
        )}
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
          parentTuple={
            appMode === appModes.EDIT && typeof formIndex === 'number'
              ? tuples[formIndex]
              : undefined
          }
          parentLogStack={getRecordeditLogStack()}
          parentLogStackPath={getRecordeditLogAction(true)}
          foreignKeyData={foreignKeyData}
          waitingForForeignKeyData={waitingForForeignKeyData}
        />
        {typeof formIndex === 'number' && formIndex in showPermissionError && (
          <div
            className={`column-permission-warning column-permission-warning-${safeClassNameId}`}
          >
            {permissionError}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className={`form-inputs-row ${showSelectAll ? 'highlighted-row' : ''}`}
      ref={container}
    >
      <div className='inputs-row'>
        {forms.map((formNumber: number, formIndex: number) => (
          <div
            key={`form-${formNumber}-input-${columnModelIndex}`}
            /**
             * This is added to show the form is selected to apply the change when it is in edit mode
             */
            className={`form-overlay entity-value ${activeForm.includes(formNumber) && showSelectAll
              ? 'entity-active'
              : ''
              }`}
            onClick={() => {
              // I couldn’t test that scenario, since on load we’re removing the forms that user cannot edit,
              if (
                appMode === appModes.EDIT &&
                canUpdateValues &&
                !canUpdateValues[`${formNumber}-${cm.column.name}`]
              ) {
                return;
              }
              handleFormClick(formNumber);
            }}
          >
            {renderInput(formNumber, formIndex)}
          </div>
        ))}
      </div>
      {showSelectAll && (
        <SelectAllRow
          activeForm={activeForm}
          setActiveForm={setActiveForm}
          columnModelIndex={columnModelIndex}
        />
      )}
    </div>
  );
};

/**
 * shows the select all row
 * NOTE this is its own component to avoid rerendering the whole row on each change.
 */
const SelectAllRow = ({
  columnModelIndex,
  activeForm,
  setActiveForm,
}: FormRowProps) => {
  const {
    columnModels,
    forms,
    reference,
    waitingForForeignKeyData,
    foreignKeyData,
    appMode,
    canUpdateValues,
    toggleActiveSelectAll,
    logRecordeditClientAction,
  } = useRecordedit();
  const {
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useFormContext();
  let ref = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [selected, setSelected] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [width, setWidth] = useState(0);

  // This useeffect is to set the first form as active on load
  useEffect(() => {
    if (activeForm?.length === 0) {
      setActiveForm([forms[0]]);
    }
  }, []);

  /* This useffect is to set the indeterminate checkbox when forms are individually selected
   *  and selected forms length is less than total forms length
   */
  useEffect(() => {
    if (ref && ref.current && activeForm) {
      (ref.current as HTMLInputElement).indeterminate =
        activeForm?.length > 0
          ? activeForm?.length < forms.length
            ? true
            : false
          : false;
      setSelected(activeForm?.length === forms.length);
    }
  }, [activeForm]);

  // useEffect to call update only when there is a change in the width of select-all-row to update textarea width
  useEffect(() => {
    updateTextareaWidth();
  }, [width]);

  // useEffect to have a resize sensor to change the direction of upper-row when width of container is less than 400.
  useEffect(() => {

    const nonScrollableDiv = document.querySelector('.select-all-input') as HTMLElement;

    const mainResizeSensor = new ResizeSensor(nonScrollableDiv,
      () => {
        const upperRow = document.querySelector('.select-upper-row') as HTMLElement;
        const upperRowWidth = upperRow?.getBoundingClientRect().width;
        if (upperRow && upperRowWidth < 400 && (columnModel.inputType === 'textarea' || columnModel.inputType === 'markdown')) {
          upperRow.style.flexDirection = 'column-reverse'
        } else {
          upperRow.style.flexDirection = 'row'
        }
      }
    );

    return () => {
      mainResizeSensor.detach();
    };
  }, []);

  // useEffect to have a resize sensor to width of textarea to the the parent container width.
  useEffect(() => {

    const nonScrollableDiv = document.querySelector('.select-all-row') as HTMLElement;
    setWidth(nonScrollableDiv.offsetWidth)
    // Initial update
    updateTextareaWidth();

    const mainResizeSensor = new ResizeSensor(nonScrollableDiv,
      () => {
        const newContainerWidth = nonScrollableDiv.offsetWidth;
        setWidth(newContainerWidth)
      }
    );

    return () => {
      mainResizeSensor.detach();
    };
  }, []);

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

  // Call back for select all checkbox to toggle all forms as selected and unselected
  const onSelectChange = () => {
    setShowTooltip(false);
    if (!selected) {
      setActiveForm(forms);
    } else {
      setActiveForm([]);
    }
    setSelected(!selected);
  };

  /**
   * The callback used by functions above to set the values of the row.
   * if clearValue is true, it will use emtpy value, otherwise it will copy the select-all input value
   */
  const setValueForAllInputs = (clearValue?: boolean) => {
    const cm = columnModels[columnModelIndex];

    activeForm?.forEach((formValue: number) => {
      // ignore the ones that cannot be updated
      if (
        appMode === appModes.EDIT &&
        canUpdateValues &&
        !canUpdateValues[`${formValue}-${cm.column.name}`]
      ) {
        return;
      }
      reset(
        copyOrClearValue(
          cm,
          getValues(),
          foreignKeyData.current,
          formValue,
          SELECT_ALL_INPUT_FORM_VALUE,
          clearValue
        )
      );
    });
  };

  /* This is to set the width of text area as the width of select-all-row. We have to involve javascript as 
  the immidiate parent centre-align we cant set a width to it as 100%. So we have to involve JS to set the width of textarea
  to the next immediate parent width which is select-all-row */
  const updateTextareaWidth = () => {
    const textarea = document.querySelector('.select-some-textarea') as HTMLElement;
    const nonScrollableDiv = document.querySelector('.select-all-row') as HTMLElement;
    if (textarea) {
      if (window.innerWidth < 1800) {
        const newContainerWidth = nonScrollableDiv.offsetWidth;
        textarea.style.width = `${newContainerWidth}px`;
      } else {
        textarea.style.width = '1200px';
      }
    }
  };
  // -------------------------- render logic ---------------------- //

  const columnModel = columnModels[columnModelIndex];
  const colName = columnModel.column.name;
  const inputName = `${SELECT_ALL_INPUT_FORM_VALUE}-${colName}`;

  const btnClass = `${makeSafeIdAttr(
    columnModel.column.displayname.value
  )} chaise-btn chaise-btn-secondary`;

  const renderHelpTooltip = () => {
    const splitLine1 =
      'You can click on the form to select it and apply changes to it.';
    const splitLine2 =
      'You can use the checkbox to select and deselect all records. ' +
      'By default, if there is no previous selection, the first form will be selected. ';
    const splitLine3 =
      'After the forms are selected, ' +
      'you can click Apply button to apply the changes to selected records.';
    const splitLine4 =
      'You can also clear the values for selected records by clicking on Clear button.';
    return (
      <>
        <p>{splitLine1}</p>
        <p>{splitLine2}</p>
        <p>{splitLine3}</p>
        <p>{splitLine4}</p>
      </>
    );
  };

  return (
    <div className='select-all-row match-entity-value'>
      <div className={`centre-align ${columnModel.inputType === 'longtext'
        || columnModel.inputType === 'markdown' ? 'centre-align-textarea' : ''}`}>
        <div
          className='select-upper-row'
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <div className='select-all-text'>
            <ChaiseTooltip
              placement='bottom-start'
              show={showTooltip}
              tooltip={
                !selected ? 'Select all records.' : 'Clear all selection'
              }
              onToggle={(show) => setShowTooltip(show)}
            >
              <span className='chaise-checkbox select-all-checkbox'>
                <input
                  ref={ref}
                  className={'checkbox-input' + (selected ? ' checked' : '')}
                  type='checkbox'
                  checked={selected}
                  disabled={false}
                  onChange={onSelectChange}
                />

                <span className='checkbox-label' onClick={onSelectChange}>
                  {activeForm && activeForm?.length > 0
                    ? `${activeForm?.length} of ${forms.length} selected records`
                    : 'Select All'}
                </span>
              </span>
            </ChaiseTooltip>
            <ChaiseTooltip
              placement='bottom-start'
              tooltip={renderHelpTooltip()}
            >
              <button
                type='button'
                className='select-all-how-to chaise-btn chaise-btn-tertiary chaise-btn-sm'
              >
                <span className='chaise-icon chaise-info'></span>
              </button>
            </ChaiseTooltip>
          </div>

          <div className='select-all-buttons'>
            <div className='chaise-btn-group'>
              <ChaiseTooltip
                tooltip='Apply the value to selected records.'
                placement='bottom'
              >
                <button
                  type='button'
                  className={`select-all-apply-${btnClass}`}
                  onClick={applyValueToAll}
                  // we should disable it when its empty or has error
                  // NOTE I couldn't use `errors` in the watch above since it was always one cycle behind.
                  disabled={
                    (errors && inputName in errors) || activeForm?.length === 0
                  }
                >
                  Apply
                </button>
              </ChaiseTooltip>
              <ChaiseTooltip
                tooltip='Clear all values for selected records.'
                placement='bottom'
              >
                <button
                  type='button'
                  className={`select-all-clear-${btnClass}`}
                  onClick={clearAllValues}
                  disabled={activeForm?.length === 0}
                >
                  Clear
                </button>
              </ChaiseTooltip>
              <ChaiseTooltip
                tooltip='Close the set multiple inputs.'
                placement='bottom'
              >
                <button
                  type='button'
                  className={`select-all-close-${btnClass}`}
                  onClick={closeSelectAll}
                >
                  Close
                </button>
              </ChaiseTooltip>
            </div>
          </div>
        </div>
        <div
          className={`select-all-input ${columnModel.inputType === 'markdown' ||
            columnModel.inputType === 'longtext'
            ? 'select-all-textarea'
            : ''
            }`}
        >
          <InputSwitch
            key={colName}
            displayErrors
            displayExtraDateTimeButtons
            displayDateTimeLabels
            disableInput={false}
            requiredInput={false}
            name={inputName}
            inputClasses={`${columnModel.inputType === 'longtext'
              || columnModel.inputType === 'markdown' ? 'select-some-textarea' : ''}`}
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
      </div>
    </div >
  );
};

export default FormContainer;
