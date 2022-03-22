import '@chaise/assets/scss/_recordset-table.scss';
import { SortColumn, RecordSetConfig } from '@chaise/models/recordset';
import $log from '@chaise/services/logger';
import DisplayValue from '@chaise/components/display-value';
import { makeSafeIdAttr } from '@chaise/utils/string-utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { MESSAGE_MAP } from '@chaise/utils/message-map';
import { useLayoutEffect, useRef, useState } from 'react';
import { addTopHorizontalScroll } from '../utils/ui-utils';

type RecordSetTableProps = {
  columnModels: any,
  page: any,
  rowValues: any,
  isInitialized: boolean,
  config: RecordSetConfig,
  sortCallback?: (sortColumn: SortColumn) => any,
  currSortColumn: SortColumn | null,
  nextPreviousCallback: (isNext: boolean) => any
}

const RecordSetTable = ({
  columnModels,
  page,
  rowValues,
  isInitialized,
  config,
  sortCallback,
  currSortColumn,
  nextPreviousCallback
}: RecordSetTableProps): JSX.Element => {

  $log.debug('recordset-table: render');

  // TODO needs to be updated to use ellipsis and have all the functionalities,
  // I only did this to test the overall structure and flow-control logic

  const tableContainer = useRef<any>(null);
  const [initialized, setInitialized] = useState(false);
  useLayoutEffect(()=> {
    if (tableContainer.current) {
      addTopHorizontalScroll(tableContainer.current);
    }
    setInitialized(true);
  }, [initialized])

  const changeSort = (col: any) => {
    if (typeof sortCallback !== 'function') return;

    // TODO properly check if sorted by this column or not
    $log.debug('change sort');

    /**
     * if the sort is based on current column and is ascending, then
     * toggle to descending.
     * otherwise sort ascending
     */
    const desc = currSortColumn?.column === col.column.name && !currSortColumn?.descending;
    sortCallback({'column':col.column.name, 'descending':desc});
  }

  const renderColumnError = () => {
    <OverlayTrigger
      placement='bottom'
      overlay={
        <Tooltip>{MESSAGE_MAP.queryTimeoutTooltip}</Tooltip>
      }
    >
      <span className='fa-solid fa-triangle-exclamation'/>
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
      const canSort = typeof sortCallback === 'function' && config.sortable
        && col.column.sortable && !col.hasError && !col.isLoading;

      return (
        <th
          key={index}
          className={'c_' + makeSafeIdAttr(col.column.name) + (canSort ? ' clickable' : '')}
          {...(canSort && { onClick: () => changeSort(col) })}
        >
          <span className='table-column-displayname' >
            <DisplayValue value={col.column.displayname} />
          </span>
          <span className='table-heading-icons'>
            {col.hasError && renderColumnError()}
            {!col.hasError && col.isLoading && <span className='fa-solid fa-rotate fa-spin' />}
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
    if (!page) return;

    if (page.length == 0) {
      return (
        <tr>
          <td colSpan={columnModels.length + 1} style={{ textAlign: 'center' }}>
            <span>No results found</span>
          </td>
        </tr>
      )
    }

    return page.tuples.map((tuple: any, index: number) => {
      return (
        <tr key={tuple.uniqueId} className='chaise-table-row' style={{ 'position': 'relative' }}>
          <td className='block action-btns'>
            <div className='chaise-btn-group'>
              <a
                type='button'
                className='view-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
                href={tuple.reference.contextualize.detailed.appLink}
              >
                <span className='chaise-btn-icon chaise-icon chaise-view-details'></span>
              </a>
            </div>
          </td>
          {renderCells(rowValues[index])}
        </tr>

      )
    })
  }

  const renderCells = (rowValue: any) => {
    if (!rowValue || rowValue.length == 0) return;
    return rowValue.map((val: any, index: number) => {
      return (
        <td key={index}>
          <div className='showContent'>
            <DisplayValue addClass={true} value={val} />
          </div>
        </td>
      )
    })
  };

  const renderNextPreviousBtn = () => {
    return (
      <div className='chaise-table-pagination'>
        <button
          type='button'
          className='chaise-table-previous-btn chaise-btn chaise-btn-primary'
          onClick={() => nextPreviousCallback(false)}
          disabled={!page || !page.hasPrevious}
        >
          <span>Previous</span>
        </button>
        <button
          type='button'
          className='chaise-table-next-btn chaise-btn chaise-btn-primary'
          onClick={() => nextPreviousCallback(true)}
          disabled={!page || !page.hasNext}
        >
          <span>Next</span>
        </button>
      </div>
    )
  }

  return (
    <div className='recordset-table-container' ref={tableContainer}>
      <div className='chaise-table-top-scroll-wrapper'>
        <div className='chaise-table-top-scroll'></div>
      </div>
      <div className='outer-table recordset-table chaise-hr-scrollable'>
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
      {isInitialized && renderNextPreviousBtn()}
    </div>
  )
}

if (process.env.NODE_ENV === 'development') {
  RecordSetTable.whyDidYouRender = true;
}

export default RecordSetTable;
