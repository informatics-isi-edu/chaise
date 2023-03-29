import '@isrd-isi-edu/chaise/src/assets/scss/_recordset.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Export from '@isrd-isi-edu/chaise/src/components/export';
import Faceting from '@isrd-isi-edu/chaise/src/components/faceting/faceting';
import FilterChiclet from '@isrd-isi-edu/chaise/src/components/recordset/filter-chiclet';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import RecordsetTable from '@isrd-isi-edu/chaise/src/components/recordset/recordset-table';
import SearchInput from '@isrd-isi-edu/chaise/src/components/search-input';
import SelectedRows from '@isrd-isi-edu/chaise/src/components/selected-rows';
import SplitView from '@isrd-isi-edu/chaise/src/components/split-view';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import TableHeader from '@isrd-isi-edu/chaise/src/components/recordset/table-header';

// hooks
import { useEffect, useRef, useState } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';

// models
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordsetProps, RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode, SelectedRow } from '@isrd-isi-edu/chaise/src/models/recordset';

// providers
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordsetProvider from '@isrd-isi-edu/chaise/src/providers/recordset';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { CookieService } from '@isrd-isi-edu/chaise/src/services/cookie';

// utilities
import { attachContainerHeightSensors, attachMainContainerPaddingSensor, copyToClipboard } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { createRedirectLinkFromPath, getRecordsetLink, transformCustomFilter } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { getHumanizeVersionDate, getVersionDate } from '@isrd-isi-edu/chaise/src/utils/date-time-utils';
import { getInitialFacetPanelOpen } from '@isrd-isi-edu/chaise/src/utils/faceting-utils';
import { CUSTOM_EVENTS } from '@isrd-isi-edu/chaise/src/utils/constants';

const Recordset = ({
  initialReference,
  config,
  logInfo,
  initialPageLimit,
  getFavorites,
  getDisabledTuples,
  initialSelectedRows,
  onSelectedRowsChanged,
  onFavoritesChanged,
  parentContainer = document.querySelector('#chaise-app-root') as HTMLElement,
  parentStickyArea,
  onFacetPanelOpenChanged,
  parentReference,
  parentTuple
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
        parentReference={parentReference}
        parentTuple={parentTuple}
      >
        <RecordsetInner
          initialReference={initialReference}
          config={config}
          logInfo={logInfo}
          parentContainer={parentContainer}
          parentStickyArea={parentStickyArea}
          onFacetPanelOpenChanged={onFacetPanelOpenChanged}
        />
      </RecordsetProvider>
    </AlertsProvider>
  );
};

type RecordsetInnerProps = {
  initialReference: any,
  config: RecordsetConfig,
  logInfo: {
    logObject?: any,
    logStack: any,
    logStackPath: string,
    logAppMode?: string
  },
  parentContainer?: HTMLElement,
  parentStickyArea?: HTMLElement,
  onFacetPanelOpenChanged?: (newState: boolean) => void
};

/**
 * based on my understanding provider and the usage of context cannot be on the
 * same level, that's why the Recordset comp is just a wrapper that has all the
 * providers that we need.
 */
