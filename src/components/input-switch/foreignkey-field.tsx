// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import Dropdown from 'react-bootstrap/Dropdown';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/modals/recordset-modal';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

// models
import {
  appModes, MULTI_FORM_INPUT_FORM_VALUE, RecordeditColumnModel, RecordeditForeignkeyCallbacks
} from '@isrd-isi-edu/chaise/src/models/recordedit';
import {
  RecordsetConfig, RecordsetDisplayMode,
  RecordsetSelectMode, SelectedRow, RecordsetProps,
} from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogActions, LogStackPaths } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { RECORDSET_DEFAULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import {
  callOnChangeAfterSelection,
  clearForeignKeyData,
  createForeignKeyReference,
  validateForeignkeyValue
} from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
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
  /**
   * customize the foreignkey callbacks
   */
  foreignKeyCallbacks?: RecordeditForeignkeyCallbacks
};

const ForeignkeyField = (props: ForeignkeyFieldProps): JSX.Element => {

  const usedFormNumber = typeof props.formNumber === 'number' ? props.formNumber : 1;

  const { setValue, getValues } = useFormContext();

  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordsetProps | null>(null);

  const [showSpinner, setShowSpinner] = useState<boolean>(false);

  /**
   * - while loading the foreignkey data, users cannot interact with fks with defaulr or domain-filter.
   * - we don't need to show spinner for prefilled fks since the inputs are already disabled
   */
  const showSpinnerOnLoad = props.waitingForForeignKeyData && (props.columnModel.hasDomainFilter ||
    (props.appMode !== appModes.EDIT && props.columnModel.column.default !== null));

  /**
   * make sure the underlying raw columns as well as foreignkey data are also emptied.
   */
  const onClear = () => {
    clearForeignKeyData(
      props.name,
      props.columnModel.column,
      usedFormNumber,
      props.foreignKeyData,
      setValue
    )
  }

  const openRecordsetModal = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (props.foreignKeyCallbacks && props.foreignKeyCallbacks.onAttemptToChange) {
      setShowSpinner(true);
      props.foreignKeyCallbacks.onAttemptToChange().then((res) => {
        if (res.allowed) {
          populateRecordsetModalProps(res.domainFilterFormNumber);
        }
      }).finally(() => setShowSpinner(false));
      return;
    } else {
      populateRecordsetModalProps();
    }
  };

  const populateRecordsetModalProps = (domainFilterFormNumber?: number) => {
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

    const ref = createForeignKeyReference(
      props.columnModel.column,
      props.parentReference,
      typeof domainFilterFormNumber === 'number' ? domainFilterFormNumber : usedFormNumber,
      props.foreignKeyData,
      getValues
    );

    setRecordsetModalProps({
      parentReference: props.parentReference,
      parentTuple: props.parentTuple,
      initialReference: ref.contextualize.compactSelectForeignKey,
      initialPageLimit: RECORDSET_DEFAULT_PAGE_SIZE,
      config: recordsetConfig,
      logInfo: {
        logStack: LogService.addExtraInfoToStack(LogService.getStackObject(props.columnModel.logStackNode, props.parentLogStack), { picker: 1 }),
        logStackPath: LogService.getStackPath(props.parentLogStackPath ? props.parentLogStackPath : null, LogStackPaths.FOREIGN_KEY_POPUP)
      },
      getDisabledTuples: props.foreignKeyCallbacks ? props.foreignKeyCallbacks.getDisabledTuples : undefined
    });
  }

  const hideRecordsetModal = () => {
    setRecordsetModalProps(null);
  };

  const onDataSelected = (onChange: any) => {
    return (selectedRows: SelectedRow[]) => {
      // close the modal
      hideRecordsetModal();

      const selectedRow = selectedRows[0];

      callOnChangeAfterSelection(
        selectedRow,
        onChange,
        props.name,
        props.columnModel.column,
        usedFormNumber,
        props.foreignKeyData,
        setValue
      );
    }
  }

  const rules: any = {};
  if (props.foreignKeyCallbacks && props.foreignKeyCallbacks.onChange) {
    rules.validate = validateForeignkeyValue(props.name, props.columnModel.column, props.foreignKeyData, props.foreignKeyCallbacks);
  }

  return (
    <InputField {...props} onClear={onClear} controllerRules={rules}>
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-foreignkey'>
          {(showSpinnerOnLoad || showSpinner) &&
            <div className='foreignkey-input-spinner-container'>
              <div className='foreignkey-input-spinner-backdrop'></div>
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
          <input className={`${props.inputClasses} ${props.inputName}`} {...field} type='hidden' />
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
