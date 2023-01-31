// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/modals/recordset-modal';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import { useEffect, useState } from 'react';
import { useFormContext, useController } from 'react-hook-form';

// models
import { appModes, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';
import {
  RecordsetConfig, RecordsetDisplayMode,
  RecordsetSelectMode, SelectedRow, RecordsetProps
} from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogStackPaths } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { ERROR_MESSAGES } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { RECORDSET_DEAFULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getColumnModelLogStack, populateSubmissionRow } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

type ForeignkeyFieldProps = {
  /**
   *  the name of the field
   */
  name: string,
  /**
  * placeholder text
  */
  placeholder?: string,
  /**
  * classes for styling the input element
  */
  classes?: string,
  inputClasses?: string,
  containerClasses?: string,
  /**
  * classes for styling the clear button
  */
  clearClasses?: string
  /**
  * flag for disabling the input
  */
  disableInput?: boolean,
  /**
  * flag to show error below the input switch component
  */
  displayErrors?: boolean,
  value: string,
  styles?: any,
  /**
  * the handler function called on input change
  */
  onFieldChange?: ((value: string) => void),
  /**
   * The column model representing this field in the form.
   */
  columnModel: RecordeditColumnModel,
  /**
   * the mode of the app
   */
  appMode?: string,
  /**
   * the "formNumber" that this input belongs to
   */
  formNumber?: number,
  /**
   * The reference that is used for the form
   */
  parentReference?: any,
  /**
   * The tuple representing the row.
   * Available only in edit mode.
   */
  parentTuple?: any,
  /**
   * the ref used to capture the foreignkey data
   */
  foreignKeyData?: React.MutableRefObject<any>,
  /**
   * whether we're still waiting for foreignkey data
   */
  waitingForForeignKeyData?: boolean,
  // TODO should be used by viewer app
  // (types should be modified based on viewer app changes)
  // popupSelectCallbacks?: {
  //   getDisabledTuples?: any,
  //   onSelectedRowsChanged?: any
  // }
};

