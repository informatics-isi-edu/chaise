// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import SelectAllRow from '@isrd-isi-edu/chaise/src/components/recordedit/select-all-row';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, SELECT_ALL_INPUT_FORM_VALUE } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { getDisabledInputValue } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

type FormRowProps = {
    columnModelIndex: number;
    removeFormIndex?: number;
    removeClicked?: boolean;
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
        activeSelectAll,
        canUpdateValues,
        columnPermissionErrors,
        foreignKeyData,
        waitingForForeignKeyData,
        getRecordeditLogStack,
        getRecordeditLogAction,
    } = useRecordedit();

    // This state variable is to set the form as active when its selected
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
     * make sure the column names (key-column.tsx) have the same height as FormRow
     */
    useLayoutEffect(() => {
        if (!container || !container.current) return;

        let cachedHeight = -1;
        const sensor = new ResizeSensor(
            container.current as Element,
            (dimension) => {
                const newHeight = container.current?.getBoundingClientRect().height;
                if (newHeight === undefined || newHeight === cachedHeight || !container.current) return;
                cachedHeight = newHeight;
                const header = document.querySelector<HTMLElement>(`.entity-key.entity-key-${columnModelIndex}`);
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
            if (canUpdateValues && valName in canUpdateValues && canUpdateValues[valName] === false) {
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
        else if (appMode === appModes.EDIT && isObjectAndKeyDefined(columnPermissionErrors, colName)) {
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
                        className={`${showSelectAll ? 'form-overlay' : ''} entity-value ${activeForms.includes(formNumber) && showSelectAll
                            ? 'entity-active'
                            : ''
                            }`}
                        onClick={() => {
                            // I couldn’t test that scenario, since on load we’re removing the forms that user cannot edit,
                            if (appMode === appModes.EDIT && canUpdateValues && !canUpdateValues[`${formNumber}-${cm.column.name}`]) {
                                return;
                            }
                            if (showSelectAll) {
                                handleFormClick(formNumber);
                            }
                        }}
                    >
                        {renderInput(formNumber, formIndex)}
                    </div>
                ))}
            </div>
            {showSelectAll && (
                <SelectAllRow
                    activeForms={activeForms}
                    setActiveForm={setActiveForm}
                    columnModelIndex={columnModelIndex}
                />
            )}
        </div>
    );
};

export default FormRow;