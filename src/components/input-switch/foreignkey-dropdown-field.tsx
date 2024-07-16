// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import Dropdown from 'react-bootstrap/Dropdown';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import SearchInput from '@isrd-isi-edu/chaise/src/components/search-input';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import { useLayoutEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

// models
import { appModes, RecordeditColumnModel, RecordeditForeignkeyCallbacks } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { RECORDSET_DEFAULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import {
  callOnChangeAfterSelection,
  clearForeignKeyData,
  createForeignKeyReference,
  validateForeignkeyValue
} from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
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
  /**
   * customize the foreignkey callbacks
   */
  foreignKeyCallbacks?: RecordeditForeignkeyCallbacks
};

const ForeignkeyDropdownField = (props: ForeignkeyDropdownFieldProps): JSX.Element => {

  const usedFormNumber = typeof props.formNumber === 'number' ? props.formNumber : 1;
  /**
   * TODO
   * this element most probably should be something that the inputSwitch can customize
   * because we're now assuming that this compoennt is only used in the recordedit form.
   *
   * that being said this the dropdown alignment wasn't an issue in the viewer app, so
   * this added padding is not needed there.
   */
  const formContainer = document.querySelector('.form-container .recordedit-form');

  const { setValue, getValues } = useFormContext();
  const { dispatchError } = useError();

  /**
   * - while loading the foreignkey data, users cannot interact with fks with defaulr or domain-filter.
   * - we don't need to show spinner for prefilled fks since the inputs are already disabled
   */
  const showSpinnerOnLoad = props.waitingForForeignKeyData && (props.columnModel.hasDomainFilter ||
    (props.appMode !== appModes.EDIT && props.columnModel.column.default !== null));

  const dropdownToggleRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  /**
   * this is added to handle the cases where the fk dropdown is the last item in the form.
   * we have to add extra padding to the page to make sure it's displayed properly on the page.
   */
  const [triggerDropdownChange, setTriggerDropdownChange] = useState<boolean>(false);

  /**
   * whether we are showing the fk dropdown or not.
   * we might not want to allow users to open the dropdown, so we're handling the state here ourselves
   * instead of letting bootstrap's dropdown handle it internally
   */
  const [showDropdown, setShowDropdown] = useState(false);

  const [showSpinner, setShowSpinner] = useState<boolean>(false);

  // contextualized reference for fetching dropdownRows
  const [dropdownReference, setDropdownReference] = useState<any>(null);
  const [currentDropdownPage, setCurrentDropdownPage] = useState<any>(null);

  type DropdownRow = { tuple: any, isDisabled: boolean };
  const [dropdownRows, setDropdownRows] = useState<DropdownRow[]>([]); // array of page.tuples
  const [checkedRow, setCheckedRow] = useState<any>(null); // ERMrest.Tuple

  const [dropdownInitialized, setDropdownInitialized] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<String | null>(null);
  const [pageLimit, setPageLimit] = useState<number>(RECORDSET_DEFAULT_PAGE_SIZE);
  const [pagingPageLimit, setPagingPageLimit] = useState<number>(RECORDSET_DEFAULT_PAGE_SIZE);

  const stackPath = LogService.getStackPath(LogStackPaths.SET, LogStackPaths.FOREIGN_KEY_DROPDOWN);

  // when dropdown is opened, set a class so dropdown opens without being pushed inside the table container
  useLayoutEffect(() => {
    if (!triggerDropdownChange || !dropdownMenuRef.current || !formContainer) return;

    // trigger on timeout to ensure this happens after popper calculates what it needs to for dropdownMenuRef.current
    windowRef.setTimeout(
      () => {
        if (!dropdownMenuRef.current) return;

        // the data-popper-placement attribute (and value) that popper adds to the input
        const popperPlacement = (dropdownMenuRef.current.attributes as any)['data-popper-placement'];

        const dropdownTogglePositionRect = dropdownToggleRef.current?.getBoundingClientRect();
        const yBottom = dropdownTogglePositionRect?.bottom || 0; // should never be 0

        const inputPositionFromBottomOfForm = formContainer.getBoundingClientRect().bottom - yBottom;

        // if the dropdown is forced to render down and it's near bottom of the form
        //   - dropdown has max height of 395px
        //   - "padding-bottom" of ".entity-value" cell = 8px
        //   - "padding-bottom" of ".main-body" = 40px
        // to get the max space needed we do:
        //    395 - (8 + 40) = 347
        // use ~350 to give a little extra room
        if (popperPlacement && popperPlacement.value === 'bottom-start' && inputPositionFromBottomOfForm < 350) {
          formContainer.classList.add('dropdown-open');
        }

        setTriggerDropdownChange(false);
      });
  }, [triggerDropdownChange]);

  /**
   * populate the dropdown rows after a request is done.
   * this function will take care of calling the getDisabledTuples if it's defined and setting the tuples as disabled
   */
  const populateDropdownRows = (page: any, pageLimit: number, logStack: any,
    logStackPath: string, requestCauses?: any, reloadStartTime?: any): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      type PType = { page: any, disabledRows?: any };
      let p;
      if (props.foreignKeyCallbacks && props.foreignKeyCallbacks.getDisabledTuples) {
        p = props.foreignKeyCallbacks.getDisabledTuples(page, pageLimit, logStack, logStackPath, requestCauses, reloadStartTime);
      } else {
        p = new Promise<PType>((innerResolve) => innerResolve({ page }));
      }

      p.then((result: PType) => {
        const disabledTuplesUniqueIDs: any = {};
        if (Array.isArray(result.disabledRows)) {
          result.disabledRows.forEach((t: any) => {
            disabledTuplesUniqueIDs[t.uniqueId] = 1;
          })
        }

        setDropdownRows(page.tuples.map((tuple: any) => {
          return { isDisabled: (tuple.uniqueId in disabledTuplesUniqueIDs), tuple };
        }));

        resolve(true);
      }).catch((err) => {
        reject(err);
      })
    });


  }

  const intializeDropdownRows = (domainFilterFormNumber?: number) => {
    setShowSpinner(true);
    setDropdownInitialized(false);

    let ref = createForeignKeyReference(
      props.columnModel.column,
      props.parentReference,
      typeof domainFilterFormNumber === 'number' ? domainFilterFormNumber : usedFormNumber,
      props.foreignKeyData,
      getValues
    ).contextualize.compactSelectForeignKey;

    if (searchTerm) ref = ref.search(searchTerm);

    setDropdownReference(ref);

    let initialPageLimit = pageLimit;
    const defaultPageSize = ref.display.defaultPageSize;
    if (defaultPageSize) {
      // update value used in read request
      initialPageLimit = defaultPageSize;
      setPageLimit(defaultPageSize);
      setPagingPageLimit(defaultPageSize);
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

      return populateDropdownRows(page, pageLimit, logObj.stack, stackPath);
    }).then(() => {

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
    clearForeignKeyData(
      props.name,
      props.columnModel.column,
      usedFormNumber,
      props.foreignKeyData,
      setValue
    )
  }

  // function for fetching data in dropdown after a search term
  const searchCallback = (value: string | null, action: LogActions) => {
    setShowSpinner(true);
    setSearchTerm(value);
    // reset the page limit used for "... load more" function
    setPagingPageLimit(pageLimit)

    const searchRef = dropdownReference.search(value);
    setDropdownReference(searchRef);

    // create initial stack
    const currStackNode = LogService.getStackNode(LogStackTypes.FOREIGN_KEY, searchRef.table);
    const stack = LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { dropdown: 1 })

    const searchStack = value ? LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { dropdown: 1, search_str: value }) : stack;

    // use the action from returned from SearchInput component
    LogService.logClientAction({
      action: LogService.getActionString(action, stackPath),
      stack: searchStack
    }, searchRef.defaultLogInfo);

    // different action for read
    // add causes to stack only for read request
    const requestCauses = [LogReloadCauses.DROPDOWN_SEARCH_BOX];
    const reloadStartTime = ConfigService.ERMrest.getElapsedTime();
    const logObj = {
      action: LogService.getActionString(LogActions.RELOAD, stackPath),
      stack: LogService.addCausesToStack(stack, requestCauses, reloadStartTime)
    }

    searchRef.read(pageLimit, logObj).then((page: any) => {
      setCurrentDropdownPage(page);
      return populateDropdownRows(page, pageLimit, logObj.stack, stackPath, requestCauses, reloadStartTime);
    }).then(() => {
      setShowSpinner(false);
    }).catch((exception: any) => {
      setShowSpinner(false);

      // alert might be better or a dismissible error that doesn't block continuing app
      dispatchError({ error: exception });
    });
  }

  const onToggle = (show: boolean) => {

    if (show) {
      const cb = (domainFilterFormNumber?: number) => {
        // triggers useLayoutEffect that handles whether to add the dropdown-open class
        setShowDropdown(true);
        setTriggerDropdownChange(true);

        if (!dropdownInitialized || props.columnModel.hasDomainFilter) {
          // if there is a domain filter pattern, the dropdown should be reinitialized incase the filtered reference has changed
          intializeDropdownRows(domainFilterFormNumber);
        } else {
          const currStackNode = LogService.getStackNode(LogStackTypes.FOREIGN_KEY, dropdownReference.table);
          LogService.logClientAction({
            action: LogService.getActionString(LogActions.OPEN, stackPath),
            stack: LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { dropdown: 1 })
          }, dropdownReference.defaultLogInfo);
        }
      };

      if (props.foreignKeyCallbacks && props.foreignKeyCallbacks.onAttemptToChange) {
        setShowSpinner(true);
        props.foreignKeyCallbacks.onAttemptToChange().then((res) => {
          if (res.allowed) {
            cb(res.domainFilterFormNumber);
          }
        }).finally(() => setShowSpinner(false));
        return;
      } else {
        cb();
        return;
      }

    }
    //
    else {
      setShowDropdown(false);

      // will remove the class if it's present. no need to check for it
      if (formContainer) {
        formContainer.classList.remove('dropdown-open');
      }

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

  const loadMoreOptions = () => {
    setShowSpinner(true);

    const newPageLimit = pagingPageLimit + pageLimit;
    setPagingPageLimit(newPageLimit);

    // create initial stack
    const currStackNode = LogService.getStackNode(LogStackTypes.FOREIGN_KEY, dropdownReference.table);
    const stack = LogService.getStackObject(currStackNode);

    LogService.logClientAction({
      action: LogService.getActionString(LogActions.PAGE_NEXT, stackPath),
      stack: LogService.addExtraInfoToStack(stack, { dropdown: 1 })
    }, dropdownReference.defaultLogInfo);

    // different action for read
    // add causes to stack only for read request
    const requestCauses = [LogReloadCauses.DROPDOWN_LOAD_MORE];
    const reloadStartTime = ConfigService.ERMrest.getElapsedTime();
    const logObj = {
      action: LogService.getActionString(LogActions.RELOAD, stackPath),
      stack: LogService.addCausesToStack(stack, requestCauses, reloadStartTime)
    }

    dropdownReference.read(newPageLimit, logObj).then((page: any) => {
      setCurrentDropdownPage(page);

      return populateDropdownRows(page, pageLimit, logObj.stack, stackPath, requestCauses, reloadStartTime);
    }).then(() => {

      setShowSpinner(false);
    }).catch((exception: any) => {
      setShowSpinner(false);
      dispatchError({ error: exception });
    })
  }

  const renderDropdownOptions = (onChange: any) => {
    if (!dropdownInitialized) return;

    if (dropdownRows.length === 0) {
      // return a special row that doesn't use Dropdown.Item so it won't be selectable
      return (
        <li
          key='fk-no_results_row'
          className='dropdown-item no-results'
        >
          <label>
            <DisplayValue
              className='dropdown-select-value'
              value={{ value: '<i>No Results</i>', isHTML: true }}
            />
          </label>
        </li>
      )
    }
    return dropdownRows.map((row: DropdownRow) => {
      return (
        <Dropdown.Item
          key={`fk-val-${row.tuple.uniqueId}`}
          as='li'
          onClick={(e) => onRowSelected(row.tuple, onChange)}
          disabled={row.isDisabled}
        >
          {row.tuple.uniqueId === checkedRow?.uniqueId && <span className='fa-solid fa-check'></span>}
          <label>
            <DisplayValue
              className='dropdown-select-value'
              value={{ value: row.tuple.rowName.value, isHTML: row.tuple.rowName.isHTML }}
            />
          </label>
        </Dropdown.Item>
      )
    })
  }

  const rules: any = {};
  if (props.foreignKeyCallbacks && props.foreignKeyCallbacks.onChange) {
    rules.validate = validateForeignkeyValue(props.name, props.columnModel.column, props.foreignKeyData, props.foreignKeyCallbacks);
  }

  return (
    <InputField {...props} onClear={onClear} controllerRules={rules}>
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-foreignkey fk-dropdown'>
          {(showSpinnerOnLoad || showSpinner) &&
            <div className='foreignkey-input-spinner-container'>
              <div className='foreignkey-input-spinner-backdrop'></div>
              <Spinner animation='border' size='sm' />
            </div>
          }
          <Dropdown show={showDropdown} onToggle={onToggle} aria-disabled={props.disableInput}>
            <Dropdown.Toggle
              as='div'
              className='chaise-input-group no-caret'
              disabled={props.disableInput}
              aria-disabled={props.disableInput}
              ref={dropdownToggleRef}
            >
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
                  clickCallback={(e: any) => clearDropdownInput(e, clearInput)} show={!props.disableInput && showClear}
                />
              </div>
              {!props.disableInput && <div className='chaise-input-group-append'>
                <button className='chaise-btn chaise-btn-primary' role='button' type='button'>
                  <span className='chaise-btn-icon fa-solid fa-chevron-down' />
                </button>
              </div>}
            </Dropdown.Toggle>
            {/* when there are very few columns in recordedit, foreign key dropdowns were opening
              up causing them to open "behind" the top container and making some options unclickable
              https://github.com/informatics-isi-edu/chaise/pull/2455 */}
            {!props.disableInput && dropdownReference && <Dropdown.Menu flip={false} className='responsive-dropdown-menu' ref={dropdownMenuRef}>
              <li className='search-row'>
                <SearchInput
                  initialSearchTerm=''
                  searchCallback={searchCallback}
                  searchColumns={dropdownReference.searchColumns}
                  disabled={false}
                  focus={true}
                  dropdownDisplayMode={true}
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
          <input className={`${props.inputClasses} ${props.inputClassName}`} {...field} type='hidden' />
        </div>
      )}
    </InputField>
  );
};

export default ForeignkeyDropdownField;
