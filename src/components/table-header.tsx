import '@isrd-isi-edu/chaise/src/assets/scss/_table-header.scss';

// components
import Dropdown from 'react-bootstrap/Dropdown';

// models 
import { RecordsetDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordset';

// providers
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';

// utilities
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';

const TableHeader = (): JSX.Element => {
  const { colValues, config, page, pageLimit, reference, totalRowCount, update } = useRecordset();

  const pageLimits = [10, 25, 50, 75, 100, 200];

  const renderPageLimits = () => pageLimits.map((limit: number, index: number) => {
    return (<Dropdown.Item
      as='li'
      key={index}
      className={'page-size-limit-' + limit}
      onClick={() => handlePageLimitChange(limit)}
    >
      <span>{limit} </span>
      {limit === pageLimit && <span className='fa-solid fa-check' style={{ 'float': 'right' }}></span>}
    </Dropdown.Item>)
  });

  const handlePageLimitChange: any = (value: any) => {
    // const action = LogActions.PAGE_SIZE_SELECT;
    const cause = LogReloadCauses.PAGE_LIMIT;

    update(null, value, true, false, false, false, cause);
  }

  // the text that we should display before the page-size-dropdown
  const prependLabel = () => {
    if (page && page.tuples.length > 0) {
      // 2 options that are either defined (a reference) or not defined (null or undefined)
      // 2 options that are true/false gives 4 cases
      if (page.hasNext && !page.hasPrevious) return 'first';
      if (!page.hasNext && page.hasPrevious) return 'last';
      if (!page.hasNext && !page.hasPrevious) return 'all';

      // if page has both hasNext and hasPrevious, return nothing
      return;
    }
  }

  const renderPageSizeDropdown = () => {
    return (
      <Dropdown>
        <Dropdown.Toggle className='page-size-dropdown chaise-btn chaise-btn-secondary'>{pageLimit}</Dropdown.Toggle>
        <Dropdown.Menu as='ul'>{renderPageLimits()}</Dropdown.Menu>
      </Dropdown>
    )
  }

  // the text that we should display after the page-size-dropdown
  const appendLabel = () => {
    if (!page) return '';

    let recordsText = 'records';
    if (reference.location.isConstrained && config.displayMode.indexOf(RecordsetDisplayMode.RELATED) !== 0) {
      recordsText = 'matching results';
    }

    // if no tuples, return 0 count with recordsText
    if (page.tuples.length === 0) return '0 ' + recordsText;

    let label = '';
    // TODO: check tableError
    // if (totalRowCount && !vm.tableError) {
    if (totalRowCount) {
      label += 'of ';
      if (!colValues[0] || totalRowCount > colValues[0].length) {
        label += totalRowCount.toLocaleString() + ' ';
      } else {
        label += colValues[0].length.toLocaleString() + ' ';
      }
    }

    // if tuples, return label (counts text) with recordsText
    return label + recordsText;
  }

  return (
    <div className='chaise-table-header row'>
      <div className={'chaise-table-header-total-count col-xs-12 col-sm-6' + (page && page.tuples.length > 0 ? ' with-page-size-dropdown' : '')}>
        <span className='displaying-text'>Displaying {prependLabel()}</span>
        {renderPageSizeDropdown()}
        <span className='total-count-text'>
          {appendLabel()}
          {/* TODO: error handling for table data. Requests timed out (alert icon) and push more rows pending (loader icon)
            <span ng-if='vm.countError' className='glyphicon glyphicon-alert' uib-tooltip='Request timeout: total count cannot be retrieved. Refresh the page later to try again.' tooltip-placement='bottom'></span>
            <span ng-show='vm.pushMoreRowsPending || (vm.config.displayMode.indexOf(recordsetDisplayModes.related) === 0 && !vm.hasLoaded)' className='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span>
           */}
        </span>
      </div>
      <div className='col-xs-12 col-sm-6'>
        <div className='pull-right'>
          {/* <button ng-if='showAddRecord()'
                className='chaise-table-header-create-link chaise-btn'
                ng-className='vm.config.displayMode === recordsetDisplayModes.fullscreen ? 'chaise-btn-primary': 'chaise-btn-secondary''
                ng-click='addRecord()' tooltip-placement='bottom-right' uib-tooltip='Create new {{vm.displayname ? vm.displayname.value : vm.reference.displayname.value}}'>
                <span className='chaise-btn-icon glyphicon glyphicon-plus'></span>
                <span>{{config.displayMode === recordsetDisplayModes.fullscreen ? 'Create' : 'Create new'}}</span>
            </button>
            <button ng-if='vm.config.displayMode === recordsetDisplayModes.fullscreen && canUpdate()'
                className='chaise-table-header-edit-link chaise-btn chaise-btn-primary'
                ng-click='editRecord()' ng-disabled='{{vm.pageLimit > vm.RECORDEDIT_MAX_ROWS}}' tooltip-placement='bottom-right'
                uib-tooltip='{{ ((vm.pageLimit > vm.RECORDEDIT_MAX_ROWS) ? 'Editing disabled when items per page > ' + vm.RECORDEDIT_MAX_ROWS : 'Edit this page of records.' ) }}'>
                <span className='chaise-btn-icon glyphicon glyphicon-pencil'></span>
                <span>Bulk Edit</span>
            </button> */}
        </div>
      </div>
    </div>

  )
}

export default TableHeader;
