import '@isrd-isi-edu/chaise/src/assets/scss/_recordset-table.scss';
import { SortColumn, RecordsetConfig, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { addTopHorizontalScroll } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import TableRow from '@isrd-isi-edu/chaise/src/components/table-row';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { isAccordionItemSelected } from 'react-bootstrap/esm/AccordionContext';

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
    selectedRows,
    setSelectedRows,
    disabledRows,
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
  };

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
  };

  const selectAllOnPage = () => {
    // logService.logClientAction(
    //   {
    //     action: getTableLogAction(scope.vm, logService.logActions.PAGE_SELECT_ALL),
    //     stack: getTableLogStack(scope.vm)
    //   },
    //   scope.vm.reference.defaultLogInfo
    // );

    return;
  };

  const selectNoneOnPage = () => {
    return;
  };

  const isSelected = (tuple: any) => {
    if (!tuple || !Array.isArray(selectedRows) || selectedRows.length === 0) {
      return false;
    }
    return selectedRows.some((obj) => {
        return obj.uniqueId === tuple.uniqueId;
    });
  };

  const isDisabled = (tuple: any) => {
    if (!tuple || !Array.isArray(disabledRows) || disabledRows.length === 0) {
      return false;
    }
    return disabledRows.some((obj) => {
      return obj.uniqueId === tuple.uniqueId;
    });
  }

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
              tooltip={'Select all rows on this page'}
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
              tooltip={'Deselect all rows on this page'}
            >
              <button className='table-select-all-rows chaise-btn chaise-btn-secondary chaise-btn-sm'
                type='button' onClick={selectNoneOnPage}
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
      <th className={`actions-header ${headerClassName}`}>{inner}</th>
    )
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
            <OverlayTrigger
              placement='top'
              overlay={<Tooltip>{col.column.comment}</Tooltip>}
            >
              {renderDisplayValue(col.column)}
            </OverlayTrigger> :
            // no comment, no tooltip
            renderDisplayValue(col.column)
          }
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
          showActionButtons={showActionButtons}
          selected={isSelected(tuple)}
          disabled={isDisabled(tuple)}
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
