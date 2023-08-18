// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
// hooks
import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { appModes, SELECT_ALL_INPUT_FORM_VALUE } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { copyOrClearValue } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

type FormRowProps = {
    columnModelIndex: number;
    activeForms?: any[];
    setActiveForm?: any;
};

const SelectAllRow = ({
    columnModelIndex,
    activeForms,
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
    const ref = useRef(null);
    const [isEmpty, setIsEmpty] = useState(true);

    // This is to set select all checkbox state
    const [selectAll, setSelectAll] = useState(false);

    // This is to toggle the visibility of tooltip on checkbox container. The tooltip should disappear once checkbox container is clicked.
    const [showTooltip, setShowTooltip] = useState(false);

    // This is to set if there is a change in the width of select all area on resize and zoom
    const [selectAllWidthChanged, setSelectAllWidthChaged] = useState(0);

    // This useeffect is to set the first form as active on load
    useEffect(() => {
        if (activeForms?.length === 0) {
            setActiveForm([forms[0]]);
        }
    }, []);

    /* This useffect is to set the indeterminate checkbox when forms are individually selected
     *  and selected forms length is less than total forms length
     */
    useEffect(() => {
        if (ref && ref.current && activeForms) {
            (ref.current as HTMLInputElement).indeterminate =
                activeForms?.length > 0
                    ? activeForms?.length < forms.length
                        ? true
                        : false
                    : false;
            setSelectAll(activeForms?.length === forms.length);
        }
    }, [activeForms]);

    // useEffect to call update only when there is a change in the width of select-all-row to update textarea width
    useEffect(() => {
        updateTextareaWidth();
    }, [selectAllWidthChanged]);

    /* useEffect to have a resize sensor to change the direction of upper-row when width of container is less than 400.
       We chose 400, based on manual testing and thats when the buttons and checbox container starts overlapping.
       Since we want to reduce the width of text area till min-width 250px we are moving the buttons and checbox container
       to two rows with button container on top.
    */
    useEffect(() => {

        const inputDiv = document.querySelector('.select-all-input') as HTMLElement;

        const mainResizeSensor = new ResizeSensor(inputDiv,
            () => {
                const upperRow = document.querySelector('.select-upper-row') as HTMLElement;
                const upperRowWidth = upperRow?.getBoundingClientRect().width;
                if (upperRow && upperRowWidth < 400) {
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

        const selectAllDiv = document.querySelector('.select-all-row') as HTMLElement;
        setSelectAllWidthChaged(selectAllDiv.offsetWidth)
        // Initial update
        updateTextareaWidth();

        const mainResizeSensor = new ResizeSensor(selectAllDiv,
            () => {
                const newContainerWidth = selectAllDiv.offsetWidth;
                setSelectAllWidthChaged(newContainerWidth)
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
        if (!selectAll) {
            setActiveForm(forms);
        } else {
            setActiveForm([]);
        }
        setSelectAll(!selectAll);
    };

    /**
     * The callback used by functions above to set the values of the row.
     * if clearValue is true, it will use emtpy value, otherwise it will copy the select-all input value
     */
    const setValueForAllInputs = (clearValue?: boolean) => {
        const cm = columnModels[columnModelIndex];

        activeForms?.forEach((formValue: number) => {
            // ignore the ones that cannot be updated
            if (appMode === appModes.EDIT && canUpdateValues && !canUpdateValues[`${formValue}-${cm.column.name}`]) {
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
                    <div className='select-all-checkbox-container'>
                        <ChaiseTooltip
                            placement='bottom-start'
                            show={showTooltip}
                            tooltip={
                                !selectAll ? 'Select all records.' : 'Clear all selection'
                            }
                            onToggle={(show) => setShowTooltip(show)}
                        >
                            <span className='chaise-checkbox select-all-checkbox'>
                                <input
                                    ref={ref}
                                    className={'checkbox-input' + (selectAll ? ' checked' : '')}
                                    type='checkbox'
                                    checked={selectAll}
                                    disabled={false}
                                    onChange={onSelectChange}
                                />

                                <span className='checkbox-label' onClick={onSelectChange}>
                                    {activeForms && activeForms?.length > 0
                                        ? `${activeForms?.length} of ${forms.length} selected records`
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

                    <div className='select-all-button-container'>
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
                                        (errors && inputName in errors) || activeForms?.length === 0
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
                        ? 'select-all-input-textarea'
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

export default SelectAllRow;