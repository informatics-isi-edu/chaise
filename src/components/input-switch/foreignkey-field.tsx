// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/modals/recordset-modal';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

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
import { RECORDSET_DEAFULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import { populateSubmissionRow } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';

type ForeignkeyFieldProps = InputFieldProps & {
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
   * the log stack of the form
   */
  parentLogStack?: any,
  /**
   * the log stack path of the form
   */
  parentLogStackPath?: string,
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

const ForeignkeyField = (props: ForeignkeyFieldProps): JSX.Element => {

  const usedFormNumber = typeof props.formNumber === 'number' ? props.formNumber : 1;

  const { setValue, getValues } = useFormContext();

  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordsetProps | null>(null);

  /**
   * - while loading the foreignkey data, users cannot interact with fks with defaulr or domain-filter.
   * - we don't need to show spinner for prefilled fks since the inputs are already disabled
   */
  const showSpinner = props.waitingForForeignKeyData && (props.columnModel.hasDomainFilter ||
    (props.appMode !== appModes.EDIT && props.columnModel.column.default !== null));

  /**
   * make sure the underlying raw columns as well as foreignkey data are also emptied.
   */
  const onClear = () => {
    // clear the raw values
    props.columnModel.column.foreignKey.colset.columns.forEach((col: any) => {
      setValue(`${usedFormNumber}-${col.name}`, '');
    });

    // clear the foreignkey data
    if (props.foreignKeyData && props.foreignKeyData.current) {
      props.foreignKeyData.current[props.name] = {};
    }

    // the input-field will take care of clearing the displayed rowname.
  }

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
      displayMode: (props.appMode === appModes.EDIT) ? RecordsetDisplayMode.FK_POPUP_EDIT : RecordsetDisplayMode.FK_POPUP_CREATE,
    };

    const andFilters: any = [];
    // loop through all columns that make up the key information for the association with the leaf table and create non-null filters
    // this is to ensure the selected row has a value for the foreignkey
    props.columnModel.column.foreignKey.key.colset.columns.forEach((col: any) => {
      andFilters.push({ source: col.name, hidden: true, not_null: true });
    });

    /**
     * convert the foreignKeyData to something that ermrestjs expects.
     * foreignKeyData currently is a flat list of object with `${formNumber}-{colName}` keys.
     * the following will extract the foreignKeyData of the row that we need.
     */
    const linkedData : any = {};
    if (props.foreignKeyData && props.foreignKeyData.current) {
      props.parentReference.activeList.allOutBounds.forEach((col: any) => {
        const k =  `${usedFormNumber}-${col.name}`;
        if (k in props.foreignKeyData?.current) {
          linkedData[col.name] = props.foreignKeyData?.current[k];
        }
      });
    }

    const submissionRow = populateSubmissionRow(props.parentReference, usedFormNumber, getValues());
    const ref = props.columnModel.column.filteredRef(submissionRow, linkedData).addFacets(andFilters);

    setRecordsetModalProps({
      parentReference: props.parentReference,
      parentTuple: props.parentTuple,
      initialReference: ref.contextualize.compactSelectForeignKey,
      initialPageLimit: RECORDSET_DEAFULT_PAGE_SIZE,
      config: recordsetConfig,
      logInfo: {
        logStack: LogService.addExtraInfoToStack(LogService.getStackObject(props.columnModel.logStackNode, props.parentLogStack), { picker: 1 }),
        logStackPath: LogService.getStackPath(props.parentLogStackPath ? props.parentLogStackPath : null, LogStackPaths.FOREIGN_KEY_POPUP)
      }
    });
  };

  const hideRecordsetModal = () => {
    setRecordsetModalProps(null);
  };

  const onDataSelected = (onChange: any) => {
    return (selectedRows: SelectedRow[]) => {
      // close the modal
      hideRecordsetModal();

      const selectedRow = selectedRows[0];

      // this is just to hide the ts errors and shouldn't happen
      if (!selectedRow.data) {
        $log.error('the selected row doesn\'t have data!');
        return;
      }

      // capture the foreignKeyData
      if (props.foreignKeyData && props.foreignKeyData.current) {
        props.foreignKeyData.current[props.name] = selectedRow.data;
      }

      // find the raw value of the fk columns that correspond to the selected row
      // since we've already added a not-null hidden filter, the values will be not-null.
      props.columnModel.column.foreignKey.colset.columns.forEach((col: any) => {
        const referencedCol = props.columnModel.column.foreignKey.mapping.get(col);
        // TODO maybe we want to formalize this way of naming the fields? like a function or something
        setValue(`${usedFormNumber}-${col.name}`, selectedRow.data[referencedCol.name]);
      });

      // for now this is just changing the displayed tuple displayname
      onChange(selectedRow.displayname.value);
    }
  }

  return (
    <InputField {...props} onClear={onClear}>
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-foreignkey'>
          {showSpinner &&
            <div className='column-cell-spinner-container'>
              <div className='column-cell-spinner-backdrop'></div>
              <Spinner animation='border' size='sm' />
            </div>
          }
          <div className='chaise-input-group' {... (!props.disableInput && { onClick: openRecordsetModal })}>
            <div
              id={`form-${usedFormNumber}-${makeSafeIdAttr(props.columnModel.column.displayname.value)}-display`}
              className={`chaise-input-control has-feedback ellipsis ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}
            >
              {isStringAndNotEmpty(field?.value) ?
                <DisplayValue className='popup-select-value' value={{ value: field?.value, isHTML: true }} /> :
                <span
                  className='chaise-input-placeholder popup-select-value'
                  contentEditable={false}
                >
                  {props.placeholder ? props.placeholder : 'Select a value'}
                </span>
              }
              <ClearInputBtn
                btnClassName={`${props.clearClasses} input-switch-clear`}
                clickCallback={clearInput} show={!props.disableInput && showClear}
              />
            </div>
            {!props.disableInput && <div className='chaise-input-group-append'>
              <button
                id={`form-${usedFormNumber}-${makeSafeIdAttr(props.columnModel.column.displayname.value)}-button`}
                className='chaise-btn chaise-btn-primary modal-popup-btn'
                role='button'
                type='button'
              >
                <span className='chaise-btn-icon fa-solid fa-chevron-down' />
              </button>
            </div>}
          </div>
          <input className={props.inputClasses} {...field} type='hidden' />
          {
            recordsetModalProps &&
            <RecordsetModal
              modalClassName='foreignkey-popup'
              recordsetProps={recordsetModalProps}
              onClose={hideRecordsetModal}
              onSubmit={onDataSelected(onChange)}
              displayname={props.columnModel.column.displayname}
            />
          }
        </div>
      )}
    </InputField>
  );
};

export default ForeignkeyField;
