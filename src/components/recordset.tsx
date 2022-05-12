import '@chaise/assets/scss/_recordset.scss';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RecordsetFlowControl } from '@chaise/services/table';
import $log from '@chaise/services/logger';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { MESSAGE_MAP } from '@chaise/utils/message-map';
import SearchInput from '@chaise/components/search-input';
import { LogActions, LogReloadCauses, LogStackPaths } from '@chaise/models/log';
import Title from '@chaise/components/title';
import Export from '@chaise/components/export';
import ChaiseSpinner from '@chaise/components/spinner';
import RecordsetTable from '@chaise/components/recordset-table';
import { attachContainerHeightSensors, attachMainContainerPaddingSensor, copyToClipboard } from '@chaise/utils/ui-utils';
import { LogService } from '@chaise/services/log';
import { SortColumn, RecordsetConfig, RecordsetDisplayMode } from '@chaise/models/recordset';
import { URL_PATH_LENGTH_LIMIT } from '@chaise/utils/constants';
import { ConfigService } from '@chaise/services/config';
import Q from 'q';
import TypeUtils from '@chaise/utils/type-utils';
import { createRedirectLinkFromPath, getRecordsetLink } from '@chaise/utils/uri-utils';
import { getColumnValuesFromPage, getRowValuesFromPage } from '@chaise/utils/data-utils';
import { windowRef } from '@chaise/utils/window-ref';
import Footer from '@chaise/components/footer';
import Faceting from '@chaise/components/faceting';
import TableHeader from '@chaise/components/table-header';
import useError from '@chaise/hooks/error';
import useRecordset from '@chaise/hooks/recordset';
import useAlert from '@chaise/hooks/alerts';
import AlertsProvider, { ChaiseAlertType } from '@chaise/providers/alerts';
import Alerts from '@chaise/components/alerts';
import RecordsetProvider from '@chaise/providers/recordset';

/**
 * TODO
 * how should I do the client log stuff now?
 * what about the url length limitation.. it should scroll to top but I cannot do it in provider
 */


export type RecordsetProps = {
  initialReference: any,
  config: RecordsetConfig,
  logInfo: {
    logObject?: any,
    logStack: any,
    logStackPath: string,
    logAppMode?: string
  },
  initialPageLimit?: number,
  getFavorites?: Function,
  getDisabledTuples?: Function,
};

const Recordset = ({
  initialReference,
  config,
  logInfo,
  initialPageLimit,
  getFavorites,
  getDisabledTuples,
}: RecordsetProps): JSX.Element => {
  return (
    <AlertsProvider>
      <RecordsetProvider
        initialReference={initialReference}
        config={config}
        logInfo={logInfo}
        initialPageLimit={initialPageLimit}
        getDisabledTuples={getDisabledTuples}
        getFavorites={getFavorites}
      >
        <RecordsetInner
          initialReference={initialReference}
          config={config}
        />
      </RecordsetProvider>
    </AlertsProvider>
  );
};

/**
 * based on my understanding provider and the usage of context cannot be on the
 * same level, that's why the Recordset comp is just a wrapper that has all the
 * providers that we need.
 */
