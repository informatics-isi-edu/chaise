// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, RecordeditColumnModel, SELECT_ALL_INPUT_FORM_VALUE } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { getDisabledInputValue, replaceNullOrUndefined } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { copyOrClearValue, getColumnModelLogAction, getColumnModelLogStack } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';

const FormContainer = (): JSX.Element => {

  const {
    onSubmitValid, onSubmitInvalid, forms, removeForm, columnModels, appMode, tuples
  } = useRecordedit();

  const { handleSubmit } = useFormContext();
  return (
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
    forms, appMode, reference, columnModels, tuples, activeSelectAll, toggleActiveSelectAll,
    canUpdateValues, columnPermissionErrors, foreignKeyData, waitingForForeignKeyData,
  } = useRecordedit();

  const methods = useFormContext();

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
    const sensor = new ResizeSensor(container.current as Element, () => {
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

  const applyValueToAll = () => {
    const cm = columnModels[columnModelIndex];

    const defaultLogInfo = cm.column.reference ? cm.column.reference.defaultLogInfo : reference.defaultLogInfo;
    // TODO parent log obj
    LogService.logClientAction({
      action: getColumnModelLogAction(LogActions.SET_ALL_APPLY, cm, null),
      stack: getColumnModelLogStack(cm, null)
    }, defaultLogInfo);

    setValueForAllInputs();
  };

  const clearAllValues = () => {
    const cm = columnModels[columnModelIndex];

    const defaultLogInfo = (cm.column.reference ? cm.column.reference.defaultLogInfo : reference.defaultLogInfo);
    // TODO parent log obj
    LogService.logClientAction({
      action: getColumnModelLogAction(LogActions.SET_ALL_CLEAR, cm, null),
      stack: getColumnModelLogStack(cm, null)
    }, defaultLogInfo);

    setValueForAllInputs(true);
  };

  const closeSelectAll = () => {
    // TODO client log
    // var defaultLogInfo = (model.column.reference ? model.column.reference.defaultLogInfo : $rootScope.reference.defaultLogInfo);
    // logService.logClientAction({
    //     action: recordCreate.getColumnModelLogAction(logService.logActions.SET_ALL_CANCEL, model),
    //     stack: recordCreate.getColumnModelLogStack(model)
    // }, defaultLogInfo);

    toggleActiveSelectAll(columnModelIndex);
  };

  // ------------------------ helper functions ----------------------------//
  /**
   * this code is similar to recordedit.tsx:291 (callAddForm)
   * TODO can be refactored into one function
   */
  const setValueForAllInputs = (clearValue?: boolean) => {
    const cm = columnModels[columnModelIndex];

    forms.forEach((formValue: number) => {
      // ignore the ones that cannot be updated
      if (appMode === appModes.EDIT && canUpdateValues && !canUpdateValues[`${formValue}-${cm.column.name}`]) {
        return;
      }
      methods.reset(copyOrClearValue(cm, methods.getValues(), foreignKeyData.current, formValue, SELECT_ALL_INPUT_FORM_VALUE, clearValue));
    });
  };

  // -------------------------- render logic ---------------------- //

  const showSelectAll = activeSelectAll === columnModelIndex;
  const columnModel = columnModels[columnModelIndex];

  /**
 * Return `disabled` if,
 *  - columnModel is marked as disabled
 *  - based on dynamic ACLs the column cannot be updated (based on canUpdateValues)
 *  - TODO show all
 * @param formNumber
 * @param columnModel
 * @param canUpdateValues
 * @returns
 */
  const getInputTypeOrDisabled = (formNumber?: number, isSelectAllInput?: boolean): string => {
    if (isSelectAllInput) {
      return columnModel.inputType;
    }

    if (columnModel.isDisabled || showSelectAll) {
      return 'disabled';
    }

    if (typeof formNumber === 'number') {
      const valName = `${formNumber}-${columnModel.column.name}`;
      if (canUpdateValues && valName in canUpdateValues && canUpdateValues[valName] === false) {
        return 'disabled';
      }
    }

    return columnModel.inputType;
  }

  const renderInput = (formNumber: number, formIndex?: number) => {

    const colName = columnModel.column.name;

    const inputType = getInputTypeOrDisabled(formNumber, formNumber === SELECT_ALL_INPUT_FORM_VALUE);
    let placeholder = '';
    let permissionError = '';
    if (inputType === 'disabled') {
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

    return (<>
      {permissionError && typeof formIndex === 'number' &&
        <div className='column-permission-overlay' onClick={() => onPermissionClick(formIndex)} />
      }
      <InputSwitch
        key={colName}
        displayErrors={true}
        name={`${formNumber}-${colName}`}
        type={inputType}
        classes='column-cell-input'
        placeholder={placeholder}
        // styles={{ 'height': heightparam }}
        columnModel={columnModel}
        appMode={appMode}
        formNumber={formNumber}
        parentReference={reference}
        parentTuple={appMode === appModes.EDIT && typeof formIndex === 'number' ? tuples[formIndex] : undefined}
        foreignKeyData={foreignKeyData}
        waitingForForeignKeyData={waitingForForeignKeyData}
      />
      {typeof formIndex === 'number' && formIndex in showPermissionError &&
        <div className='column-permission-warning'>{permissionError}</div>
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
      {showSelectAll &&
        <div className='select-all-row match-entity-value'>
          <div className='select-all-text'>Set value for all records: </div>
          <div className='select-all-input'>
            {renderInput(SELECT_ALL_INPUT_FORM_VALUE)}
          </div>
          <div className='chaise-btn-group select-all-buttons'>
            <ChaiseTooltip tooltip='Click to apply the value to all records.' placement='bottom'>
              <button type='button' className='chaise-btn chaise-btn-secondary' onClick={applyValueToAll}>
                Apply All
              </button>
            </ChaiseTooltip>
            <ChaiseTooltip tooltip='Click to clear all values for all records.' placement='bottom'>
              <button type='button' className='chaise-btn chaise-btn-secondary' onClick={clearAllValues}>
                Clear All
              </button>
            </ChaiseTooltip>
            <ChaiseTooltip tooltip='Click to close the set all input.' placement='bottom'>
              <button type='button' className='chaise-btn chaise-btn-secondary' onClick={closeSelectAll}>
                Close
              </button>
            </ChaiseTooltip>
          </div>
        </div>
      }
    </div>
  )

};

export default FormContainer;
