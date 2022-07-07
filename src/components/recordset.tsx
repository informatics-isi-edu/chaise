import '@isrd-isi-edu/chaise/src/assets/scss/_recordset.scss';

import React, { useEffect, useRef, useState } from 'react';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import SearchInput from '@isrd-isi-edu/chaise/src/components/search-input';
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import Export from '@isrd-isi-edu/chaise/src/components/export';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import RecordsetTable from '@isrd-isi-edu/chaise/src/components/recordset-table';
import { attachContainerHeightSensors, attachMainContainerPaddingSensor, copyToClipboard } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode, SelectedChiclet } from '@isrd-isi-edu/chaise/src/models/recordset';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { createRedirectLinkFromPath, getRecordsetLink, transformCustomFilter } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import Faceting from '@isrd-isi-edu/chaise/src/components/faceting';
import TableHeader from '@isrd-isi-edu/chaise/src/components/table-header';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import RecordsetProvider from '@isrd-isi-edu/chaise/src/providers/recordset';
import FilterChiclet from '@isrd-isi-edu/chaise/src/components/filter-chiclet';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import SplitView from '@isrd-isi-edu/chaise/src/components/resizable';
import { CookieService } from '@isrd-isi-edu/chaise/src/services/cookie';
import SelectedChiclets from '@isrd-isi-edu/chaise/src/components/selected-chiclets';
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
  initialSelectedRows?: any, // TODO
  onSelectedRowsChanged?: Function,
  onFavoritesChanged?: Function,
  parentReference?: any,
  parentTuple?: any
};

const Recordset = ({
  initialReference,
  config,
  logInfo,
  initialPageLimit,
  getFavorites,
  getDisabledTuples,
  initialSelectedRows,
  onSelectedRowsChanged,
  onFavoritesChanged
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
        initialSelectedRows={initialSelectedRows}
        onSelectedRowsChanged={onSelectedRowsChanged}
        onFavoritesChanged={onFavoritesChanged}
      >
        <RecordsetInner
          initialReference={initialReference}
          config={config}
        />
      </RecordsetProvider>
    </AlertsProvider>
  );
};

type RecordsetInnerProps = {
  initialReference: any,
  config: RecordsetConfig
};

/**
 * based on my understanding provider and the usage of context cannot be on the
 * same level, that's why the Recordset comp is just a wrapper that has all the
 * providers that we need.
 */