const RecordsetInner = ({
  initialReference,
  config
}: any): JSX.Element => {

  const { dispatchError } = useError();

  const {
    logRecordsetClientAction,
    reference,
    isLoading,
    page,
    isInitialized,
    initialize,
    update
  } = useRecordset();

  const {
    addAlert
  } = useAlert();

  /**
   * whether the facet panel should be open or closed
   * NOTE: will return false if faceting is disabled
   * default value is based on reference.display.facetPanelOpen
   * and if it's not defined, it will be:
   * - true: in fullscreen mode
   * - false: in any other modes
   */
  const [facetPanelOpen, setFacetPanelOpen] = useState<boolean>(() => {
    if (config.disableFaceting) return false;

    let res = initialReference.display.facetPanelOpen;
    if (typeof res !== 'boolean') {
      res = config.displayMode === RecordsetDisplayMode.FULLSCREEN;
    }
    return res;
  });

  /**
   * We have to validate the facets first, and then we can show them.
   */
  const [facetColumnsReady, setFacetColumnsReady] = useState(false);


  const mainContainer = useRef<any>(null);


  // initialize the recordset if it has not been done yet.
  useEffect(() => {
    if (isInitialized) {
      // must be done after the data has been loaded
      attachMainContainerPaddingSensor();
      return;
    }

    // TODO pass the proper values
    attachContainerHeightSensors();

    // capture and log the right click event on the permalink button
    // TODO
    const permalink = document.getElementById('permalink');
    if (permalink) {
      permalink.addEventListener('contextmenu', () => {
        logRecordsetClientAction(LogActions.PERMALINK_RIGHT);
      });
    }

    // if the faceting feature is disabled, then we don't need to generate facets
    if (config.disableFaceting) {
      initialize();
      return;
    }

    // NOTE this will affect the reference uri so it must be
    //      done before initializing recordset
    reference.generateFacetColumns().then((res: any) => {

      setFacetColumnsReady(true);

      // initialize the data
      initialize();

      /**
       * When there are issues in the given facet,
       * - recordset should just load the data based on the remaining
       *  facets that had no issue
       * - we should show an error and let users know that there were some
       *   issues.
       * - we should keep the browser location like original to allow users to
       *   refresh and try again. Also the issue might be happening because they
       *   are not logged in. So we should keep the location like original so after
       *   logging in they can get back to the page.
       * - Dismissing the error should change the browser location.
       */
      if (res.issues) {
        // TODO change the
        // var cb = function () {
        // updateLocation();
        // };
        // ErrorService.handleException(res.issues, false, false, cb, cb);
      } else {
        // TODO save query should just return a promise
      }

    }).catch((exception: any) => {
      $log.warn(exception);
      // TODO
      // setIsLoading(false);
      if (TypeUtils.isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
        exception.errorData.redirectUrl = createRedirectLinkFromPath(exception.errorData.redirectPath);
      }
      dispatchError({ error: exception });
    });

  }, [isInitialized]);

  useEffect(() => {
    if (isLoading) return;

    // scroll to top after load
    if (config.displayMode.indexOf(RecordsetDisplayMode.RELATED) !== 0) {
      scrollMainContainerToTop();
    }

    // change the url location in fullscreen mode
    if (config.displayMode.indexOf(RecordsetDisplayMode.FULLSCREEN) === 0) {
      windowRef.history.replaceState({}, '', getRecordsetLink(reference));
    }

  }, [isLoading]);

  const scrollMainContainerToTop = () => {
    if (!mainContainer.current) return;

    mainContainer.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  //-------------------  UI related functions:   --------------------//

  const recordsetLink = getRecordsetLink();

  const copyPermalink = () => {
    logRecordsetClientAction(LogActions.PERMALINK_LEFT);

    copyToClipboard(recordsetLink);
  }

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
    // TODO added for test, should be removed
    $log.info('adding alert!!');
    addAlert('Search initiated', ChaiseAlertType.INFO, () => {
      $log.info('removed!');
    });
    $log.log(`search with term: ${term}, action : ${action}`);
    if (term) term = term.trim();

    const ref = reference.search(term); // this will clear previous search first
    // TODO
    // if (checkReferenceURL(ref)) {
      // vm.lastActiveFacet = -1;
      // printDebugMessage(`new search term=${term}`);

      // TODO
      // log the client action
      // const extraInfo = typeof term === 'string' ? { 'search-str': term } : {};

      // TODO
      // LogService.logClientAction({
      //   action: flowControl.current.getTableLogAction(action),
      //   stack: flowControl.current.getTableLogStack(null, extraInfo)
      // }, ref.defaultLogInfo);

      update(ref, null, true, true, true, false, LogReloadCauses.SEARCH_BOX);
    // }
  };

  const panelClassName = facetPanelOpen ? 'open-panel' : 'close-panel';

  const renderSelectedRows = () => {
    return <></>
  };

  const renderSelectedFacetFilters = () => {
    return <></>
  }

  const renderShowFilterPanelBtn = () => {
    if (facetPanelOpen || !config.showFaceting || config.disableFaceting) {
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
        isLoading &&
        <ChaiseSpinner />
      }
      <div className='top-panel-container'>
        {/* recordset level alerts */}
        <Alerts />
        <div className='top-flex-panel'>
          <div className={`top-left-panel ${panelClassName}`}>
            <div className='panel-header'>
              <div>
                <h3>Refine search</h3>
              </div>
              <div>
                <button
                  className='hide-filter-panel-btn chaise-btn chaise-btn-tertiary pull-right'
                  onClick={() => changeFacetPanelOpen()}
                >
                  <span className='chaise-btn-icon chaise-icon chaise-sidebar-close'></span>
                  <span>Hide panel</span>
                </button>
              </div>
            </div>
          </div>

          <div className='top-right-panel'>
            {config.displayMode === RecordsetDisplayMode.FULLSCREEN &&
              <div className='recordset-title-container title-container'>
                <div className='recordset-title-buttons title-buttons'>
                  <Export
                    reference={reference}
                    disabled={isLoading || !page || page.length === 0}
                  />
                  <OverlayTrigger placement='bottom' overlay={
                    <Tooltip>{MESSAGE_MAP.tooltip.permalink}</Tooltip>
                  }
                  >
                    <a
                      id='permalink'
                      className='chaise-btn chaise-btn-primary'
                      href={recordsetLink}
                      onClick={copyPermalink}
                    >
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
                  {/* TODO requires moment or something similar */}
                  {/* {reference && reference.location.version &&
                    <OverlayTrigger placement='bottom' overlay={
                      <Tooltip>{MESSAGE_MAP.tooltip.versionTime + versionDisplay()}</Tooltip>
                    }
                    >
                      <small className='h3-class'>({{versionDisplay()}})</small>
                    </OverlayTrigger>
                  } */}
                  {reference.commentDisplay === 'inline' && reference.comment &&
                    <span className='inline-tooltip'>reference.comment</span>
                  }
                </h1>
              </div>
            }
            <div className='recordset-controls-container'>
              {renderSelectedRows()}
              <div className='row'>
                <div className='recordset-main-search col-lg-4 col-md-5 col-sm-6 col-xs-6'>
                  <SearchInput
                    initialSearchTerm={initialReference.location.searchTerm}
                    searchCallback={changeSearch}
                    inputClass={'main-search-input'}
                    searchColumns={initialReference.searchColumns}
                    disabled={false}
                    focus={true}
                  />
                </div>
              </div>
            </div>
            {renderSelectedFacetFilters()}
            {renderShowFilterPanelBtn()}
            <TableHeader />
          </div>

        </div>
      </div>
      <div className='bottom-panel-container'>
        {
          facetColumnsReady &&
          <div
            className={'side-panel-resizable ' + panelClassName}
            style={{ visibility: config.showFaceting ? 'visible' : 'hidden' }}
          >
            <div className='side-panel-container'>
              <Faceting reference={reference} />
            </div>
          </div>
        }
        <div className='main-container dynamic-padding' ref={mainContainer}>
          <div className='main-body'>
            <RecordsetTable
              config={config}
              initialSortObject={initialReference.location.sortObject}
            />
          </div>
          {config.displayMode === RecordsetDisplayMode.FULLSCREEN && <Footer />}
        </div>
      </div>
    </div>
  )
};

export default Recordset;

