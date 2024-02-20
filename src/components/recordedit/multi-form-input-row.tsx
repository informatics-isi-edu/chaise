// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { appModes, MULTI_FORM_INPUT_FORM_VALUE } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { copyOrClearValue } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { createForeignKeyReference } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { asyncTimeout } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

type MultiFormInputRowProps = {
  /**
  * The column index.
  */
  columnModelIndex: number;
  /**
  * The forms which are active.
  */
  activeForms?: number[];
  /**
  * The state function to set active forms.
  */
  setActiveForm?: any;
  /* change the active select all */
  toggleActiveMultiForm: (colIndex: number) => void;
};

const MultiFormInputRow = ({
  columnModelIndex,
  activeForms,
  setActiveForm,
  toggleActiveMultiForm
}: MultiFormInputRowProps) => {
  const {
    columnModels,
    forms,
    reference,
    waitingForForeignKeyData,
    foreignKeyData,
    appMode,
    canUpdateValues,
    setShowApplyAllSpinner,
    logRecordeditClientAction,
  } = useRecordedit();

  const cm = columnModels[columnModelIndex];
  const isTextArea = cm.inputType === 'markdown' || cm.inputType === 'longtext';
  const isForeignKey = cm.column.isForeignKey;

  const colName = cm.column.name;
  const inputName = `${MULTI_FORM_INPUT_FORM_VALUE}-${colName}`;

  const { formState: { errors }, getValues, setValue, setError, clearErrors } = useFormContext();
  // Since this is used as part of a useEffect, useWatch hook needs to be used to keep the value updated to trigger the useEffect
  const selectAllFieldValue = useWatch({ name: inputName });

  const [isEmpty, setIsEmpty] = useState<boolean>(true);

  /**
   *  This is to set select all checkbox state
   */
  const [allFormsAreActive, setAllFormsAreActive] = useState<boolean>(false);
  // 0 means don't call function
  // -1 means call applyValueToAll
  // 1 means call clearAllValues
  const [allValuesEffect, setAllValuesEffect] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const upperRowRef = useRef<HTMLDivElement>(null);

  /**
   * This will add two resize sensors:
   *
   * 1 We are having a resize sensor on input area. This is to reverse the flex-direction of upper row once it starts overlapping
   * We chose 400, based on manual testing and thats when the buttons and checkbox container starts overlapping.
   * Since we want to reduce the width of text area till min-width 250px we are moving the buttons and checkbox container
   * to two rows with button container on top.
   *
   * 2. please refer to the updateTextareaWidth comment. in summary, we have to use JavaScript to set the width of textarea
   *    to be the same as the parent. 100% won't work. without this the textarea stays small even if there are enough space
   *    for it to expand.
  */
  useLayoutEffect(() => {
    if (!inputRef.current || !containerRef.current) return;
    const resizeSensors: ResizeSensor[] = [];

    resizeSensors.push(new ResizeSensor(inputRef.current, () => {
      if (!upperRowRef.current) return;
      const upperRowWidth = upperRowRef.current.getBoundingClientRect().width;
      if (upperRowWidth < 400) {
        upperRowRef.current.style.flexDirection = 'column-reverse'
      } else {
        upperRowRef.current.style.flexDirection = 'row'
      }
    }));

    if (isTextArea) {
      // Initial update
      updateTextareaWidth();
      let cachedMultiRowForm = containerRef.current.offsetWidth;
      resizeSensors.push(new ResizeSensor(containerRef.current, () => {
        // only call when the width changes (resizeSensor calls this on height change too
        if (!containerRef.current || cachedMultiRowForm === containerRef.current.offsetWidth) return;

        cachedMultiRowForm = containerRef.current.offsetWidth;
        updateTextareaWidth();
      }));
    }

    return () => {
      resizeSensors?.forEach((rs) => !!rs && rs.detach());
    };
  }, []);

  /**
   * set the first form as active on load
   */
  useEffect(() => {
    if (activeForms?.length === 0) {
      setActiveForm([forms[0]]);
    }
  }, []);

  /**
   * set the indeterminate checkbox when forms are individually selected
   * and selected forms length is less than total forms length
  */
  useEffect(() => {
    if (inputRef && inputRef.current && activeForms) {
      (inputRef.current as HTMLInputElement).indeterminate =
        activeForms?.length > 0
          ? activeForms?.length < forms.length
            ? true
            : false
          : false;
      setAllFormsAreActive(activeForms?.length === forms.length);
    }
  }, [activeForms]);

  /**
   * if the selected value is empty, we should disable the apply-all
   * useEffect allows us to look for the value and only rerender when we have to.
   */
  useEffect(() => {
    // see if the input is empty
    let temp = !Boolean(selectAllFieldValue);
    if (cm.column.type.name === 'boolean') {
      temp = typeof selectAllFieldValue !== 'boolean';
    }

    if (isEmpty !== temp) {
      setIsEmpty(temp);
    }

  }, [selectAllFieldValue, isEmpty]);

  /**
   * This is to set the width of text area as the width of multi-form-input-row. We have to involve javascript as
   * the immidiate parent center-align we cant set a width to it as 100%. So we have to involve JS to set the width of textarea
   * to the next immediate parent width which is multi-form-input-row.
   * We choose 1800 as it matches with css rule given in multi-form-input-row and multi-form-input. Beyond 1800 we are
   * setting a width for textarea as 1200 and making it center aligned. We choose 1200 as we dont want input to span
   * across container for higher resolutions(i.e beyond 1800)
  */
  const updateTextareaWidth = () => {
    const textarea = document.querySelector('.input-switch-multi-textarea') as HTMLElement;
    const nonScrollableDiv = document.querySelector('.multi-form-input-row') as HTMLElement;
    if (textarea) {
      if (window.innerWidth < 1800) {
        const newContainerWidth = nonScrollableDiv.offsetWidth;
        textarea.style.width = `${newContainerWidth}px`;
      } else {
        textarea.style.width = '1200px';
      }
    }
  };

  // ------------------------ callbacks -----------------------------------//

  useEffect(() => {
    // return if 0, continue if -1 or 1
    if (!allValuesEffect) return;

    setAllValuesEffect(0);

    // without delaying this function call, the spinner would show briefly
    // after the app appeared to freeze instead of before the "appeared freeze"
    setTimeout(() => {
      // if 1/true, clear all values
      // if -1/false, apply the value in the input to all selected forms
      const isClear = (allValuesEffect === 1)

      logRecordeditClientAction(
        isClear ? LogActions.SET_ALL_CLEAR : LogActions.SET_ALL_APPLY,
        cm.logStackPathChild,
        cm.logStackNode,
        undefined,
        cm.column.reference ? cm.column.reference : undefined
      );

      setValueForAllInputs(isClear);
    }, 0)

  }, [allValuesEffect])

  const closeMultiForm = () => {
    logRecordeditClientAction(
      LogActions.SET_ALL_CANCEL,
      cm.logStackPathChild,
      cm.logStackNode,
      undefined,
      cm.column.reference ? cm.column.reference : undefined
    );

    toggleActiveMultiForm(columnModelIndex);
  };

  // Call back for select all checkbox to toggle all forms as selected and unselected
  const onSelectChange = () => {
    // setShowTooltip(false);
    if (!allFormsAreActive) {
      setActiveForm(forms);
    } else {
      setActiveForm([]);
    }
    setAllFormsAreActive(!allFormsAreActive);
  };

  /**
   * The callback used by functions above to set the values of the row.
   * if clearValue is true, it will use emtpy value, otherwise it will copy the multi-form-input input value
   */
  const setValueForAllInputs = (clearValue?: boolean) => {
    const updateValues = clearValue ? '' : selectAllFieldValue;

    activeForms?.forEach((formValue: number) => {
      // ignore the ones that cannot be updated
      if (appMode === appModes.EDIT && canUpdateValues && !canUpdateValues[`${formValue}-${cm.column.name}`]) {
        return;
      }

      copyOrClearValue(
        cm,
        getValues(),
        foreignKeyData.current,
        formValue,
        MULTI_FORM_INPUT_FORM_VALUE,
        clearValue,
        false,
        setValue
      )
    });

    setShowApplyAllSpinner(false);
  };

  /**
   * if the fk input has a domain-filter, we have to make sure it's identical
   * for all the selected rows. otherwise we won't be able to offer this feature.
   */
  const checkForeignKeyDomainFilter = async () => {
    let domainFilterFormNumber = activeForms && activeForms.length > 0 ? activeForms[0] : 1;

    if (!cm.hasDomainFilter) {
      return { allowed: true, domainFilterFormNumber };
    }

    // remove the existing error
    clearErrors(inputName);

    if (!activeForms || activeForms.length < 2) {
      return { allowed: true, domainFilterFormNumber }
    }

    // make sure the computed references are the same
    let computedRefURI = '';
    const areAllSame = activeForms.every((formNumber: number, formIndex: number) => {
      const ref = createForeignKeyReference(cm.column, reference, formNumber, foreignKeyData, getValues);
      if (formIndex === 0) {
        domainFilterFormNumber = formNumber;
        computedRefURI = ref.uri;
      } else {
        return computedRefURI === ref.uri;
      }
      return true;
    });

    // some domain-filters are different, so we cannot proceed
    if (areAllSame) {
      return { allowed: true, domainFilterFormNumber };
    }

    const usedCols = cm.column.domainFilterUsedColumns;

    let errorMessage = '';
    if (Array.isArray(usedCols) && usedCols.length > 0) {
      const usedColsSummary = usedCols.reduce((res, curr, currIndex, arr) => {
        res += `<code>${curr.displayname.value}</code>`;
        if (currIndex < arr.length - 1) {
          if (currIndex !== arr.length - 2) {
            res += ', ';
          } else {
            res += ((arr.length !== 2) ? ',' : '') + ' and ';
          }
        }
        return res;
      }, '');
      errorMessage = `This feature is constrained by ${usedColsSummary}.`;
    } else {
      errorMessage = `This feature is constrained by other fields (hint: <code>${cm.column.domainFilterRawString}</code>).`;
    }
    errorMessage += ` Make sure all the records you want to set <code>${cm.column.displayname.value}</code> for`;
    errorMessage += ', have the same values for those fields.';
    errorMessage += ' Try again after upadting those fields.';

    /**
     * if we should show an error, just add a dummy wait time so the previous
     * error is cleared and then we show it again.
     */
    await asyncTimeout(20);

    // calling set-value to "touch" the input. otherwise the error won't show up.
    setValue(inputName, '', { shouldTouch: true });
    setError(inputName, { type: 'custom-domain-filter-error', message: errorMessage });

    return { allowed: false };
  };

  // -------------------------- render logic ---------------------- //

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
    <div className='multi-form-input-row match-entity-value' ref={containerRef}>
      <div className={`center-align ${isTextArea ? 'center-align-textarea' : ''}`}>
        <div className='multi-form-upper-row' ref={upperRowRef}>
          <div className='multi-form-input-checkbox-container'>
            <ChaiseTooltip
              placement='bottom-start'
              tooltip={!allFormsAreActive ? 'Select all records.' : 'Clear all selection'}
              dynamicTooltipString
            >
              <span className='chaise-checkbox multi-form-input-checkbox'>
                <input
                  ref={inputRef}
                  className={'checkbox-input' + (allFormsAreActive ? ' checked' : '')}
                  type='checkbox'
                  id='checkbox-input'
                  checked={allFormsAreActive}
                  disabled={false}
                  onChange={onSelectChange}
                />
                <label className='checkbox-label' id='checkbox-label' onClick={onSelectChange}>
                  {activeForms && activeForms?.length > 0
                    ? `${activeForms?.length} of ${forms.length} selected records`
                    : 'Select All'}
                </label>
              </span>
            </ChaiseTooltip>
            <ChaiseTooltip
              placement='bottom-start'
              tooltip={renderHelpTooltip()}
            >
              <button
                type='button'
                className='multi-form-input-how-to chaise-btn chaise-btn-tertiary chaise-btn-sm'
              >
                <span className='chaise-icon chaise-info'></span>
              </button>
            </ChaiseTooltip>
          </div>

          <div className='multi-form-input-button-container'>
            <div className='chaise-btn-group'>
              <ChaiseTooltip
                tooltip='Apply the value to selected records.'
                placement='bottom'
              >
                <button
                  type='button'
                  className='multi-form-input-apply-btn chaise-btn chaise-btn-secondary'
                  onClick={() => {
                    setShowApplyAllSpinner(true);
                    setAllValuesEffect(-1);
                  }}
                  // we should disable it when its empty or has error
                  // NOTE I couldn't use `errors` in the watch above since it was always one cycle behind.
                  disabled={
                    (errors && inputName in errors) || activeForms?.length === 0 || isEmpty
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
                  className='multi-form-input-clear-btn chaise-btn chaise-btn-secondary'
                  onClick={() => {
                    setShowApplyAllSpinner(true);
                    setAllValuesEffect(1);
                  }}
                  disabled={activeForms?.length === 0}
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
                  className='multi-form-input-close-btn chaise-btn chaise-btn-secondary'
                  onClick={closeMultiForm}
                >
                  Close
                </button>
              </ChaiseTooltip>
            </div>
          </div>
        </div>
        <div
          className={`multi-form-input ${isTextArea ? 'multi-form-input-textarea' : ''}`}>
          <InputSwitch
            key={colName}
            displayErrors
            displayExtraDateTimeButtons
            displayDateTimeLabels
            disableInput={false}
            requiredInput={false}
            name={inputName}
            inputClasses={`${isTextArea ? 'input-switch-multi-textarea' : ''}`}
            type={cm.inputType}
            classes='column-cell-input'
            columnModel={cm}
            appMode={appMode}
            formNumber={MULTI_FORM_INPUT_FORM_VALUE}
            parentReference={reference}
            foreignKeyData={foreignKeyData}
            waitingForForeignKeyData={waitingForForeignKeyData}
            foreignKeyCallbacks={isForeignKey ? { onAttemptToChange: checkForeignKeyDomainFilter } : undefined}
          />
        </div>
      </div>
    </div >
  );
};

export default MultiFormInputRow;