const RecordsetInner = ({
  initialReference,
  config
}: RecordsetInnerProps): JSX.Element => {

  const { dispatchError } = useError();

  const {
    logRecordsetClientAction,
    reference,
    isLoading,
    page,
    isInitialized,
    initialize,
    selectedRows,
    setSelectedRows,
    update
  } = useRecordset();

  /**
   * whether the facet panel should be open or closed
   * NOTE: will return false if faceting is disabled or should be hidden
   * default value is based on reference.display.facetPanelOpen
   * and if it's not defined, it will be:
   * - true: in fullscreen mode
   * - false: in any other modes
   */
  const [facetPanelOpen, setFacetPanelOpen] = useState<boolean>(() => {
    if (config.disableFaceting || !config.showFaceting) return false;

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

  const mainContainer = useRef<HTMLDivElement>(null);
  const topLeftContainer = useRef<HTMLDivElement>(null);

  /**
   * The callbacks from faceting.tsx that we will use here
   */
  const facetCallbacks = useRef<{
    getAppliedFilters: Function,
    removeAppliedFilters: Function,
    focusOnFacet: Function,
  } | null>(null);

  const clearSearch = useRef<() => void>(null);



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

      // facet will call initialize when it's fully loaded

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
      if (isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
        exception.errorData.redirectUrl = createRedirectLinkFromPath(exception.errorData.redirectPath);
      }
      dispatchError({ error: exception });
    });

  }, [isInitialized]);

  // after data loads, scroll to top and change the browser location
  useEffect(() => {
    const handleResizeEvent = ((event: CustomEvent) => {
      event.preventDefault();
      if (topLeftContainer?.current && event?.detail?.width) {
        topLeftContainer.current.style.width = `${event.detail.width}px`;
      }
    }) as EventListener;

    document.addEventListener('resizable-width-change', handleResizeEvent);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('resizable-width-change', handleResizeEvent);
      window.removeEventListener('focus', onFocus);
    }
  }, []);

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

  /**
   * On window focus, remove request and update the page
   */
  const onFocus = () => {
    let completed = 0;
    const allCookies = CookieService.getAllCookies();

    const recordRequests = allCookies.filter(c => c.trim().startsWith('recordset-'));

    for (const referrerId of recordRequests) {
      const cookieName = referrerId.split('=')[0].trim();
      CookieService.deleteCookie(cookieName);
      completed += 1;
    }

    if (completed > 0) {
      const cause = completed ? LogReloadCauses.ENTITY_CREATE : LogReloadCauses.ENTITY_UPDATE;

      update(null, null, true, true, true, false, cause);
    }
  };

  //------------------- UI related functions: --------------------//

  /**
   * The callbacks from faceting.tsx that are used in this component
   */
  const registerCallbacksFromFaceting = (getAppliedFilters: Function, removeAppliedFilters: Function, focusOnFacet: Function) => {
    facetCallbacks.current = { getAppliedFilters, removeAppliedFilters, focusOnFacet };
  }

  const clearAllFilters = () => {
    if (clearSearch && clearSearch.current) {
      clearSearch.current();
    }

    // ask flow control to remove all the applied filters
    facetCallbacks.current!.removeAppliedFilters();
  }

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

  /**
   * The callback to clear selected rows
   * @param row the selected row. If null, we will clear all the selected rows
   * @param event the event object
   */
  const clearSelectedRow = (row: SelectedChiclet | null, event: any) => {
    if (!row) {
      setSelectedRows([]);
    } else {
      setSelectedRows((currRows: any) => {
        const res = Array.isArray(currRows) ? [...currRows] : [];
        return res.filter((obj: any) => obj.uniqueId !== row.uniqueId);
      });
    }
  };

  //-------------------  render logics:   --------------------//

  const panelClassName = facetPanelOpen ? 'open-panel' : 'close-panel';


  const renderSelectedFilterChiclets = () => {
    if (!facetCallbacks.current) {
      return;
    }
    const loc = reference.location;

    if (!loc) return;
    const hasFilter = loc.filter;
    const hasFacets = loc.facets && loc.facets.hasNonSearchBoxVisibleFilters;
    const hasCustomFacets = loc.customFacets && loc.customFacets.displayname;
    // don't show clear all filters when the custom facet is not removable
    const showClearAll = hasFilter || hasFacets || (hasCustomFacets && loc.customFacets.removable);

    // if there aren't any filters, don't show the container at all
    if (!hasFilter && !hasCustomFacets && !hasFacets) return;

    // the displayed chiclets
    const chiclets: JSX.Element[] = [];

    // filters
    if (hasFilter) {
      chiclets.push(
        <FilterChiclet
          key='filters'
          identifier={'filters'}
          iconTooltip={'Clear custom filter applied'}
          title={'Custom Filter'}
          value={transformCustomFilter(loc.filtersString)}
          onRemove={(identifier) => facetCallbacks.current!.removeAppliedFilters(identifier)}
        />
      );
    }

    // cfacets
    if (hasCustomFacets) {
      const cFacetRemovable = loc.customFacets.removable;
      chiclets.push(
        <FilterChiclet
          key='cfacets'
          identifier={'cfacets'}
          iconTooltip={cFacetRemovable ? 'Clear custom filter applied' : 'Predefined filter(s)'}
          // when it's not removable we're showing the icon and that's enough
          title={cFacetRemovable ? 'Custom Filter' : undefined}
          value={transformCustomFilter(loc.filter)}
          onRemove={cFacetRemovable ? (identifier) => facetCallbacks.current!.removeAppliedFilters(identifier) : undefined}
        />
      );
    }

    // facets
    if (hasFacets) {
      const facetAppliedFilters = facetCallbacks.current.getAppliedFilters();
      if (Array.isArray(facetAppliedFilters)) {
        facetAppliedFilters.forEach((faf: any, facetIndex: number) => {
          if (faf.length === 0) return;

          const facetDisplayname = reference.facetColumns[facetIndex].displayname;
          const chicletValue: JSX.Element[] = [];
          const chicletValueTooltip: JSX.Element[] = [];

          faf.forEach((f: any, filterIndex: number) => {
            // comma-separated values
            chicletValue.push(
              <span key={f.uniqueId}>
                <DisplayValue value={f.displayname} specialNullEmpty={true} />
                {(filterIndex !== faf.length - 1) && <span>, </span>}
              </span>
            );

            // tooltip is using bullet icon as a separator
            chicletValueTooltip.push(
              <span key={f.uniqueId}>
                <span style={{ 'marginRight': '2px', 'marginLeft': '3px', 'color': 'whitesmoke' }}>&bull;</span>
                <DisplayValue value={f.displayname} specialNullEmpty={true} />
              </span>
            )
          });

          chiclets.push(
            <FilterChiclet
              key={`facet-${facetIndex}`}
              identifier={facetIndex}
              iconTooltip={'Clear filter applied'}
              title={facetDisplayname}
              titleTooltip={<span>Go to <DisplayValue value={facetDisplayname} /> filter</span>}
              value={chicletValue}
              valueTooltip={chicletValueTooltip}
              onRemove={(identifier) => facetCallbacks.current!.removeAppliedFilters(identifier)}
              // we cannot just pass the callback in the following since it's causing staleness state issue
              onTitleClick={(identifier) => facetCallbacks.current!.focusOnFacet(identifier)}
            />
          );
        });
      }
    }

    return (
      <div className='chiclets-container filter-chiclets'>
        {chiclets}
        {showClearAll &&
          <OverlayTrigger
            placement='bottom-start'
            overlay={<Tooltip>Clear all filters applied</Tooltip>}
          >
            <button
              className='clear-all-filters chaise-btn chaise-btn-tertiary clear-all-btn'
              onClick={() => clearAllFilters()}
            >
              <span>Clear all filters</span>
            </button>
          </OverlayTrigger>
        }
      </div>
    )
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

  const facetingSection = (leftRef: React.RefObject<HTMLDivElement>) => (
    <>
      {
        facetColumnsReady &&
        <div
          className={`side-panel-resizable ${panelClassName}`}
          style={{ visibility: config.showFaceting ? 'visible' : 'hidden' }}
          ref={leftRef}
        >
          <div className='side-panel-container'>
            <Faceting
              facetPanelOpen={facetPanelOpen}
              registerRecordsetCallbacks={registerCallbacksFromFaceting}
            />
          </div>
        </div>
      }
    </>
  );


  const renderMainContainer = () => (
    <div className='main-container dynamic-padding' ref={mainContainer}>
      <div className='main-body'>
        <RecordsetTable
          config={config}
          initialSortObject={initialReference.location.sortObject}
        />
      </div>
      {config.displayMode === RecordsetDisplayMode.FULLSCREEN && <Footer />}
    </div>
  );



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
          <div className={`top-left-panel ${panelClassName}`} ref={topLeftContainer}>
            <div className='panel-header'>
              <div className='pull-left'>
                <h3>Refine search</h3>
              </div>
              <div className='pull-right'>
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
                    <span className='inline-tooltip'>{reference.comment}</span>
                  }
                </h1>
              </div>
            }
            <div className='recordset-controls-container'>
              {config.selectMode === RecordsetSelectMode.MULTI_SELECT && selectedRows && selectedRows.length > 0 &&
                <SelectedChiclets rows={selectedRows} removeCallback={clearSelectedRow} />
              }
              <div className='row'>
                <div className='recordset-main-search col-lg-4 col-md-5 col-sm-6 col-xs-6'>
                  <SearchInput
                    initialSearchTerm={initialReference.location.searchTerm}
                    searchCallback={changeSearch}
                    inputClass={'main-search-input'}
                    searchColumns={initialReference.searchColumns}
                    disabled={false}
                    focus={true}
                    forceClearSearch={clearSearch}
                  />
                </div>
              </div>
            </div>
            {facetColumnsReady && renderSelectedFilterChiclets()}
            {renderShowFilterPanelBtn()}
            <TableHeader config={config} />
          </div>

        </div>
      </div>
      <SplitView
        left={facetingSection}
        right={renderMainContainer}
        minWidth={170}
        maxWidth={40}
        initialWidth={21}
        className='bottom-panel-container'
        convertMaxWidth
        convertInitialWidth
      />
    </div>
  )
};

export default Recordset;

