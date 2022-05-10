import '@chaise/assets/scss/_table-header.scss';
import useRecordset from '@chaise/hooks/recordset';

const TableHeader = () => {
  const { totalRowCount, pageLimit } = useRecordset();

  // TODO

  return (
    <div className='chaise-table-header row'>
      <div className='chaise-table-header-total-count col-xs-12 col-sm-6'>
        {/* ng-className='{with-page-size-dropdown': vm.rowValues.length > 0}' */}
        <span className='displaying-text'>Displaying </span>
        <span className='total-count-text'>
          {pageLimit.toLocaleString()} {typeof totalRowCount == 'number' ? `of ${totalRowCount.toLocaleString()} records` : ''}
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
