import '@isrd-isi-edu/chaise/src/assets/scss/_table-header.scss';

// components
import Dropdown from 'react-bootstrap/Dropdown';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';

// models 
import { RecordsetConfig, RecordsetDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordset';

// providers
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';

// utilities
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { RECORDEDIT_MAX_ROWS } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getRandomInt } from '@isrd-isi-edu/chaise/src/utils/math-utils';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

type TableHeaderProps = {
  config: RecordsetConfig
}

const TableHeader = ({ config }: TableHeaderProps): JSX.Element => {
  const { logRecordsetClientAction, colValues, page, pageLimit, reference, totalRowCount, update } = useRecordset();

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

  /**
   * on click of create button generate referrer id, construct the link and open in new tab
   */
  const addRecord = () => {
    const referrer_id = 'recordset-' + getRandomInt(0, Number.MAX_SAFE_INTEGER);
    const newRef = reference.table?.reference?.contextualize?.entryCreate;
    let appLink = newRef.appLink;

    if (appLink) {
      appLink = appLink + (appLink.indexOf('?') === -1 ? '?' : '&') +
      'invalidate=' + fixedEncodeURIComponent(referrer_id);

      if (config.displayMode !== RecordsetDisplayMode.FULLSCREEN) {
        logRecordsetClientAction(LogActions.ADD_INTEND);
      }

      windowRef.open(appLink, '_blank');
    }
  };

  /**
   * navigate on click of edit button
   */
  const editRecord = () => {
    let link = reference.contextualize?.entryEdit?.appLink;

    if (link.indexOf('?limit=') === -1 && link.indexOf('&limit=') === -1)
      link = link + (link.indexOf('?') === -1 ? '?limit=' : '&limit=') + pageLimit;

    location.href = link;
  };

  /**
   * whether to display create button
   */
  const shouldShowCreateButton = () => {
    const isAddableDisplayMode = config.displayMode.indexOf(RecordsetDisplayMode.RELATED) !== 0 
      && config.displayMode !== RecordsetDisplayMode.PURE_BINARY_POPUP_UNLINK;

    return isAddableDisplayMode && config.editable && reference && reference.canCreate;
  }

  /**
   * whether to display edit button
   */
  const shouldShowEditButton = () => {
    return config.displayMode === RecordsetDisplayMode.FULLSCREEN && canUpdate();
  }

  /**
   * whether to disable edit button (check if pagelimit is more than maximum allowed)
   */
  const shouldEditButtonDisabled = () => {
    return pageLimit > RECORDEDIT_MAX_ROWS;
  }

  /**
   * Condition to make sure at least one row can be updated
   */
  const canUpdate = () => {
    const res = config.editable && page && reference && reference.canUpdate;

    if (res) {
      return page.tuples.some(function (row: any) {
        return row.canUpdate;
      });
    }
    return false;
  };

  return (
    <div className='chaise-table-header row'>
      <div
        className={
          'chaise-table-header-total-count col-xs-12 col-sm-6' +
          (page && page.tuples.length > 0 ? ' with-page-size-dropdown' : '')
        }
      >
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
        <div
          className='chaise-table-header-buttons'
        >
          {shouldShowCreateButton() && (
            <OverlayTrigger
              placement='bottom-end'
              overlay={
                <Tooltip>
                  Create new{' '}
                  <DisplayValue value={reference.displayname} />
                </Tooltip>
              }
            >
              <span className='chaise-table-header-buttons-span'>
                <Button
                  className={`chaise-btn  ${config.displayMode === RecordsetDisplayMode.FULLSCREEN ? 'chaise-btn-primary' : 'chaise-btn-secondary'}`}
                  onClick={addRecord}
                >
                  <span className='chaise-btn-icon fa-solid fa-plus' />
                  <span>{config.displayMode === RecordsetDisplayMode.FULLSCREEN ? 'Create' : 'Create new'}</span>
                </Button>
              </span>
            </OverlayTrigger>
          )}

          {/* Edit Button */}
          {shouldShowEditButton() && (
            <OverlayTrigger
              placement='bottom-end'
              overlay={
                <Tooltip>
                  {shouldEditButtonDisabled() ? `Editing disabled when items per page > ${RECORDEDIT_MAX_ROWS}` : 'Edit this page for records.'}
                </Tooltip>
              }
            >
              <span>
                <Button
                  className='chaise-btn chaise-btn-primary'
                  onClick={editRecord}
                  disabled={shouldEditButtonDisabled()}
                >
                  <span className='chaise-btn-icon fa-solid fa-pen' />
                  <span>Bulk Edit</span>
                </Button>
              </span>
            </OverlayTrigger>
          )}
        </div>
      </div>
    </div>
  );
}

export default TableHeader;
