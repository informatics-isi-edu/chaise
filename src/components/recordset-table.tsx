import '@isrd-isi-edu/chaise/src/assets/scss/_recordset-table.scss';
import { SortColumn, RecordsetConfig } from '@isrd-isi-edu/chaise/src/models/recordset';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { addTopHorizontalScroll } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import TableRow from '@isrd-isi-edu/chaise/src/components/table-row';

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
    page,
    columnModels,
    colValues,
    update
  } = useRecordset();

  // TODO needs to be updated to use ellipsis and have all the functionalities,
  // I only did this to test the overall structure and flow-control logic

  const tableContainer = useRef<any>(null);

  const [currSortColumn, setCurrSortColumn] = useState<SortColumn | null>(
    Array.isArray(initialSortObject) ? initialSortObject[0] : null
  );

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
    // if (checkReferenceURL(ref)) {

      //  TODO
      // printDebugMessage('change sort');

      // LogService.logClientAction({
      //   action: flowControl.current.getTableLogAction(LogActions.SORT),
      //   stack: flowControl.current.getTableLogStack()
      // }, ref.defaultLogInfo);

      update(ref, null, true, false, false, false, LogReloadCauses.SORT);
    // }
  }, [currSortColumn]);

  const changeSort = (col: any) => {
    /**
     * if the sort is based on current column and is ascending, then
     * toggle to descending.
     * otherwise sort ascending
     */
    const desc = currSortColumn?.column === col.column.name && !currSortColumn?.descending;
    setCurrSortColumn({ 'column': col.column.name, 'descending': desc });
  }

  const changePage = (isNext: boolean) => {
    const ref = isNext ? page.next : page.previous;
    const action = isNext ? LogActions.PAGE_NEXT : LogActions.PAGE_PREV;
    const cause = isNext ? LogReloadCauses.PAGE_NEXT : LogReloadCauses.PAGE_PREV;
    // TODO
    // if (ref && checkReferenceURL(ref)) {

      //  TODO
      // printDebugMessage('request for previous page');

      // LogService.logClientAction(
      //   {
      //     action: flowControl.current.getTableLogAction(action),
      //     stack: flowControl.current.getTableLogStack()
      //   },
      //   reference.defaultLogInfo
      // );

      update(ref, null, true, false, false, false, cause);
    // }
  }

  const renderColumnError = () => {
    <OverlayTrigger
      placement='bottom'
      overlay={
        <Tooltip>{MESSAGE_MAP.queryTimeoutTooltip}</Tooltip>
      }
    >
      <span className='fa-solid fa-triangle-exclamation' />
    </OverlayTrigger>
  };

  const renderColumnSortIcon = (col: any) => {
    if (!currSortColumn || currSortColumn.column != col.column.name) {
      return <span className='not-sorted-icon fas fa-arrows-alt-v'></span>;
    }

    const upOrDown = currSortColumn.descending ? 'down desc-sorted-icon' : 'up asc-sorted-icon';
    return <span className={'fas fa-long-arrow-alt-' + upOrDown}></span>;
  };

  const renderColumnHeaders = () => {
    return columnModels.map((col: any, index: number) => {
      const canSort = config.sortable && col.column.sortable && !col.hasError && !col.isLoading;

      const headerClassName = `table-column-displayname${col.column.comment ? ' chaise-icon-for-tooltip' : ''}`
      return (
        <th
          key={index}
          className={'c_' + makeSafeIdAttr(col.column.name) + (canSort ? ' clickable' : '')}
          {...(canSort && { onClick: () => changeSort(col) })}
        >
          <span className={headerClassName} >
            <DisplayValue value={col.column.displayname} />
            {col.column.comment ? ' ' : ''}
          </span>
          <span className='table-heading-icons'>
            {col.hasError && renderColumnError()}
            {!col.hasError && col.isLoading && <span className='fa-solid fa-rotate fa-spin aggregate-col-loader' />}
            {
              canSort &&
              <span className='column-sort-icon'>{renderColumnSortIcon(col)}</span>
            }
          </span>
        </th>
      )
    })
  }

  const renderRows = () => {
    // we need to check colValues since they might be set in different times
    if (!page) return;

    if (page.length === 0) {
      return (
        <tr>
          <td colSpan={columnModels.length + 1} style={{ textAlign: 'center' }}>
            <span>No results found</span>
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
              <th className='actions-header view-header'>
                <span className='chaise-icon-for-tooltip'>View </span>
              </th>
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
