import '@chaise/assets/scss/_recordset-table.scss';
import { SortColumn, RecordSetConfig } from '@chaise/models/recordset';
import $log from '@chaise/services/logger';
import DisplayValue from '@chaise/components/display-value';
import { makeSafeIdAttr } from '@chaise/utils/string-utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { MESSAGE_MAP } from '@chaise/utils/message-map';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { addTopHorizontalScroll } from '@chaise/utils/ui-utils';

type RecordSetTableProps = {
  columnModels: any,
  page: any,
  // rowValues: any,
  colValues: any,
  config: RecordSetConfig,
  initialSortObject: any,
  sortCallback?: (sortColumn: SortColumn) => any,
  nextPreviousCallback: (isNext: boolean) => any
}

const RecordSetTable = ({
  columnModels,
  page,
  // rowValues,
  colValues,
  config,
  initialSortObject,
  sortCallback,
  nextPreviousCallback
}: RecordSetTableProps): JSX.Element => {

  // TODO needs to be updated to use ellipsis and have all the functionalities,
  // I only did this to test the overall structure and flow-control logic

  const tableContainer = useRef<any>(null);

  const [currSortColumn, setCurrSortColumn] = useState<SortColumn|null>(
    Array.isArray(initialSortObject) ? initialSortObject[0] : null
  );
  const [initialized, setInitialized] = useState(false);

  useLayoutEffect(()=> {
    if (tableContainer.current) {
      addTopHorizontalScroll(tableContainer.current);
    }
    setInitialized(true);
  }, [initialized]);

  // when sort column has changed, call the callback
  useEffect( () => {
    if (typeof sortCallback !== 'function' || !initialized || !currSortColumn) return;

    sortCallback(currSortColumn);
  }, [currSortColumn]);

  const changeSort = (col: any) => {
    if (typeof sortCallback !== 'function') return;

    /**
     * if the sort is based on current column and is ascending, then
     * toggle to descending.
     * otherwise sort ascending
     */
    const desc = currSortColumn?.column === col.column.name && !currSortColumn?.descending;
    setCurrSortColumn({'column':col.column.name, 'descending':desc});
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
      return (
        <tr key={tuple.uniqueId} className='chaise-table-row' style={{ 'position': 'relative' }}>
          <td className='block action-btns'>
            <div className='chaise-btn-group'>
              {config.viewable &&
                <a
                  type='button'
                  className='view-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
                  href={tuple.reference.contextualize.detailed.appLink}
                >
                  <span className='chaise-btn-icon chaise-icon chaise-view-details'></span>
                </a>
              }
              {/* TODO edit */}
              {/* TODO delete */}
              {/* TODO select */}
            </div>
          </td>
          {renderCells(index)}
        </tr>

      )
    })
  }

  // const renderCells = (tuple: any) => {
  //   return tuple.values.map((val: any, index: number) => {
  //     return (
  //       <td key={tuple.uniqueId + '-' + index}>
  //         <div className='showContent'>
  //           <DisplayValue addClass={true} value={{value: val, isHTML: tuple.isHTML[index]}} />
  //         </div>
  //       </td>
  //     )
  //   })
  // };

  // const renderCells = (rowValue: any) => {
  //   if (!rowValue || rowValue.length == 0) return;
  //   return rowValue.map((val: any, index: number) => {
  //     return (
  //       <td key={index}>
  //         <div className='showContent'>
  //           <DisplayValue addClass={true} value={val} />
  //         </div>
  //       </td>
  //     )
  //   })
  // };

  const renderCells = (rowIndex: number) => {
    return colValues.map( (colVal: any, colIndex: number) => {
      return (
        <td key={rowIndex + '-' + colIndex}>
          {/* TODO ellipsis logic */}
          <div className='showContent'>
            <DisplayValue addClass={true} value={colVal[rowIndex]} />
          </div>
        </td>
      )
    });
  }

  const renderNextPreviousBtn = () => {
    if (!page) return;
    return (
      <div className='chaise-table-pagination'>
        <button
          type='button'
          className='chaise-table-previous-btn chaise-btn chaise-btn-primary'
          onClick={() => nextPreviousCallback(false)}
          disabled={!page.hasPrevious}
        >
          <span>Previous</span>
        </button>
        <button
          type='button'
          className='chaise-table-next-btn chaise-btn chaise-btn-primary'
          onClick={() => nextPreviousCallback(true)}
          disabled={!page.hasNext}
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
      {renderNextPreviousBtn()}
    </div>
  )
}

export default RecordSetTable;