const RecordsetInner = ({
  initialReference,
  config,
  logInfo,
  parentContainer,
  parentStickyArea,
  onFacetPanelOpenChanged
}: RecordsetInnerProps): JSX.Element => {

  const { dispatchError, errors } = useError();

  const {
    logRecordsetClientAction,
    reference,
    isLoading,
    page,
    isInitialized,
    initialize,
    selectedRows,
    setSelectedRows,
    update,
    forceShowSpinner
  } = useRecordset();

  /**
   * whether the facet panel should be open or closed
   */
  const [facetPanelOpen, setStateFacetPanelOpen] = useState<boolean>(() => {
    return getInitialFacetPanelOpen(config, initialReference);
  });
  const setFacetPanelOpen = (val: boolean) => {
    setStateFacetPanelOpen(val);
    if (onFacetPanelOpenChanged) onFacetPanelOpenChanged(val);
  }

  /**
   * We have to validate the facets first, and then we can show them.
   */
  const [facetColumnsReady, setFacetColumnsReady] = useState(false);

  const mainContainer = useRef<HTMLDivElement>(null);
  const topRightContainer = useRef<HTMLDivElement>(null);
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

  /**
   * used to see if there are any pending create requests
   */
  const addRecordRequests = useRef<any>({});

  /**
   * used to figure out if we need to update the page after edit request or not
   */
  const editRequestIsDone = useRef(false);

  /**
   * to make sure we're running the setup (following useEffect) only once
   */
  const setupStarted = useRef(false);


  /**
   * if data is not initialized:
   *   - if we're disabling facets:
   *     - initialize data
   *   - otherwise:
   *     - get the facet columns and let faceting.tsx handle initialization
   * if data is initialized:
   *   - make sure the right padding is correct
   */
  useEffect(() => {
    let paddingSensor: any;
    if (isInitialized) {
      // must be done after the data has been initialized to reduce the jitteriness
      paddingSensor = attachMainContainerPaddingSensor(parentContainer);
      return;
    }

    // run this setup only once
    if (setupStarted.current) return;
    setupStarted.current = true;

    // if the faceting feature is disabled, then we don't need to generate facets
    if (config.disableFaceting) {
      initialize();
      return;
    }

    // NOTE this will affect the reference uri so it must be
    //      done before initializing recordset
    reference.generateFacetColumns().then((res: any) => {

      setFacetColumnsReady(true);

      // if there wasn't any facets, close the panel by default
      if (res.facetColumns.length === 0) {
        setFacetPanelOpen(false);
      }

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
        const cb = function () {
          windowRef.history.replaceState({}, '', getRecordsetLink(reference));
        };
        dispatchError({ error: res.issues, closeBtnCallback: cb, okBtnCallback: cb })
      } else {
        // TODO save query should just return a promise
      }

    }).catch((exception: any) => {
      if (isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
        exception.errorData.redirectUrl = createRedirectLinkFromPath(exception.errorData.redirectPath);
      }
      dispatchError({ error: exception });
    });

    return () => {
      if (paddingSensor && typeof paddingSensor === 'function') {
        paddingSensor.detach();
      }
    };
  }, [isInitialized]);

  /**
   * attach the event listener and resize sensors
   */
  useEffect(() => {
    if (config.displayMode.indexOf(RecordsetDisplayMode.RELATED) === 0) {
      return;
    }

    // handle the scrollable container
    const resizeSensors = attachContainerHeightSensors(parentContainer, parentStickyArea);

    // log the right click event on the permalink button
    const permalink = document.getElementById('permalink');
    const logPermalink = () => (logRecordsetClientAction(LogActions.PERMALINK_RIGHT));
    if (config.displayMode === RecordsetDisplayMode.FULLSCREEN) {
      permalink?.addEventListener('contextmenu', logPermalink);
    }

    return () => {
      resizeSensors?.forEach((rs) => rs.detach());
      if (config.displayMode === RecordsetDisplayMode.FULLSCREEN) {
        permalink?.removeEventListener('contextmenu', logPermalink);
      }
      window.removeEventListener('focus', onFocus);
    }
  }, []);

  /**
   * attach the onFocus event listener
   * NOTE: we have to make sure the event listener is updated when the
   * update function changes
   */
  useEffect(() => {
    window.removeEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);
    window.addEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);

    window.removeEventListener(CUSTOM_EVENTS.FORCE_UPDATE_RECORDSET, forceUpdate);
    window.addEventListener(CUSTOM_EVENTS.FORCE_UPDATE_RECORDSET, forceUpdate);

    window.removeEventListener('focus', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);
      window.removeEventListener(CUSTOM_EVENTS.FORCE_UPDATE_RECORDSET, forceUpdate);
      window.removeEventListener('focus', onFocus);
    };
  }, [update]);

  // after data loads, scroll to top and change the browser location
  useEffect(() => {
    if (isLoading) return;

    // make sure the right padding is correct after data load
    // NOTE without this the padding stays the same until we interact with the page
    if (mainContainer.current && topRightContainer.current) {
      const padding = mainContainer.current.clientWidth - topRightContainer.current.clientWidth;
      mainContainer.current.style.paddingRight = padding + 'px';
    }

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
    // see if any of the create requests has been completed or not
    let completed = 0;
    const addReqs = addRecordRequests ? addRecordRequests.current : {};
    for (const id in addReqs) {
      if (CookieService.checkIfCookieExists(id)) {
        // remove it from the captured requests
        delete addRecordRequests.current[id];
        // remove the cookie
        CookieService.deleteCookie(id);
        completed++;
      }
    }

    // see if the edit request is done or not
    const updateDone = editRequestIsDone && editRequestIsDone.current;

    // call flow-control if the create or edit requests are done
    if (completed > 0 || updateDone) {
      const cause = completed ? LogReloadCauses.ENTITY_CREATE : LogReloadCauses.ENTITY_UPDATE;

      // clear the value
      editRequestIsDone.current = false;

      update({ updateResult: true, updateFacets: true, updateCount: true }, null, { cause, lastActiveFacet: -1 });
    }
  };

  /**
   * capture the create requests so we know when to refresh the page on focus
   */
  const onAddIntend = ((event: CustomEvent) => {
    const id = event.detail.id;
    if (typeof id !== 'string') return;
    addRecordRequests.current[id] = 1;
  }) as EventListener;

  /**
   * The callback that recoredit app expects and calls after edit is done.
   */
  windowRef.updated = () => {
    editRequestIsDone.current = true;
  };

  /**
   * call the update function
   */
  const forceUpdate = ((event: CustomEvent) => {
    const cause = event.detail.cause;
    const pageStates = event.detail.pageStates;
    const unlinkResponse = event.detail.response;
    if (!!cause && !!pageStates) {
      if (!!unlinkResponse) {
        if (unlinkResponse.failedTupleData.length > 0) {
          // iterate over the set of successful ids and find them in selected rows, then remove them
          unlinkResponse.successTupleData.forEach((data: any) => {
            // data is an object of key/value pairs for each piece of key information
            // { keycol1: val, keycol2: val2, ... }
            const idx = selectedRows.findIndex((tuple: any) => {
              return Object.keys(data).every((key) => {
                return tuple.data[key] == data[key]
              });
            });

            selectedRows.splice(idx, 1);
          });
          setSelectedRows([...selectedRows]);
        } else {
          // if everything is successful, empty selected rows
          setSelectedRows([]);
        }
      }
      update(pageStates, null, { cause});
    }
  }) as EventListener;

  //------------------- UI related callbacks: --------------------//

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

  const recordsetLink = getRecordsetLink();

  const copyPermalink = () => {
    // log the action
    logRecordsetClientAction(LogActions.PERMALINK_LEFT);

    copyToClipboard(recordsetLink);
  }

  /**
   * change the state of facet panel
   * @param value if given, it will force the state
   */
  const changeFacetPanelOpen = (value?: boolean) => {
    const val = typeof value === 'boolean' ? value : !facetPanelOpen;

    // log the action
    const action = val ? LogActions.FACET_PANEL_SHOW : LogActions.FACET_PANEL_HIDE;
    logRecordsetClientAction(action);

    // set the state variable
    setFacetPanelOpen(val);
  };

  /**
   * Change the search term and trigger search
   * @param term string the search term
   * @param action string the log action
   */
  const changeSearch = (term: string | null, action: LogActions) => {
    $log.debug(`search with term: ${term}, action : ${action}`);
    if (term) term = term.trim();

    const ref = reference.search(term); // this will clear previous search first
    const success = update(
      { updateResult: true, updateCount: true, updateFacets: true },
      { reference: ref },
      { cause: LogReloadCauses.SEARCH_BOX }
    );

    // log the request if it was successful
    if (success) {
      // log the client action
      const extraInfo = typeof term === 'string' ? { 'search-str': term } : {};
      // pass the reference to ensure it's using the one based on search
      logRecordsetClientAction(action, null, extraInfo, ref);
    }
  };

  /**
   * The callback to clear selected rows
   * @param row the selected row. If null, we will clear all the selected rows
   * @param event the event object
   */
  const clearSelectedRow = (row: SelectedRow | null, event: any) => {
    // log the action
    logRecordsetClientAction(!row ? LogActions.SELECTION_CLEAR_ALL : LogActions.SELECTION_CLEAR);

    // set the selected rows
    if (!row) {
      setSelectedRows([]);
    } else {
      setSelectedRows((currRows: SelectedRow[]) => {
        const res = Array.isArray(currRows) ? [...currRows] : [];
        return res.filter((obj: SelectedRow) => obj.uniqueId !== row.uniqueId);
      });
    }
  };

  //-------------------  render logics:   --------------------//

  const panelClassName = facetPanelOpen ? 'open-panel' : 'close-panel';

  /**
   * version info
   */
  let versionInfo: { [key: string]: string } | null = null;
  if (reference && reference.location.version) {
    versionInfo = {
      date: getVersionDate(reference.location),
      humanized: getHumanizeVersionDate(reference.location)
    }
  }


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
          key='filter-chiclet-custom-filters'
          identifier={'filters'}
          iconTooltip={'Clear custom filter applied'}
          title={'Custom Filter'}
          value={transformCustomFilter(loc.filtersString)}
          onRemove={(identifier) => facetCallbacks.current!.removeAppliedFilters(identifier)}
          removeClass='clear-custom-filters'
        />
      );
    }

    // cfacets
    if (hasCustomFacets) {
      const cFacetRemovable = loc.customFacets.removable;
      chiclets.push(
        <FilterChiclet
          key='filter-chiclet-custom-facets'
          identifier={'cfacets'}
          iconTooltip={cFacetRemovable ? 'Clear custom filter applied' : 'Predefined filter(s)'}
          // when it's not removable we're showing the icon and that's enough
          title={cFacetRemovable ? 'Custom Filter' : undefined}
          value={loc.customFacets.displayname}
          onRemove={cFacetRemovable ? (identifier) => facetCallbacks.current!.removeAppliedFilters(identifier) : undefined}
          removeClass='clear-custom-facets'
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
              <span key={`selected-filter-chiclet-${facetIndex}-value-${f.uniqueId}`}>
                <DisplayValue value={f.displayname} specialNullEmpty={true} />
                {(filterIndex !== faf.length - 1) && <span>, </span>}
              </span>
            );

            // tooltip is using bullet icon as a separator
            chicletValueTooltip.push(
              <span key={`selected-filter-chiclet-${facetIndex}-tooltip-${f.uniqueId}`}>
                <span style={{ 'marginRight': '2px', 'marginLeft': '3px', 'color': 'whitesmoke' }}>&bull;</span>
                <DisplayValue value={f.displayname} specialNullEmpty={true} />
              </span>
            )
          });

          chiclets.push(
            <FilterChiclet
              key={`selected-filter-chiclet-${facetIndex}`}
              identifier={facetIndex}
              iconTooltip={'Clear applied filter.'}
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
          <ChaiseTooltip
            placement='bottom-start'
            tooltip={'Clear all applied filters.'}
          >
            <button
              className='clear-all-filters chaise-btn chaise-btn-tertiary clear-all-btn'
              onClick={() => clearAllFilters()}
            >
              <span>Clear all filters</span>
            </button>
          </ChaiseTooltip>
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
    <div
      className={`side-panel-resizable ${panelClassName}`}
      ref={leftRef}
    >
      {facetColumnsReady &&
        <div className='side-panel-container'>
          <Faceting
            facetPanelOpen={facetPanelOpen}
            registerRecordsetCallbacks={registerCallbacksFromFaceting}
            recordsetLogStackPath={logInfo.logStackPath}
          />
        </div>
      }
    </div>
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

  /**
   * The left panels that should be resized together
   * This will take care of the resizing the modal header as well
   * TODO can this be optimized?
   */
  const leftPartners: HTMLElement[] = [];
  parentContainer?.querySelectorAll('.top-left-panel').forEach((el) => {
    leftPartners.push(el as HTMLElement);
  });

  return (
    <div className='recordset-container app-content-container'>
      {
        errors.length === 0 && (isLoading || forceShowSpinner) &&
        <ChaiseSpinner className='recordest-main-spinner' />
      }
      <div className='top-panel-container'>
        {/* recordset level alerts */}
        <Alerts />
        <div className='top-flex-panel'>
          <div className={`top-left-panel ${panelClassName}`} ref={topLeftContainer}>
            <div className='panel-header'>
              <div className='pull-left'>
                <h3 className='side-panel-heading'>Refine search</h3>
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

          <div className='top-right-panel' ref={topRightContainer}>
            {config.displayMode === RecordsetDisplayMode.FULLSCREEN &&
              <div className='recordset-title-container title-container'>
                <div className='recordset-title-buttons title-buttons'>
                  <Export
                    reference={reference}
                    disabled={isLoading || !page || page.length === 0}
                  />
                  <ChaiseTooltip placement='bottom' tooltip={MESSAGE_MAP.tooltip.permalink}>
                    <a
                      id='permalink'
                      className='chaise-btn chaise-btn-primary'
                      href={recordsetLink}
                      onClick={copyPermalink}
                    >
                      <span className='chaise-btn-icon fa-solid fa-bookmark' />
                      <span>Permalink</span>
                    </a>
                  </ChaiseTooltip>
                  {/* <div ng-if='showSavedQueryUI && vm.savedQueryReference' className='chaise-btn-group' uib-dropdown>
                            <div tooltip-placement='top-right' uib-tooltip='{{tooltip.saveQuery}}'>
                                <button id='save-query' className='chaise-btn chaise-btn-primary dropdown-toggle' ng-disabled='disableSavedQueryButton()' ng-click='logSavedQueryDropdownOpened()' uib-dropdown-toggle ng-style='{'pointer-events': disableSavedQueryButton() ? 'none' : ''}'>
                                    <span className='chaise-btn-icon fa-solid fa-floppy-disk'></span>
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
                  {versionInfo &&
                    <ChaiseTooltip placement='bottom-start' tooltip={`${MESSAGE_MAP.tooltip.versionTime} ${versionInfo.date}`}>
                      <small className='h3-class'>({versionInfo.humanized})</small>
                    </ChaiseTooltip>
                  }
                  {reference.commentDisplay === 'inline' && reference.comment &&
                    <span className='inline-tooltip'>{reference.comment}</span>
                  }
                </h1>
              </div>
            }
            {config.displayMode.indexOf(RecordsetDisplayMode.RELATED) !== 0 &&
              <div className='recordset-controls-container'>
                {config.selectMode === RecordsetSelectMode.MULTI_SELECT && selectedRows && selectedRows.length > 0 &&
                  <SelectedRows rows={selectedRows} removeCallback={clearSelectedRow} />
                }
                <div className='row'>
                  <div className='recordset-main-search col-lg-4 col-md-5 col-sm-6 col-6'>
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
            }
            {facetColumnsReady && renderSelectedFilterChiclets()}
            {renderShowFilterPanelBtn()}
            <TableHeader config={config} />
          </div>

        </div>
      </div>
      <SplitView
        parentContainer={parentContainer}
        left={facetingSection}
        leftPartners={leftPartners}
        right={renderMainContainer}
        minWidth={200}
        maxWidth={40}
        // NOTE the following must have the same value as the one in css.
        // which is $left-panel-width-lg variable in _variables.scss
        initialWidth={21}
        className='bottom-panel-container'
        convertMaxWidth
        convertInitialWidth
      />
    </div>
  )
};

export default Recordset;

