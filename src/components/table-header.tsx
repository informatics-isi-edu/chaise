import '@chaise/assets/scss/_table-header.scss';
import useRecordset from '@chaise/hooks/recordset';
import { LogActions, LogReloadCauses } from '@chaise/models/log';

// components
import Dropdown from 'react-bootstrap/Dropdown';

const TableHeader = () => {
  const { totalRowCount, page, pageLimit, setPageLimit, update } = useRecordset();

  const pageLimits = [10, 25, 50, 75, 100, 200];

  // TODO

  // <span className={"glyphicon pull-right " + this.state.selectedPageLimit === limit ? 'glyphicon-ok' : 'glyphicon-invisible'}></span>
  const renderPageLimits = () => pageLimits.map((limit: number, index: number) => {
    return (<Dropdown.Item 
      as='li' 
      key={index} 
      className={'page-size-limit-' + limit}
      onClick={() => handlePageLimitChange(limit)}
    >
      <span>{limit} </span>
      {limit === pageLimit && <span className='fa-solid fa-check' style={{'float': 'right'}}></span>}
    </Dropdown.Item>)
  });

  const handlePageLimitChange: any = (value: any) => {
    // NOTE: 2 options, we can call `setPageLimit` and do some other changes in recordset provider to handle page size update
    //    other option is calling update(), but that doesn't take into account a potential change in pageLimit
    //      if I use update() after setPageLimit(), the page limit change isn't honored on first page limit change
    //      next page limit change honors the previous page limit change in this case
    setPageLimit(value);
    // const ref = page.reference;
    // const action = LogActions.PAGE_SIZE_SELECT;
    // const cause = LogReloadCauses.PAGE_LIMIT;
    
    // update(null, true, false, false, false, cause);
  }

  const renderPageSizeDropdown = () => {
    return (
      <Dropdown 
        as='button'
        className='page-size-dropdown chaise-btn chaise-btn-secondary'
      >
        <Dropdown.Toggle as='span'>{pageLimit}</Dropdown.Toggle>
        <Dropdown.Menu as='ul'>{renderPageLimits()}</Dropdown.Menu>
      </Dropdown>
    )
  }

  return (
    <div className='chaise-table-header row'>
      <div className={'chaise-table-header-total-count col-xs-12 col-sm-6' + (page && page.tuples.length > 0 ? ' with-page-size-dropdown' : '')}>
        {/* ng-className='{with-page-size-dropdown': vm.rowValues.length > 0}' */}
        <span className='displaying-text'>Displaying </span>
        {renderPageSizeDropdown()}
        <span className='total-count-text'>
          {typeof totalRowCount === 'number' ? `of ${totalRowCount.toLocaleString()} records` : ''}
          {/* <span className='prepended-label'>{{prependLabel()}}</span>
            <span ng-if='vm.rowValues.length > 0' uib-dropdown on-toggle='::pageSizeDropdownToggle(open)'>
                <button className='page-size-dropdown chaise-btn chaise-btn-secondary dropdown-toggle' type='button' uib-dropdown-toggle ng-disabled='!vm.hasLoaded || !vm.initialized || vm.pushMoreRowsPending'>
                    <span>25</span>
                    <span className='caret'></span>
                </button>
                <ul className='dropdown-menu dropdown-menu-left'>
                    <li ng-repeat='limit in pageLimits'>
                        <a className='page-size-limit-{{limit}}' href ng-click='setPageLimit(limit)'>{{ limit }}<span className='glyphicon pull-right' ng-className='vm.pageLimit === limit ? 'glyphicon-ok' : 'glyphicon-invisible''></span></a>
                    </li>
                </ul>
            </span>
            <span className='appended-label'>{{appendLabel()}}</span>
            <span ng-if='vm.countError' className='glyphicon glyphicon-alert' uib-tooltip='Request timeout: total count cannot be retrieved. Refresh the page later to try again.' tooltip-placement='bottom'></span>
            <span ng-show='vm.pushMoreRowsPending || (vm.config.displayMode.indexOf(recordsetDisplayModes.related) === 0 && !vm.hasLoaded)' className='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span> */}
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
