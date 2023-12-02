// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import MultiFormInputRow from '@isrd-isi-edu/chaise/src/components/recordedit/multi-form-input-row';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, MULTI_FORM_INPUT_FORM_VALUE } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { getDisabledInputValue } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

type FormRowProps = {
  /**
  * The column index.
  */
  columnModelIndex: number;
  /**
  * The deleted form index.
  * (if removeClicked is true, we expect this to show the index of deleted form)
  */
  removeFormIndex?: number;
  /**
  * The boolean to know whether remove form is clicked.
  * (when a form is removed, we have to update the activeForms)
  */
  removeClicked?: boolean;
  /**
  * The function to set remove form is clicked.
  * (change back the removeClicked that is passed to this component)
  */
  setRemoveClicked?: any;
};
const FormRow = ({
  columnModelIndex,
  removeFormIndex,
  removeClicked,
  setRemoveClicked,
}: FormRowProps): JSX.Element => {
  const {
    forms,
    appMode,
    reference,
    columnModels,
    tuples,
    activeMultiForm,
    canUpdateValues,
    columnPermissionErrors,
    foreignKeyData,
    waitingForForeignKeyData,
    getRecordeditLogStack,
    getRecordeditLogAction,
    foreignKeyCallbacks
  } = useRecordedit();

  /**
   * This state variable is to set the form as active when its selected. We are storing the form number
   * (used when multi-form-row is displayed)
   */
  const [activeForms, setActiveForm] = useState<number[]>([]);

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
   * 1. make sure the column names (key-column.tsx) have the same height as FormRow
   *
   * 2. make sure mulit-form-row-input doesn't go beyond the visible portion of form-container (set max width)
   *    while we're setting the max-wdith to be the same as form-container, this has to be defined here as we must
   *    update it when the size of multi-form-input-row changes. if we do this based on form-container size then it won't
   *    cover the cases where we scroll horziontally and open a new multi-form-input-row
   */
  useLayoutEffect(() => {
    if (!container || !container.current) return;

    let cachedHeight = -1, cachedWidth = -1;
    const sensor = new ResizeSensor(container.current as Element, (dimension) => {
      if (!container.current) return;

      const newHeight = container.current.getBoundingClientRect().height;
      if (newHeight !== undefined || newHeight !== cachedHeight) {
        cachedHeight = newHeight;
        const header = document.querySelector<HTMLElement>(`.entity-key.entity-key-${columnModelIndex}`);
        if (header) {
          header.style.height = `${cachedHeight}px`;
        }
      }

      const newWidth = container.current.offsetWidth;
      if (newWidth !== cachedWidth) {
        cachedWidth = newWidth;
        const nonScrollableDiv = document.querySelector('.multi-form-input-row') as HTMLElement;
        const formContainer = document.querySelector('.form-container') as HTMLElement;
        if (formContainer && nonScrollableDiv) {
          const visibleWidth = formContainer.offsetWidth; // Width of the visible area
          nonScrollableDiv.style.maxWidth = visibleWidth + 'px'; // Set the max-width to the visible width
        }
      }

    });

    return () => {
      sensor.detach();
    };
  }, []);

  /**
   * This useffect is to remove the form from the acitve forms if we delete the form.
   * removeClicked is passed from the parent to communicate that delete form is clicked
  */
  useEffect(() => {
    if (removeFormIndex && activeForms?.length > 0) {
      setRemoveClicked(false);
      setActiveForm((prevActiveForms) => {
        if (prevActiveForms?.includes(removeFormIndex)) {
          return prevActiveForms?.filter(
            (prevFormNumber) => prevFormNumber !== removeFormIndex
          );
        } else {
          return prevActiveForms; // If the form to remove is not present in activeForms, return the original activeForms
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
    // disallow users to click on the disabled inputs (although this is not possible anymore as we're removing these forms on load)
    if (appMode === appModes.EDIT && canUpdateValues && !canUpdateValues[`${formNumber}-${cm.column.name}`]) {
      return;
    }

    // only call when we're actually showing the multi-form-row
    if (!showMultiFormRow) {
      return;
    }

    return (e: any) => {
      e.stopPropagation();
      e.preventDefault();

      setActiveForm((prevActiveForms: number[]) => {
        if (prevActiveForms.includes(formNumber)) {
          return prevActiveForms.filter(
            (prevFormNumber) => prevFormNumber !== formNumber
          );
        } else {
          return [...prevActiveForms, formNumber];
        }
      });
    }
  };

  // -------------------------- render logic ---------------------- //

  const showMultiFormRow = activeMultiForm === columnModelIndex;
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
  const getIsDisabled = (formNumber?: number, isMultiFormRow?: boolean): boolean => {
    if (isMultiFormRow) {
      return false;
    }

    if (columnModel.isDisabled || showMultiFormRow) {
      return true;
    }

    if (typeof formNumber === 'number') {
      const valName = `${formNumber}-${columnModel.column.name}`;
      if (canUpdateValues && valName in canUpdateValues && canUpdateValues[valName] === false) {
        return true;
      }
    }

    return false;
  };

  /**
   * add appropriate class names to the cell
   */
  const getEntityValueClass = (formNumber: number) => {
    const classes = [];
    const cannotBeUpdated = (appMode === appModes.EDIT && canUpdateValues && !canUpdateValues[`${formNumber}-${cm.column.name}`])
    if (!cannotBeUpdated && showMultiFormRow) {
      classes.push('clickable-form-overlay');
      if (activeForms.includes(formNumber)) {
        classes.push('entity-active');
      }
    }

    return classes.join(' ');
  };

  const renderInput = (formNumber: number, formIndex?: number) => {
    const colName = columnModel.column.name;

    const isDisabled = getIsDisabled(formNumber, formNumber === MULTI_FORM_INPUT_FORM_VALUE);

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
          parentTuple={appMode === appModes.EDIT && typeof formIndex === 'number' ? tuples[formIndex] : undefined}
          parentLogStack={getRecordeditLogStack()}
          parentLogStackPath={getRecordeditLogAction(true)}
          foreignKeyData={foreignKeyData}
          waitingForForeignKeyData={waitingForForeignKeyData}
          foreignKeyCallbacks={foreignKeyCallbacks}
        />
        {typeof formIndex === 'number' && formIndex in showPermissionError &&
          <div className={`column-permission-warning column-permission-warning-${safeClassNameId}`}>{permissionError}</div>
        }
      </>
    );
  };

  return (
    <div className={`form-inputs-row ${showMultiFormRow ? 'highlighted-row' : ''}`} ref={container}>
      <div className='inputs-row'>
        {forms.map((formNumber: number, formIndex: number) => (
          <div
            key={`form-${formNumber}-input-${columnModelIndex}`}
            className={`entity-value ${getEntityValueClass(formNumber)}`}
            onClick={handleFormClick(formNumber)}
          >
            {renderInput(formNumber, formIndex)}
          </div>
        ))}
      </div>
      {showMultiFormRow &&
        <MultiFormInputRow
          activeForms={activeForms}
          setActiveForm={setActiveForm}
          columnModelIndex={columnModelIndex}
        />
      }
    </div>
  );
};

export default FormRow;
