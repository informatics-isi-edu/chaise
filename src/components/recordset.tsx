import '@chaise/assets/scss/_recordset.scss';

import React, { useEffect, useState } from 'react';
import { RecordsetFlowControl } from '@chaise/services/table';
import $log from '@chaise/services/logger';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { MESSAGE_MAP } from '@chaise/utils/message-map';
import SearchInput from '@chaise/components/search-input';
import { LogActions, LogReloadCauses } from '@chaise/models/log';
import Title from '@chaise/components/title';
import Export from '@chaise/components/export';
import ChaiseSpinner from '@chaise/components/spinner';
import RecordSetTable from '@chaise/components/recordset-table';
import { attachContainerHeightSensors } from '@chaise/utils/ui-utils';
import { LogService } from '@chaise/services/log';
import { RecordSetConfig, RecordSetDisplayMode } from '@chaise/models/recordset';

export type RecordSetProps = {
  initialReference: any,
  config: RecordSetConfig,
  logInfo: {
    logObject?: any,
    logStack: any,
    logStackPath: string,
    logAppMode?: string
  },
  initialPageLimit?: number
};

const RecordSet = ({
  initialReference, config, logInfo, initialPageLimit
}: RecordSetProps): JSX.Element => {
  $log.debug('recordset comp: render');

  const [pageLimit, setPageLimit] = useState(typeof initialPageLimit === 'number' ? initialPageLimit : 25);

  /**
   * The reference that might be updated
   */
  const [reference, setStateReference] = useState<any>(initialReference);
  const setReference = (ref: any) => {
    flowControlObject.setReference(ref);
    setStateReference(ref);
  };

  /**
   * the columns used for search,
   * this list stays the same even when filter, etc changes
   */
  const searchColumns = initialReference.searchColumns;

  /**
   * The displayed search term
   */
  const [searchTerm, setSearchTerm] = useState<string>(initialReference.location.searchTerm);

  /**
   * The columns that should be displayed in the result table
   */
  const [columnModels, setColumnModels] = useState(
    initialReference.columns.map((col: any) => {
      return {
        column: col,
        isLoading: col.hasWaitFor === true || col.isUnique === false,
        hasError: false
      };
    })
  );

  /**
   * whether the component has initialized or not
   */
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * whether the data has been loaded or not
   */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * the page of data that should be displayed
   */
  const [page, setPage] = useState<any>(null);

  /**
   * whether the facet panel should be open or closed
   */
  const [facetPanelOpen, setFacetPanelOpen] = useState(config.facetPanelOpen);

  const [flowControlObject, setFlowControlDetails] = useState(new RecordsetFlowControl(
    reference,
    pageLimit,
    setIsLoading,
    page,
    setPage,
    setIsInitialized,
    logInfo,
    config.displayMode
  ));

  useEffect(() => {
    if (isInitialized) return;

    // TODO pass the proper values
    attachContainerHeightSensors();

    // TODO validate facetFilters

    // TODO save query stuff

    // initialize the data
    flowControlObject.initialize();
  }, [isInitialized]);


  /**
   * change the state of facet panel
   * @param value if given, it will force the state
   */
  const changeFacetPanelOpen = (value?: boolean) => {
    const val = typeof value === 'boolean' ? value : !facetPanelOpen;
    setFacetPanelOpen(val);
  };

  /**
   * Change the search term and trigger search
   * @param term string the search term
   * @param action string the log action
   */
  const changeSearch = (term: string | null, action: LogActions) => {
    if (term) term = term.trim();

    const ref = reference.search(term); // this will clear previous search first
    if (RecordsetFlowControl.checkReferenceURL(ref)) {
      setSearchTerm(term ? term : '');
      setReference(ref);
      // vm.lastActiveFacet = -1;
      $log.debug('counter', flowControlObject.flowControlDetails.counter, ': new search term=' + term);

      // log the client action
      const extraInfo = typeof term === 'string' ? { 'search-str': term } : {};

      LogService.logClientAction({
        action: flowControlObject.getTableLogAction(action),
        stack: flowControlObject.getTableLogStack(null, extraInfo)
      }, ref.defaultLogInfo);

      flowControlObject.update(true, true, true, false, LogReloadCauses.SEARCH_BOX);
    }
  };

  const changeSort = (column: string, desc: boolean) => {
    const ref = reference.sort([
      {'column': column, 'descending': desc}
    ]);
    if (RecordsetFlowControl.checkReferenceURL(ref)) {
      setReference(ref);

      $log.debug('counter', flowControlObject.flowControlDetails.counter, ': change sort');

      LogService.logClientAction({
        action: flowControlObject.getTableLogAction(LogActions.SORT),
        stack: flowControlObject.getTableLogStack()
      }, ref.defaultLogInfo);

      flowControlObject.update(true, false, false, false, LogReloadCauses.SORT);
    }
  }

  const panelClassName = facetPanelOpen ? 'open-panel' : 'close-panel';

  const renderSelectedRows = () => {
    return <></>
  };

  const renderSelectedFacetFilters = () => {
    return <></>
  }

  const renderShowFilterPanelBtn = () => {
    if (facetPanelOpen) {
      return;
    }
    return (
      <button className='show-filter-panel-btn chaise-btn chaise-btn-tertiary' onClick={() => changeFacetPanelOpen()}>
        <span className='chaise-btn-icon chaise-icon chaise-sidebar-open'></span>
        <span>Show filter panel</span>
      </button>
    )
  }

  return (
    <div className='recordset-container app-content-container'>
      {/* TODO what about $root.error and $root.showSpinner */}
      {
        (!isInitialized || isLoading) &&
        <ChaiseSpinner />
      }
      <div className='top-panel-container'>
        <div className='top-flex-panel'>
          <div className={`top-left-panel ${panelClassName}`}>
            <div className='panel-header'>
              <div className='pull-left'>
                <h3>Refine search</h3>
              </div>
              <div className='pull-right'>
                <button
                  className='hide-filter-panel-btn chaise-btn chaise-btn-tertiary pull-right'
                  onClick={() => changeFacetPanelOpen()}
                >
                  <span className='chaise-icon chaise-sidebar-close'></span>
                  <span>Hide panel</span>
                </button>
              </div>
            </div>
          </div>

          <div className='top-right-panel'>
            {config.displayMode === RecordSetDisplayMode.FULLSCREEN &&
              <div className='recordset-title-container title-container'>
                <div className='recordset-title-buttons title-buttons'>
                  <Export
                    reference={reference}
                    disabled={!isLoading || !isInitialized || !page || page.length === 0}
                  />
                  <OverlayTrigger placement='bottom' overlay={
                    <Tooltip>{MESSAGE_MAP.tooltip.permalink}</Tooltip>
                  }
                  >
                    <a id='permalink' className='chaise-btn chaise-btn-primary'>
                      <span className='chaise-btn-icon fa-solid fa-bookmark' />
                      <span>Permalink</span>
                    </a>
                  </OverlayTrigger>
                  {/* <div ng-if='showSavedQueryUI && vm.savedQueryReference' className='chaise-btn-group' uib-dropdown>
                            <div tooltip-placement='top-right' uib-tooltip='{{tooltip.saveQuery}}'>
                                <button id='save-query' className='chaise-btn chaise-btn-primary dropdown-toggle' ng-disabled='disableSavedQueryButton()' ng-click='logSavedQueryDropdownOpened()' uib-dropdown-toggle ng-style='{'pointer-events': disableSavedQueryButton() ? 'none' : ''}'>
                                    <span className='chaise-btn-icon glyphicon glyphicon-floppy-save'></span>
                                    <span>Saved searches</span>
                                    <span className='caret '></span>
                                </button>
                            </div>
                            <ul className='dropdown-menu dropdown-menu-right' style='min-width:unset; top:20px;'>
                                <li>
                                    <a ng-click='::saveQuery()'>Save current search criteria</a>
                                    <a ng-click='::showSavedQueries()'>Show saved search criteria</a>
                                </li>
                            </ul>
                        </div> */}

                </div>
                <h1 id='page-title'>
                  <Title addLink={false} reference={initialReference} />
                  {/* TODO */}
                  {/* <small ng-if='vm.reference && vm.reference.location.version' className='h3-class' tooltip-placement='bottom-left' uib-tooltip='{{::tooltip.versionTime}} {{versionDate()}}'>({{versionDisplay()}})</small> */}
                  {/* <span ng-if='vm.reference.commentDisplay == 'inline' && vm.reference.comment' className='inline-tooltip'>{{vm.reference.comment}}</span> */}
                </h1>
              </div>
            }
            <div className='recordset-controls-container'>
              {renderSelectedRows()}
              <div className='row'>
                <div className='recordset-main-search col-lg-4 col-md-5 col-sm-6 col-xs-6'>
                  <SearchInput
                    initialSearchTerm={searchTerm}
                    searchCallback={changeSearch}
                    inputClass={'main-search-input'}
                    searchColumns={searchColumns}
                    disabled={false}
                    focus={true}
                  />
                </div>
              </div>
            </div>
            {renderSelectedFacetFilters()}
            {renderShowFilterPanelBtn()}
            {/* <table-header vm='vm'></table-header> */}
          </div>

        </div>
      </div>
      <div className='bottom-panel-container'>
        <div className='side-panel-resizable'>
          {/* TODO faceting */}
        </div>
        <div className='main-container dynamic-padding'>
          <div className='main-body'>
            <RecordSetTable
              page={page}
              columnModels={columnModels}
              isInitialized={isInitialized}
              config={config}
              sortCallback={changeSort}
            />
          </div>
        </div>
      </div>
    </div>
  )
};

export default RecordSet;

