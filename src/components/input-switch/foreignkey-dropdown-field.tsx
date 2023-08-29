// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import Dropdown from 'react-bootstrap/Dropdown';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

// models
import { appModes, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import { RECORDSET_DEFAULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { populateSubmissionRow } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

type ForeignkeyDropdownFieldProps = InputFieldProps & {
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

const ForeignkeyDropdownField = (props: ForeignkeyDropdownFieldProps): JSX.Element => {

  const usedFormNumber = typeof props.formNumber === 'number' ? props.formNumber : 1;

  const { setValue, getValues } = useFormContext();
  const { dispatchError } = useError();

  /**
   * - while loading the foreignkey data, users cannot interact with fks with defaulr or domain-filter.
   * - we don't need to show spinner for prefilled fks since the inputs are already disabled
   */
  const showSpinnerOnLoad = props.waitingForForeignKeyData && (props.columnModel.hasDomainFilter ||
    (props.appMode !== appModes.EDIT && props.columnModel.column.default !== null));

  const searchInputEl = useRef<HTMLInputElement>(null);
  const inputChangedTimeout = useRef<number | null>(null);
  const AUTO_SEARCH_TIMEOUT = 1000;
  const [showSpinner, setShowSpinner] = useState<boolean>(false);

  // contextualized reference for fetching dropdownRows
  const [dropdownReference, setDropdownReference] = useState<any>(null);
  const [currentDropdownPage, setCurrentDropdownPage] = useState<any>(null);
  // array of page.tuples
  const [dropdownRows, setDropdownRows] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [checkedRow, setCheckedRow] = useState<any>(null);

  const [dropdownInitialized, setDropdownInitialized] = useState<boolean>(false);
  const [pageLimit, setPageLimit] = useState<number>(RECORDSET_DEFAULT_PAGE_SIZE);

  const stackPath = LogService.getStackPath(LogStackPaths.SET, LogStackPaths.FOREIGN_KEY_DROPDOWN);

  // NOTE: same function in foreignkey-field
  const createForeignKeyReference = () => {
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
    const linkedData: any = {};
    if (props.foreignKeyData && props.foreignKeyData.current) {
      props.parentReference.activeList.allOutBounds.forEach((col: any) => {
        const k = `${usedFormNumber}-${col.name}`;
        if (k in props.foreignKeyData?.current) {
          linkedData[col.name] = props.foreignKeyData?.current[k];
        }
      });
    }

    const submissionRow = populateSubmissionRow(props.parentReference, usedFormNumber, getValues());
    return props.columnModel.column.filteredRef(submissionRow, linkedData).addFacets(andFilters);
  }

  // NOTE: same function in foreignkey-field
  const callOnChangeAfterSelection = (selectedRow: any, onChange: any) => {
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
      
      setValue(`${usedFormNumber}-${col.name}`, selectedRow.data[referencedCol.name]);
    });

    // for now this is just changing the displayed tuple displayname
    onChange(selectedRow.displayname.value);
  }

  const intializeDropdownRows = () => {
    setShowSpinner(true);
    const ref = createForeignKeyReference().contextualize.compactSelectForeignKey;
    setDropdownReference(ref);

    let initialPageLimit = pageLimit;
    const defaultPageSize = ref.display.defaultPageSize;
    if (defaultPageSize) {
      // update value used in read request
      initialPageLimit = defaultPageSize;
      setPageLimit(defaultPageSize);
    }

    const currStackNode = LogService.getStackNode(LogStackTypes.FOREIGN_KEY, ref.table);
    const logObj = {
      action: LogService.getActionString(LogActions.OPEN, stackPath),
      stack: LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { dropdown: 1 })
    }

    LogService.logClientAction(logObj, ref.defaultLogInfo);

    // different action for read
    logObj.action = LogService.getActionString(LogActions.LOAD, stackPath);

    ref.read(initialPageLimit, logObj).then((page: any) => {
      setCurrentDropdownPage(page);
      setDropdownRows(page.tuples);
      
      // if we use props.foreignKeyData.current[props.name], we get an object of row values (tuple.data)
      // we don't know which column value is used for the displayname so it's better to check react-hook-form state
      const displayedValue = getValues()[props.name];

      // check if we have a value set for the foreign key input
      if (displayedValue) {
        // set the checked row if it's present in the page of rows
        page.tuples.forEach((tuple: any) => {
          if (tuple.displayname.value === displayedValue) setCheckedRow(tuple);
        });
      }

      setShowSpinner(false);
      setDropdownInitialized(true);
    }).catch((exception: any) => {
      setShowSpinner(false);
      dispatchError({ error: exception });
    })
  }

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

  // function for fetching data in dropdown after a search term
  const searchCallback = (value: string) => {
    const searchRef = dropdownReference.search(value);

    // create initial stack
    const currStackNode = LogService.getStackNode(LogStackTypes.FOREIGN_KEY, searchRef.table);
    const clientStack = LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { dropdown: 1, search_str: value })

    LogService.logClientAction({
      action: LogService.getActionString(LogActions.SEARCH_BOX_AUTO, stackPath),
      stack: clientStack
    }, searchRef.defaultLogInfo);

    const readStack = LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { dropdown: 1 })
    // different action for read
    // add causes to stack only for read request
    const logObj = {
      action: LogService.getActionString(LogActions.RELOAD, stackPath),
      stack: LogService.addCausesToStack(readStack, [LogReloadCauses.DROPDOWN_SEARCH_BOX], ConfigService.ERMrest.getElapsedTime())
    }
    

    searchRef.read(pageLimit, logObj).then((page: any) => {
      setCurrentDropdownPage(page);

      if (page.length === 0) {
        const fakeTuple = {
          rowName: {
            value: '<i>No Results</i>',
            isHTML: true
          },
          uniqueId: 'no_results_row'
        }

        setDropdownRows([fakeTuple]);
      } else {
        setDropdownRows(page.tuples);
      }

      setShowSpinner(false);
    }).catch((exception: any) => {
      setShowSpinner(false);

      // alert might be better or a dismissible error that doesn't block continuing app
      dispatchError({ error: exception });
    });
  }

  const onSearchChange = (e: any) => {
    let value = e.target.value;
    if (value) value = value.trim();

    setSearchValue(value);

    // Cancel previous promise for background search that was queued to be called
    if (inputChangedTimeout.current) clearTimeout(inputChangedTimeout.current);

    inputChangedTimeout.current = windowRef.setTimeout(
      () => {
        setShowSpinner(true);
        inputChangedTimeout.current = null;
        searchCallback(value);
      },
      AUTO_SEARCH_TIMEOUT
    );
  }

  const onToggle = (show: boolean) => {
    const formContainer = document.querySelector('.form-container .recordedit-form') as HTMLElement;
  
    if (show) {
      formContainer.classList.add('dropdown-open');

      if (!dropdownInitialized) {
        intializeDropdownRows();
      } else {
        const currStackNode = LogService.getStackNode(LogStackTypes.FOREIGN_KEY, dropdownReference.table);
        LogService.logClientAction({
          action: LogService.getActionString(LogActions.OPEN, stackPath),
          stack: LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { dropdown: 1 })
        }, dropdownReference.defaultLogInfo);
      }
    } else {
      formContainer.classList.remove('dropdown-open');

      const currStackNode = LogService.getStackNode(LogStackTypes.FOREIGN_KEY, dropdownReference.table);
      LogService.logClientAction({
        action: LogService.getActionString(LogActions.CLOSE, stackPath),
        stack: LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { dropdown: 1 })
      }, dropdownReference.defaultLogInfo);
    }
  }

  const clearDropdownInput = (e: any, onClearFun: any) => {
    setCheckedRow(null);
    onClearFun(e);
  }

  const onRowSelected = (selectedRow: any, onChange: any) => {
    setCheckedRow(selectedRow);
    callOnChangeAfterSelection(selectedRow, onChange);
  }

  const loadMoreOptions = () => {
    setShowSpinner(true);

    const nextRef = currentDropdownPage.next;

    // create initial stack
    const currStackNode = LogService.getStackNode(LogStackTypes.FOREIGN_KEY, nextRef.table);
    const logObj = {
      action: LogService.getActionString(LogActions.PAGE_NEXT, stackPath),
      stack: LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { dropdown: 1 })
    }

    LogService.logClientAction(logObj, nextRef.defaultLogInfo);

    // different action for read
    logObj.action = LogService.getActionString(LogActions.RELOAD, stackPath);
    // add causes to stack only for read request
    logObj.stack = LogService.addCausesToStack(logObj.stack, [LogReloadCauses.DROPDOWN_LOAD_MORE], ConfigService.ERMrest.getElapsedTime());

    nextRef.read(pageLimit, logObj).then((page: any) => {
      setCurrentDropdownPage(page);

      setDropdownRows((currentRows: any[]) => {
        return [...currentRows, ...page.tuples]
      });

      setShowSpinner(false);
    }).catch((exception: any) => {
      setShowSpinner(false);
      dispatchError({ error: exception });
    })
  }

  const renderDropdownOptions = (onChange: any) => {
    return dropdownRows.map((tuple: any) => {
      if (tuple.uniqueId === 'no_results_row') {
        // return a special row that doesn't use Dropdown.Item so it won't be selectable
        return (
          <li
            key={`fk-${tuple.uniqueId}`}
            className='dropdown-item no-results'
          >
            <label>
              <DisplayValue
                className='dropdown-select-value'
                value={{ value: tuple.rowName.value, isHTML: tuple.rowName.isHTML }}
              />
            </label>
          </li>
        )
      }

      return (
        <Dropdown.Item
          key={`fk-val-${tuple.uniqueId}`}
          as='li'
          onClick={(e) => onRowSelected(tuple, onChange)}
        >
          {tuple.uniqueId === checkedRow?.uniqueId && <span className='fa-solid fa-check'></span>}
          <label>
            <DisplayValue
              className='dropdown-select-value'
              value={{ value: tuple.rowName.value, isHTML: tuple.rowName.isHTML }}
            />
          </label>
        </Dropdown.Item>
      )
    })
  }

  return (
    <InputField {...props} onClear={onClear}>
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-foreignkey fk-dropdown'>
          {(showSpinnerOnLoad || showSpinner) &&
            <div className='column-cell-spinner-container'>
              <div className='column-cell-spinner-backdrop'></div>
              <Spinner animation='border' size='sm' />
            </div>
          }
          <Dropdown onToggle={onToggle} aria-disabled={props.disableInput}>
            <Dropdown.Toggle as='div' className='chaise-input-group no-caret' disabled={props.disableInput} aria-disabled={props.disableInput}>
              <div
                id={`form-${usedFormNumber}-${makeSafeIdAttr(props.columnModel.column.displayname.value)}-display`}
                className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}
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
                  clickCallback={(e: any) => clearDropdownInput(e, clearInput)} show={!props.disableInput && (showClear || Boolean(searchValue))}
                />
              </div>
              {!props.disableInput && <div className='chaise-input-group-append'>
                <button className='chaise-btn chaise-btn-primary' role='button' type='button'>
                  <span className='chaise-btn-icon fa-solid fa-chevron-down' />
                </button>
              </div>}
            </Dropdown.Toggle>
            {!props.disableInput && <Dropdown.Menu className='responsive-dropdown-menu'>
              <li className='search-row chaise-input-group'>
                <div className='chaise-input-group-prepend'>
                  <span className='chaise-input-group-text fa-solid fa-magnifying-glass' />
                </div>
                <input
                  className='chaise-input-control'
                  onChange={onSearchChange}
                  value={searchValue}
                  type='text'
                  ref={searchInputEl}
                />
              </li>
              <div className='dropdown-list'>
                {renderDropdownOptions(onChange)}
                {currentDropdownPage && currentDropdownPage.next && <>
                  <li className='dropdown-item load-more-row' onClick={() => loadMoreOptions()}>
                    <div className='chaise-btn chaise-btn-sm chaise-btn-tertiary'><a>... load more</a></div>
                  </li>
                </>}
              </div>
            </Dropdown.Menu>}
          </Dropdown>
          <input className={props.inputClasses} {...field} type='hidden' />
        </div>
      )}
    </InputField>
  );
};

export default ForeignkeyDropdownField;
