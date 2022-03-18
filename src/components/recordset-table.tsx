import '@chaise/assets/scss/_recordset-table.scss';
import { RecordSetConfig } from '@chaise/models/recordset';
import $log from '@chaise/services/logger';
import DisplayValue from '@chaise/components/display-value';
import { makeSafeIdAttr } from '@chaise/utils/string-utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { MESSAGE_MAP } from '@chaise/utils/message-map';

type RecordSetTableProps = {
  columnModels: any,
  page: any,
  isInitialized: boolean,
  config: RecordSetConfig,
  sortCallback?: Function
}

const RecordSetTable = ({
  columnModels,
  page,
  isInitialized,
  config,
  sortCallback
}: RecordSetTableProps): JSX.Element => {

  $log.debug('recordset-table: render');

  // TODO needs to be updated to use ellipsis and have all the functionalities,
  // I only did this to test the overall structure and flow-control logic

  const changeSort = (col: any) => {
    if (typeof sortCallback !== 'function') return;

    // TODO properly check if sorted by this column or not
    $log.debug('change sort');

    sortCallback(col.column.name, true);
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
    return (
      <span className='column-sort-icon'>
        {/* <span ng-show="vm.sortby==col.column.name" ng-switch="vm.sortOrder">
          <span ng-switch-when="asc" class="asc-sorted-icon fas fa-long-arrow-alt-up"></span>
          <span ng-switch-default class="desc-sorted-icon fas fa-long-arrow-alt-down"></span>
        </span> */}
        {/* <span ng-show="vm.sortby!==col.column.name"> */}
          <span className='not-sorted-icon fas fa-arrows-alt-v'></span>
        {/* </span> */}
      </span>
    )
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
            {canSort && renderColumnSortIcon(col)}
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
          {renderCells(tuple)}
        </tr>

      )
    })
  }

  const renderCells = (tuple: any) => {
    if (!tuple) return;
    return tuple.values.map((val: any, index: number) => {
      return (
        <td key={index}>
          <div className='showContent'>
            <DisplayValue addClass={true} value={{ value: val, isHTML: tuple.isHTML[index] }} />
          </div>
        </td>
      )
    })
  };

  const renderNextPreviousBtn = () => {
    return (
      <div className='chaise-table-pagination'>
        <button type='button' className='chaise-table-previous-btn chaise-btn chaise-btn-primary'>
          <span>Previous</span>
        </button>
        <button type='button' className='chaise-table-next-btn chaise-btn chaise-btn-primary'>
          <span>Next</span>
        </button>
      </div>
    )
  }

  return (
    <div className='recordset-table-container'>
      <div className='chaise-table-top-scroll-wrapper'>
        <div className='chaise-table-top-scroll'></div>
      </div>
      <div className='outer-table recordset-table'>
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

export default RecordSetTable;
