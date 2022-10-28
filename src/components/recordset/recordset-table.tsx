import '@isrd-isi-edu/chaise/src/assets/scss/_recordset-table.scss';
import { SortColumn, RecordsetConfig, RecordsetSelectMode, SelectedRow } from '@isrd-isi-edu/chaise/src/models/recordset';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import Spinner from 'react-bootstrap/Spinner';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { addTopHorizontalScroll } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import TableRow from '@isrd-isi-edu/chaise/src/components/recordset/table-row';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

type RecordsetTableProps = {
  config: RecordsetConfig,
  initialSortObject: any,
  sortCallback?: (sortColumn: SortColumn) => any
}

const RecordsetTable = ({
  config,
  initialSortObject
}: RecordsetTableProps): JSX.Element => {

  const {
    reference,
    isInitialized,
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

  const tableContainer = useRef<any>(null);

  const [currSortColumn, setCurrSortColumn] = useState<SortColumn | null>(
    Array.isArray(initialSortObject) ? initialSortObject[0] : null
  );

  /**
   * capture the state of selected and disabled of rows in here so
   * we don't have to populate this multiple times
   */
  let isRowSelected = Array(page ? page.length : 0).fill(false);
  if (page && page.length && Array.isArray(selectedRows) && selectedRows.length > 0) {
    isRowSelected = page.tuples.map((tuple: any) => (
      selectedRows.some((obj) => obj.uniqueId === tuple.uniqueId)
    ));
  }
  let isRowDisabled = Array(page ? page.length : 0).fill(false);
  if (page && page.length && Array.isArray(disabledRows) && disabledRows.length > 0) {
    isRowDisabled = page.tuples.map((tuple: any) => (
      disabledRows.some((obj) => obj.uniqueId === tuple.uniqueId)
    ));
  }

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
    if (!currSortColumn || !isInitialized) return;

    const ref = reference.sort([currSortColumn]);

    const success = update({ updateResult: true }, { reference: ref }, { cause: LogReloadCauses.SORT });

    if (success) {
      logRecordsetClientAction(LogActions.SORT, null, null, ref);
    }
  }, [currSortColumn]);

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
    }
  };

  /**
   * select all the rows that are displayed and are not disabled
   */
  const selectAllOnPage = () => {
    logRecordsetClientAction(LogActions.PAGE_SELECT_ALL);

    setSelectedRows((currRows: SelectedRow[]) => {
      const res: SelectedRow[] = Array.isArray(currRows) ? [...currRows] : [];
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
            {/* TODO test id changes to class */}
            <ChaiseTooltip
              placement='right'
              tooltip={'Select all rows on this page.'}
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
              tooltip={'Deselect all rows on this page.'}
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
      <th className={`actions-header${headerClassName ? ` ${headerClassName}`: ''}`}>{inner}</th>
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
              tooltip={col.column.comment}
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
                <span className='fa-solid fa-triangle-exclamation' style={{paddingLeft: '4px'}} />
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
      <div className='chaise-table-top-scroll-wrapper'>
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
      {renderNextPreviousBtn()}
    </div>
  )
}

export default RecordsetTable;
