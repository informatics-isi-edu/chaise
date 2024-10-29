import '@isrd-isi-edu/chaise/src/assets/scss/_recordset-table.scss';
import React from 'react';

// components
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import TableRow from '@isrd-isi-edu/chaise/src/components/recordset/table-row';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// models
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode, SelectedRow, SortColumn } from '@isrd-isi-edu/chaise/src/models/recordset';

// utils
import { CUSTOM_EVENTS } from '@isrd-isi-edu/chaise/src/utils/constants';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { addTopHorizontalScroll, fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

type RecordsetTableProps = {
  config: RecordsetConfig,
  initialSortObject: any,
  intersectScroll?: boolean,
  sortCallback?: (sortColumn: SortColumn) => any
}

const RecordsetTable = ({
  config,
  initialSortObject,
  intersectScroll=false
}: RecordsetTableProps): JSX.Element => {

  const {
    reference,
    isInitialized,
    isLoading,
    hasTimeoutError,
    page,
    columnModels,
    colValues,
    selectedRows,
    setSelectedRows,
    disabledRows,
    update,
    logRecordsetClientAction
  } = useRecordset();

  const tableContainer = useRef<HTMLDivElement>(null);


  const [currSortColumn, setCurrSortColumn] = useState<SortColumn | null>(
    Array.isArray(initialSortObject) ? initialSortObject[0] : null
  );

  const [showAllRows, setShowAllRows] = useState(!(config.maxDisplayedRows && config.maxDisplayedRows > 0));
  // tracks whether a paging action has successfully occurred for this table
  // used for related tables to fire an event when the content has loaded to scroll back to the top of the related table
  const [pagingSuccess, setPagingSuccess] = useState<boolean>(false);

  /**
   * capture the state of selected and disabled of rows in here so
   * we don't have to populate this multiple times
   */
  let isRowSelected = Array(page ? page.length : 0).fill(false);
  if (page && page.length && Array.isArray(selectedRows) && selectedRows.length > 0) {
    isRowSelected = page.tuples.map((tuple: any) => (
      // ermrestjs always returns a string for uniqueId, but internally we don't
      // eslint-disable-next-line eqeqeq
      selectedRows.some((obj) => obj.uniqueId == tuple.uniqueId)
    ));
  }
  let isRowDisabled = Array(page ? page.length : 0).fill(false);
  if (page && page.length && Array.isArray(disabledRows) && disabledRows.length > 0) {
    isRowDisabled = page.tuples.map((tuple: any) => (
      // ermrestjs always returns a string for uniqueId, but internally we don't
      // eslint-disable-next-line eqeqeq
      disabledRows.some((obj) => obj.uniqueId == tuple.uniqueId)
    ));
  }
  const [isBottomVisible, setIsBottomVisible] = useState(false);
  const stickyScrollbarRef = useRef(null);
  const tableEndRef = useRef(null);

  useEffect(() => {
    //Only implement intersection observer for top scrollbar when intersectScroll is true otherwise top scrollbar will be sticky all the time
    if(intersectScroll){

    // Create a new IntersectionObserver instance to track the visibility of the bottom scrollbar(end of table)
    const observer = new IntersectionObserver(
      ([entry]) => {
        //Updating isBottomVisible when bottom scrollbar is visible in the viewport
        setIsBottomVisible(entry.isIntersecting);
      },
      {
        root: null, // Use viewport as the root
        threshold: 0.1, // Triggers when 10% of the element is visible
      }
    );
    //Observes when the table end is visible on viewport
    if (tableEndRef.current) {
      observer.observe(tableEndRef.current);
    }

    return () => {
      if (tableEndRef.current) {
        observer.unobserve(tableEndRef.current);
      }
    };
  }
  }, []);


  /**
   * add the top horizontal scroll if needed
   */
  useLayoutEffect(() => {
    if (tableContainer.current) {
      addTopHorizontalScroll(tableContainer.current);
    }
  }, []);

  // when sort column has changed, call the callback
  useEffect(() => {
    // TODO why isInitialized is needed? (removing it triggers two updates on load)
    if (!currSortColumn || !isInitialized || !config.sortable) return;

    const ref = reference.sort([currSortColumn]);

    const success = update({ updateResult: true }, { reference: ref }, { cause: LogReloadCauses.SORT });

    if (success) {
      logRecordsetClientAction(LogActions.SORT, null, null, ref);
    }
  }, [currSortColumn]);

  // once the page is no longer loading and we had a previous/next click event for this table, fire a custom event for scrolling
  useEffect(() => {
    if (isLoading || !pagingSuccess) return;
    setPagingSuccess(false);

    if (config.displayMode.indexOf(RecordsetDisplayMode.RELATED) === 0 && !!tableContainer.current) {
      fireCustomEvent(CUSTOM_EVENTS.RELATED_TABLE_PAGING_SUCCESS, tableContainer.current, {
        displayname: reference.displayname.value
      });
    }
  }, [isLoading]);

  //------------------- UI related callbacks: --------------------//

  const changeSort = (col: any) => {
    /**
     * if the sort is based on current column and is ascending, then
     * toggle to descending.
     * otherwise sort ascending
     */
    const desc = currSortColumn?.column === col.column.name && !currSortColumn?.descending;
    setCurrSortColumn({ 'column': col.column.name, 'descending': desc });
  };

  const changePage = (isNext: boolean) => {
    const ref = isNext ? page.next : page.previous;
    const action = isNext ? LogActions.PAGE_NEXT : LogActions.PAGE_PREV;
    const cause = isNext ? LogReloadCauses.PAGE_NEXT : LogReloadCauses.PAGE_PREV;

    // this shouldn't technically happen but added for sanity check
    if (!ref) return;

    const success = update({ updateResult: true }, { reference: ref }, { cause: cause });

    // log the request if it was successful
    if (success) {
      logRecordsetClientAction(action, null, null, ref);
      // change state variable so the event can be fired once isLoading === false
      // success here doesn't mean the content is fetched/loaded yet because of aggregate requests etc
      setPagingSuccess(true);
    }
  };

  /**
   * select all the rows that are displayed and are not disabled
   */
  const selectAllOnPage = () => {
    logRecordsetClientAction(LogActions.PAGE_SELECT_ALL);

    setSelectedRows((currRows: SelectedRow[]) => {
      const res: SelectedRow[] = Array.isArray(currRows) ? [...currRows] : [];
      if (!page) return res;
      page.tuples.forEach((tuple: any, index: number) => {
        if (isRowDisabled[index]) return;
        if (!isRowSelected[index]) {
          res.push({
            displayname: tuple.displayname,
            uniqueId: tuple.uniqueId,
            data: tuple.data,
            tupleReference: tuple.reference
          });
        }
      });
      return res;
    });
  };

  /**
   * deselect all the rows that are displayed and are not disabled
   */
  const DeselectAllOnPage = () => {
    logRecordsetClientAction(LogActions.PAGE_DESELECT_ALL);

    setSelectedRows((currRows: SelectedRow[]) => {
      const res: SelectedRow[] = Array.isArray(currRows) ? [...currRows] : [];
      if (!page) return res;
      page.tuples.forEach((tuple: any) => {
        const rowIndex = res.findIndex((obj: SelectedRow) => obj.uniqueId === tuple.uniqueId);
        if (rowIndex !== -1) res.splice(rowIndex, 1);
      });
      return res;
    });
  };

  /**
   * Called when the row is selected or deselected
   */
  const onSelectChange = (tuple: any) => {
    setSelectedRows((currRows: SelectedRow[]) => {
      const res: SelectedRow[] = Array.isArray(currRows) ? [...currRows] : [];
      // see if the tuple is list of selected rows or not
      const rowIndex = res.findIndex((obj: SelectedRow) => obj.uniqueId === tuple.uniqueId);
      // if it's currently selected, then we should deselect (and vice versa)
      const isSelected = rowIndex !== -1;
      if (!isSelected) {
        res.push({ displayname: tuple.displayname, uniqueId: tuple.uniqueId, data: tuple.data, tupleReference: tuple.reference });
      } else {
        res.splice(rowIndex, 1);
      }
      return res;
    });
  };

  //-------------------  render logics:   --------------------//

  // whether we should show the action buttons or not (used in multiple places)
  const showActionButtons = config.viewable || config.editable || config.deletable || config.selectMode !== RecordsetSelectMode.NO_SELECT;
  const numHiddenRecords = config.maxDisplayedRows && page && page.length > 0 ? page.length - config.maxDisplayedRows : 0;

  /**
   * render the header for the action(s) column
   */
  const renderActionsHeader = () => {
    let inner, headerClassName;

    switch (config.selectMode) {
      case RecordsetSelectMode.SINGLE_SELECT:
        headerClassName = 'single-select-header';
        inner = (<span>Select </span>);
        break;
      case RecordsetSelectMode.MULTI_SELECT:
        headerClassName = 'multi-select-header';
        inner = (
          <>
            <ChaiseTooltip
              placement='right'
              tooltip={'Select all items on this page.'}
            >
              <button className='table-select-all-rows chaise-btn chaise-btn-secondary chaise-btn-sm'
                type='button' onClick={selectAllOnPage}
              >
                <span className='chaise-btn-icon fa-regular fa-square-check'></span>
                <span>All on page</span>
              </button>
            </ChaiseTooltip>
            <ChaiseTooltip
              placement='right'
              tooltip={'Deselect all items on this page.'}
            >
              <button className='chaise-btn chaise-btn-secondary chaise-btn-sm'
                type='button' onClick={DeselectAllOnPage}
              >
                <span className='chaise-btn-icon fa-regular fa-square'></span>
                <span>None on page</span>
              </button>
            </ChaiseTooltip>
          </>
        );
        break;
      default:
        let innerTooltip, innerText;
        // TODO this seems wrong, what about unlink? (it's the same as master)
        if (reference.canUpdate || reference.canDelete) {
          innerText = 'Actions ';
          innerTooltip = MESSAGE_MAP.tooltip.actionCol;
        } else {
          headerClassName = 'view-header';
          innerText = 'View ';
          innerTooltip = MESSAGE_MAP.tooltip.viewCol;
        }
        inner = (
          <ChaiseTooltip
            placement='top'
            tooltip={innerTooltip}
          >
            <span className='chaise-icon-for-tooltip'>{innerText}</span>
          </ChaiseTooltip>
        )
        break;
    }
    return (
      <th className={`actions-header${headerClassName ? ` ${headerClassName}` : ''}`}>{inner}</th>
    )
  }

  const renderColumnSortIcon = (col: any) => {
    if (!currSortColumn || currSortColumn.column != col.column.name) {
      return <span className='not-sorted-icon fas fa-arrows-alt-v'></span>;
    }

    const upOrDown = currSortColumn.descending ? 'down desc-sorted-icon' : 'up asc-sorted-icon';
    return <span className={'fas fa-long-arrow-alt-' + upOrDown}></span>;
  };

  // handles tooltip class and spacing
  const renderDisplayValue = (column: any) => {
    const headerClassName = `table-column-displayname${column.comment ? ' chaise-icon-for-tooltip' : ''}`;
    return (
      <span className={headerClassName} >
        <DisplayValue value={column.displayname} />
        {column.comment ? ' ' : ''}
      </span>
    )
  }

  const renderColumnHeaders = () => {
    return columnModels.map((col: any, index: number) => {
      const canSort = config.sortable && col.column.sortable && !col.hasError && !col.isLoading;

      return (
        <th
          key={index}
          className={'c_' + makeSafeIdAttr(col.column.name) + (canSort ? ' clickable' : '')}
          {...(canSort && { onClick: () => changeSort(col) })}
        >
          {col.column.comment ?
            // if comment, show tooltip
            <ChaiseTooltip
              placement='top'
              tooltip={<DisplayCommentValue comment={col.column.comment} />}
            >
              {renderDisplayValue(col.column)}
            </ChaiseTooltip> :
            // no comment, no tooltip
            renderDisplayValue(col.column)
          }
          <span className='table-heading-icons'>
            {col.hasError &&
              <ChaiseTooltip
                placement='bottom'
                tooltip={MESSAGE_MAP.queryTimeoutTooltip}
              >
                <span className='fa-solid fa-triangle-exclamation' />
              </ChaiseTooltip>
            }
            {!col.hasError && col.isLoading &&
              <span className='table-column-spinner'><Spinner animation='border' size='sm' /></span>
            }
            {!col.hasError && !col.isLoading && canSort &&
              <span className='column-sort-icon'>{renderColumnSortIcon(col)}</span>
            }
          </span>
        </th>
      )
    })
  }

  const renderRows = () => {
    if (hasTimeoutError) {
      return (
        <tr>
          <td colSpan={columnModels.length + 1} className='full-col-span-row'>
            <span>
              Result Retrieval Failed
              <ChaiseTooltip
                placement='bottom'
                tooltip={MESSAGE_MAP.queryTimeoutTooltip}
              >
                <span className='fa-solid fa-triangle-exclamation' style={{ paddingLeft: '4px' }} />
              </ChaiseTooltip>
            </span>
          </td>
        </tr>
      )
    }

    // we need to check colValues since they might be set in different times
    if (!page) return;

    if (page.length === 0) {
      return (
        <tr>
          <td id='no-results-row' colSpan={columnModels.length + 1} className='full-col-span-row'>
            <span>No Results Found</span>
          </td>
        </tr>
      )
    }

    if (colValues.length === 0) return;

    return page.tuples.map((tuple: any, index: number) => {
      // only show the number of rows that we allowed
      if (!showAllRows && config.maxDisplayedRows && index >= config.maxDisplayedRows) {
        return;
      }

      const rowValues: any[] = [];
      colValues.forEach((valueArr: any[]) => {
        rowValues.push(valueArr[index]);
      });

      return (
        <TableRow
          key={tuple.uniqueId}
          config={config}
          rowIndex={index}
          rowValues={rowValues}
          tuple={tuple}
          showActionButtons={showActionButtons}
          selected={isRowSelected[index]}
          onSelectChange={onSelectChange}
          disabled={isRowDisabled[index]}
        />)
    })
  }

  const renderNextPreviousBtn = () => {
    if (!page) return;
    return (
      <div className='chaise-table-pagination'>
        <button
          type='button'
          className='chaise-table-previous-btn chaise-btn chaise-btn-primary'
          onClick={() => changePage(false)}
          disabled={!page.hasPrevious}
        >
          <span>Previous</span>
        </button>
        <button
          type='button'
          className='chaise-table-next-btn chaise-btn chaise-btn-primary'
          onClick={() => changePage(true)}
          disabled={!page.hasNext}
        >
          <span>Next</span>
        </button>
      </div>
    )
  }

  const outerTableClassname = () => {
    const classNameString = 'outer-table recordset-table chaise-hr-scrollable'
    const tableSchemaNames = `s_${makeSafeIdAttr(reference.table.schema.name)} t_${makeSafeIdAttr(reference.table.name)}`;
    return classNameString + ' ' + tableSchemaNames;
  }
  return (
    <div className='recordset-table-container' ref={tableContainer}>
      <div ref={stickyScrollbarRef}
        className={`chaise-table-top-scroll-wrapper ${isBottomVisible ? 'no-scroll-bar' : ''}`}>
        <div className='chaise-table-top-scroll'></div>
      </div>
      <div className={outerTableClassname()}>
        <table className='table chaise-table table-hover'>
          <thead className='table-heading'>
            <tr>
              {showActionButtons && renderActionsHeader()}
              {renderColumnHeaders()}
            </tr>
          </thead>
          <tbody>
            {renderRows()}
          </tbody>
        </table>
      </div>
      <div ref={tableEndRef} style={{ height: '1px' }}></div>
      {!hasTimeoutError && numHiddenRecords > 0 &&
        <div className='chaise-table-footer'>
          <button onClick={() => setShowAllRows(!showAllRows)} className='show-all-rows-btn chaise-btn chaise-btn-primary'>
            {showAllRows ?
              'Show less records' :
              `Show all records (${numHiddenRecords} more available)`
            }
          </button>
        </div>
      }
      {config.displayMode !== RecordsetDisplayMode.TABLE && renderNextPreviousBtn()}
    </div>
  )
}

/**
 * this component is very heavy and only relies on the provider variables to update.
 * so we have to memorize it to avoid unnecessary rerenders.
 * this was slowing the page down and by adding this we were able to make the page a lot faster.
 */
export default React.memo(RecordsetTable);
