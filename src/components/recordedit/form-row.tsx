// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import MultiFormInputRow from '@isrd-isi-edu/chaise/src/components/recordedit/multi-form-input-row';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';

// hooks
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, MULTI_FORM_INPUT_FORM_VALUE } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { CommentDisplayModes } from '@isrd-isi-edu/chaise/src/models/displayname';

// utils
import { getDisabledInputValue } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { disabledTuplesPromise } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

type FormRowProps = {
  /**
   * If the current form row has the multi form row open
   * NOTE: this is a prop to prevent every form row from rerendering when the activeMultiForm changes in the provider
   */
  isActiveForm: boolean;
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
  /* change the active select all */
  toggleActiveMultiForm: (colIndex: number) => void;
};
const FormRow = ({
  isActiveForm,
  columnModelIndex,
  removeFormIndex,
  removeClicked,
  setRemoveClicked,
  toggleActiveMultiForm
}: FormRowProps): JSX.Element => {
  const {
    forms,
    appMode,
    reference,
    columnModels,
    tuples,
    canUpdateValues,
    columnPermissionErrors,
    foreignKeyData,
    waitingForForeignKeyData,
    prefillAssociationSelectedRows,
    updateAssociationSelectedRows,
    getRecordeditLogStack,
    getRecordeditLogAction,
    showCloneSpinner,
    setShowCloneSpinner,
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
  const formsRef = useRef<HTMLDivElement>(null);
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

    let cachedHeight = -1;
    const sensor = new ResizeSensor(container.current as Element, () => {
      if (!container.current) return;

      const newHeight = container.current.getBoundingClientRect().height;
      if (newHeight !== undefined || newHeight !== cachedHeight) {
        cachedHeight = newHeight;
        const header = document.querySelector<HTMLElement>(`.entity-key.entity-key-${columnModelIndex}`);
        if (header) {
          header.style.height = `${cachedHeight}px`;
        }
      }

      // make sure the max-width of the multi-form-input-row is the same as visible width of the form
      const nonScrollableDiv = document.querySelector<HTMLElement>('.multi-form-input-row');
      const formContainer = document.querySelector<HTMLElement>('.form-container');
      if (formContainer && nonScrollableDiv) {
        // Width of the visible area
        const visibleWidth = formContainer.offsetWidth;

        // Set the max-width to the visible width
        nonScrollableDiv.style.maxWidth = visibleWidth + 'px';
      }

    });

    return () => {
      sensor.detach();
    };
  }, []);

  useEffect(() => {
    // This condition is to remove the form from the acitve forms if we delete the form.
    // removeClicked is passed from the parent to communicate that delete form is clicked
    if (removeClicked && removeFormIndex && activeForms?.length > 0) {
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

    /**
     * only run this condition for the first form-row in the recordedit view when number of "forms" changes
     * `callAddForm` in /components/recordedit.tsx calls addForm(#_forms_to_add) which will then set the `forms` state variable
     * once callAddForm finishes, react repaints the UI then will trigger this useEffect because forms was changed
     * NOTE: it appears this useEffect is triggering after the "full repaint" even if there was a delay
     */
    if (columnModelIndex === 0) {
      // only run this on the first form row to keep track of total forms visible
      if (!formsRef || !formsRef.current || !showCloneSpinner) return;

      if (formsRef.current.children.length === forms.length) setShowCloneSpinner(false);
    }
  }, [forms, removeClicked]);

  useEffect(() => {
    /**
     * This modifies row width when the multi-form-row is enabled for the field
     * We set the width of the row to match the form width to avoid inputs from rendering beyond the limits of the form.
     */
    if (!columnModel.inputType.match(/iframe|file|boolean|popup-select/)) return;

    const formHeader = document.querySelector('.form-header-row') as HTMLElement

    let rowWidth = formHeader.scrollWidth;

    if (container.current) {
      container.current.style.minWidth = 'none';
      container.current.style.maxWidth = 'none';
      container.current.style.width = `${rowWidth}px`;
    }

    // Ensure the row widths are updated on window resize event
    window.addEventListener('resize', () => {
      let rowWidth = formHeader.scrollWidth;

      if (container.current) {
        container.current.style.minWidth = 'none';
        container.current.style.maxWidth = 'none';
        container.current.style.width = `${rowWidth}px`;
      }
    })
  }, [isActiveForm, forms])

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
    if (appMode === appModes.EDIT && canUpdateValues && !canUpdateValues[`c_${formNumber}-${cm.column.RID}`]) {
      return;
    }

    // only call when we're actually showing the multi-form-row
    if (!isActiveForm) {
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

  const columnModel = columnModels[columnModelIndex];
  const hasInlineComment = columnModel.column.comment && columnModel.column.comment.displayMode === CommentDisplayModes.INLINE;

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

    if (columnModel.isDisabled || isActiveForm) {
      return true;
    }

    if (typeof formNumber === 'number') {
      const valName = `c_${formNumber}-${columnModel.column.RID}`;
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
    const cannotBeUpdated = (appMode === appModes.EDIT && canUpdateValues && !canUpdateValues[`c_${formNumber}-${cm.column.RID}`])
    if (!cannotBeUpdated && isActiveForm) {
      classes.push('clickable-form-overlay');
      if (activeForms.includes(formNumber)) {
        classes.push('entity-active');
      }
    }

    return classes.join(' ');
  };

  const renderInput = (formNumber: number, formIndex?: number) => {
    const column = columnModel.column;
    const colName = column.name;
    const colRID = column.RID;

    const isDisabled = getIsDisabled(formNumber, formNumber === MULTI_FORM_INPUT_FORM_VALUE);

    let placeholder = '';
    let permissionError = '';
    if (isDisabled) {
      placeholder = getDisabledInputValue(column);

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

    const safeClassNameId = `${formNumber}-${makeSafeIdAttr(column.displayname.value)}`;

    const tempForeignKeyCallbacks = { ...foreignKeyCallbacks };
    /**
     * add foreginkey callbacks to generated input if:
     *  - there is a pair of columns that create a unique assocation that use the prefill behavior
     *  - the column is a foreignkey
     *  - and the column is the one used for associating to the leaf table of the association
     */
    if (reference.prefill.isUnique && column.isForeignKey && reference.prefill.leafColumn.name === colName) {
      tempForeignKeyCallbacks.getDisabledTuples = disabledTuplesPromise(
        column.reference.contextualize.compactSelectForeignKey,
        reference.prefill.disabledRowsFilter(),
        prefillAssociationSelectedRows
      );

      tempForeignKeyCallbacks.updateAssociationSelectedRows = updateAssociationSelectedRows;
    }

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
          name={`c_${formNumber}-${colRID}`}
          inputClassName={`c_${formNumber}-${makeSafeIdAttr(colName)}`}
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
          foreignKeyCallbacks={tempForeignKeyCallbacks}
        />
        {typeof formIndex === 'number' && formIndex in showPermissionError &&
          <div className={`column-permission-warning column-permission-warning-${safeClassNameId}`}>{permissionError}</div>
        }
      </>
    );
  };

  return (
    <div className={`form-inputs-row${isActiveForm ? ' highlighted-row' : ''}${hasInlineComment ? ' with-inline-tooltip' : ''}`} ref={container}>
      {hasInlineComment &&
        <div className='inline-comment-row'>
          <div className='inline-tooltip inline-tooltip-sm'><DisplayCommentValue comment={columnModel.column.comment} /></div>
          <hr />
        </div>
      }
      <div className='inputs-row' ref={formsRef}>
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
      {isActiveForm &&
        <MultiFormInputRow
          activeForms={activeForms}
          setActiveForm={setActiveForm}
          columnModelIndex={columnModelIndex}
          toggleActiveMultiForm={toggleActiveMultiForm}
        />
      }
    </div>
  );
};

export default memo(FormRow);
