import '@chaise/assets/scss/_recordset.scss';

import React, { useState } from 'react';
import { RecordSetDisplayMode, RecordsetViewModel } from '@chaise/services/table';
import $log from '@chaise/services/logger';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { MESSAGE_MAP } from '@chaise/utils/message-map';
import SearchInput from '@chaise/components/search-input';
import { LogActions, LogReloadCauses } from '@chaise/models/log';
import { LogService } from '@chaise/services/log';
import Title from '@chaise/components/title';
import Export from '@chaise/components/export';

type RecordSetProps = {
  vm: RecordsetViewModel
};

const RecordSet = ({
  vm,
}: RecordSetProps): JSX.Element => {

  /**
   * TODO
   * we cannot just change the vm and expect a change...
   * if something is bound to change, it should be either properly
   * spelled out (passed into this separately) or add a state variable based on it
   *
   */
  const [facetPanelOpen, setFacetPanelOpen] = useState(vm.config.facetPanelOpen);
  const changeFacetPanelOpen = (value?: boolean) => {
    const val = typeof value === 'boolean' ? value : !vm.config.facetPanelOpen;
    vm.config.facetPanelOpen = val;
    setFacetPanelOpen(val);
  };


  const search = (term: string | undefined, action: LogActions) => {
    if (term) term = term.trim();

    const ref = vm.reference.search(term); // this will clear previous search first
    if (RecordsetViewModel.checkReferenceURL(ref)) {
      vm.search = term;
      vm.reference = ref;
      vm.lastActiveFacet = -1;
      $log.debug('counter', vm.flowControlObject.counter, ': new search term=' + term);

      // log the client action
      const extraInfo = typeof term === 'string' ? { 'search-str': term } : {};
      LogService.logClientAction({
        action: vm.getTableLogAction(action),
        stack: vm.getTableLogStack(null, extraInfo)
      }, vm.reference.defaultLogInfo);

      vm.update(true, true, true, false, LogReloadCauses.SEARCH_BOX);
    }
  }

  const panelClassName = vm.config.facetPanelOpen ? 'open-panel' : 'close-panel';

  const selectedRows = () => {
    return <></>
  };

  const selectedFacetFilters = () => {
    return <></>
  }

  const showFilterPanelBtn = () => {
    if (facetPanelOpen) {
      return;
    }
    return (
      <button className="show-filter-panel-btn chaise-btn chaise-btn-tertiary" onClick={() => changeFacetPanelOpen()}>
        <span className="chaise-btn-icon chaise-icon chaise-sidebar-open"></span>
        <span>Show filter panel</span>
      </button>
    )
  }

  return (
    <div className="recordset-container app-content-container">
      {/* <Spinner/> */}
      <div className='top-panel-container'>
        <div className='top-flex-panel'>
          <div className={`top-left-panel ${panelClassName}`}>
            <div className="panel-header">
              <div className="pull-left">
                <h3>Refine search</h3>
              </div>
              <div className="pull-right">
                <button
                  className="hide-filter-panel-btn chaise-btn chaise-btn-tertiary pull-right"
                  onClick={() => changeFacetPanelOpen()}
                >
                  <span className="chaise-icon chaise-sidebar-close"></span>
                  <span>Hide panel</span>
                </button>
              </div>
            </div>
          </div>

          <div className="top-right-panel">
            {vm.config.displayMode === RecordSetDisplayMode.FULLSCREEN &&
            <div className="recordset-title-container title-container">
              <div className="recordset-title-buttons title-buttons">
                <Export reference={vm.reference} disabled={!vm.hasLoaded || !vm.initialized || vm.rowValues.length == 0} />
                <OverlayTrigger placement='bottom' overlay={
                  <Tooltip>{MESSAGE_MAP.tooltip.permalink}</Tooltip>
                }
                >
                  <a id="permalink" className="chaise-btn chaise-btn-primary">
                    <span className="chaise-btn-icon fa-solid fa-bookmark" />
                    <span>Permalink</span>
                  </a>
                </OverlayTrigger>
                {/* <div ng-if="showSavedQueryUI && vm.savedQueryReference" className="chaise-btn-group" uib-dropdown>
                            <div tooltip-placement="top-right" uib-tooltip="{{tooltip.saveQuery}}">
                                <button id="save-query" className="chaise-btn chaise-btn-primary dropdown-toggle" ng-disabled="disableSavedQueryButton()" ng-click="logSavedQueryDropdownOpened()" uib-dropdown-toggle ng-style="{'pointer-events': disableSavedQueryButton() ? 'none' : ''}">
                                    <span className="chaise-btn-icon glyphicon glyphicon-floppy-save"></span>
                                    <span>Saved searches</span>
                                    <span className="caret "></span>
                                </button>
                            </div>
                            <ul className="dropdown-menu dropdown-menu-right" style="min-width:unset; top:20px;">
                                <li>
                                    <a ng-click="::saveQuery()">Save current search criteria</a>
                                    <a ng-click="::showSavedQueries()">Show saved search criteria</a>
                                </li>
                            </ul>
                        </div> */}

              </div>
              <h1 id="page-title">
                <Title addLink={false} reference={vm.reference}/>
                {/* TODO */}
                {/* <small ng-if="vm.reference && vm.reference.location.version" className="h3-class" tooltip-placement="bottom-left" uib-tooltip="{{::tooltip.versionTime}} {{versionDate()}}">({{versionDisplay()}})</small> */}
                {/* <span ng-if="vm.reference.commentDisplay == 'inline' && vm.reference.comment" className="inline-tooltip">{{vm.reference.comment}}</span> */}
              </h1>
            </div>
            }
            <div className="recordset-controls-container">
              {selectedRows()}
              <div className="row">
                <div className="recordset-main-search col-lg-4 col-md-5 col-sm-6 col-xs-6">
                  <SearchInput
                    searchTerm={vm.search}
                    searchCallback={search}
                    inputClass={'main-search-input'}
                    searchColumns={vm.reference.searchColumns}
                    disabled={false}
                    focus={true}
                  />
                </div>
              </div>
            </div>
            {selectedFacetFilters()}
            {showFilterPanelBtn()}
            {/* <table-header vm="vm"></table-header> */}
          </div>

        </div>
      </div>
      <div className='bottom-panel-container'>

      </div>
    </div>
  )
};

export default RecordSet;