const ForeignkeyField = ({
  name,
  placeholder,
  classes,
  inputClasses,
  clearClasses,
  disableInput,
  displayErrors,
  value,
  containerClasses,
  styles,
  onFieldChange,
  columnModel,
  appMode,
  formNumber,
  parentReference,
  parentTuple,
  foreignKeyData,
  waitingForForeignKeyData,
}: ForeignkeyFieldProps): JSX.Element => {

  const usedFormNumber = typeof formNumber === 'number' ? formNumber : 1;

  const { setValue, control, clearErrors, getValues } = useFormContext();

  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordsetProps | null>(null);

  const registerOptions = {
    /**
     * TODO this is not working properly. while the formInput.formState is reporting the
     * error, the formInput.fieldState is not. we need to fix this issue for all the
     * inputs that we have. none of them are properly setting this boolean.
     */
    required: columnModel?.isRequired ? ERROR_MESSAGES.REQUIRED : false,
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const field = formInput?.field;

  const fieldValue = field?.value;

  const fieldState = formInput?.fieldState;

  const [showClear, setShowClear] = useState<boolean>(typeof fieldValue !== 'boolean');

  const { error, isTouched } = fieldState;

  /**
   * - while loading the foreignkey data, users cannot interact with fks with defaulr or domain-filter.
   * - we don't need to show spinner for prefilled fks since the inputs are already disabled
   */
  const showSpinner = waitingForForeignKeyData && (columnModel.hasDomainFilter ||
    (appMode !== appModes.EDIT && columnModel.column.default !== null));

  const clearInput = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setValue(name, '');
    // make sure the underlying raw columns are also emptied.
    columnModel.column.foreignKey.colset.columns.forEach((col: any) => {
      setValue(`${usedFormNumber}-${col.name}`, '');
    });
    clearErrors(name);
  }

  useEffect(() => {
    if (onFieldChange) {
      onFieldChange(fieldValue);
    }
    if (showClear != Boolean(fieldValue)) {
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);

  useEffect(() => {
    if (value === undefined) return;
    setValue(name, value);
  }, [value]);

  const handleChange = (v: any) => {
    field.onChange(v);
    field.onBlur();
  };

  useEffect(() => {
    fireCustomEvent(
      'input-switch-error-update',
      `.input-switch-container-${makeSafeIdAttr(name)}`,
      { inputFieldName: name, msgCleared: !Boolean(error?.message) }
    );
  }, [error?.message]);

  const openRecordsetModal = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const recordsetConfig: RecordsetConfig = {
      viewable: false,
      editable: false,
      deletable: false,
      sortable: true,
      selectMode: RecordsetSelectMode.SINGLE_SELECT,
      showFaceting: true,
      disableFaceting: false,
      displayMode: (appMode === appModes.EDIT) ? RecordsetDisplayMode.FK_POPUP_EDIT : RecordsetDisplayMode.FK_POPUP_CREATE,
    };

    const andFilters: any = [];
    // loop through all columns that make up the key information for the association with the leaf table and create non-null filters
    // this is to ensure the selected row has a value for the foreignkey
    columnModel.column.foreignKey.key.colset.columns.forEach((col: any) => {
      andFilters.push({ source: col.name, hidden: true, not_null: true });
    });

    // domain-filter support
    const linkedData = foreignKeyData && foreignKeyData.current ? foreignKeyData.current[name] : {};
    const submissionRow = populateSubmissionRow(parentReference, usedFormNumber, getValues());
    const ref = columnModel.column.filteredRef(submissionRow, linkedData).addFacets(andFilters);

    setRecordsetModalProps({
      parentReference,
      parentTuple,
      initialReference: ref.contextualize.compactSelectForeignKey,
      initialPageLimit: RECORDSET_DEAFULT_PAGE_SIZE,
      config: recordsetConfig,
      logInfo: {
        logObject: null,
        // TODO parent log stack
        logStack: getColumnModelLogStack(columnModel, null),
        // TODO parent log stack path
        logStackPath: LogService.getStackPath(null, LogStackPaths.FOREIGN_KEY_POPUP)
      }
    });
  };

  const hideRecordsetModal = () => {
    setRecordsetModalProps(null);
  };

  const onDataSelected = (selectedRows: SelectedRow[]) => {
    // close the modal
    hideRecordsetModal();

    const selectedRow = selectedRows[0];

    // this is just to hide the ts errors and shouldn't happen
    if (!selectedRow.data) {
      $log.error('the selected row doesn\'t have data!');
      return;
    }

    // TODO capture the foreignKeyData
    if (foreignKeyData && foreignKeyData.current) {
      foreignKeyData.current[name] = selectedRow.data;
    }

    // find the raw value of the fk columns that correspond to the selected row
    // since we've already added a not-null hidden filter, the values will be not-null.
    columnModel.column.foreignKey.colset.columns.forEach((col: any) => {
      const referencedCol = columnModel.column.foreignKey.mapping.get(col);
      // TODO maybe we want to formalize this way of naming the fields? like a function or something
      setValue(`${usedFormNumber}-${col.name}`, selectedRow.data[referencedCol.name]);
    });

    // for now this is just changing the displayed tuple displayname
    handleChange(selectedRow.displayname.value);
  }

  return (
    <div className={`${containerClasses} input-switch-foreignkey input-switch-container-${makeSafeIdAttr(name)}`} style={styles}>
      {showSpinner &&
        <div className='column-cell-spinner-container'>
          <div className='column-cell-spinner-backdrop'></div>
          <Spinner animation='border' size='sm' />
        </div>
      }
      <div className='chaise-input-group' onClick={openRecordsetModal}>
        <div className={`chaise-input-control has-feedback ${classes} ${disableInput ? ' input-disabled' : ''}`}>
          {isStringAndNotEmpty(fieldValue) ?
            <DisplayValue value={{ value: fieldValue, isHTML: true }} /> :
            <span className='chaise-input-placeholder'>{placeholder ? placeholder : 'Select a value'}</span>
          }
          <ClearInputBtn btnClassName={`${clearClasses} input-switch-clear`} clickCallback={clearInput} show={showClear} />
        </div>
        <div className='chaise-input-group-append'>
          <button className='chaise-btn chaise-btn-primary' role='button' type='button'>
            <span className='chaise-btn-icon fa-solid fa-chevron-down' />
          </button>
        </div>
      </div>
      <input className={inputClasses} {...field} type='hidden' />
      {displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span>}
      {
        recordsetModalProps &&
        <RecordsetModal
          modalClassName='foreignkey-popup'
          recordsetProps={recordsetModalProps}
          onClose={hideRecordsetModal}
          onSubmit={onDataSelected}
          displayname={columnModel?.column.displayname}
        />
      }
    </div >
  );
};

export default ForeignkeyField;
