import '@isrd-isi-edu/chaise/src/assets/scss/_recordset.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Export from '@isrd-isi-edu/chaise/src/components/export';
import Faceting from '@isrd-isi-edu/chaise/src/components/faceting/faceting';
import FilterChiclet from '@isrd-isi-edu/chaise/src/components/recordset/filter-chiclet';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import RecordsetTable from '@isrd-isi-edu/chaise/src/components/recordset/recordset-table';
import SavedQueryDropdown from '@isrd-isi-edu/chaise/src/components/recordset/saved-query-dropdown';
import SearchInput from '@isrd-isi-edu/chaise/src/components/search-input';
import SelectedRows from '@isrd-isi-edu/chaise/src/components/selected-rows';
import SplitView from '@isrd-isi-edu/chaise/src/components/split-view';
import TableHeader from '@isrd-isi-edu/chaise/src/components/recordset/table-header';
import Title, { TitleProps } from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import React, { useEffect, useRef, useState } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';

// models
import { CommentDisplayModes } from '@isrd-isi-edu/chaise/src/models/displayname';
import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { FacetCheckBoxRow, RecordsetConfig, RecordsetDisplayMode, RecordsetProps, RecordsetSelectMode, SelectedRow } from '@isrd-isi-edu/chaise/src/models/recordset';

// providers
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordsetProvider from '@isrd-isi-edu/chaise/src/providers/recordset';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { CookieService } from '@isrd-isi-edu/chaise/src/services/cookie';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import { CUSTOM_EVENTS } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getHumanizeVersionDate, getVersionDate } from '@isrd-isi-edu/chaise/src/utils/date-time-utils';
import { getInitialFacetPanelOpen } from '@isrd-isi-edu/chaise/src/utils/faceting-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { attachContainerHeightSensors, attachMainContainerPaddingSensor, copyToClipboard } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { createRedirectLinkFromPath, getRecordsetLink, transformCustomFilter } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

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
  parentTuple,
  savedQueryConfig,
  uiContextTitles
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
        savedQueryConfig={savedQueryConfig}
      >
        <RecordsetInner
          initialReference={initialReference}
          config={config}
          logInfo={logInfo}
          parentContainer={parentContainer}
          parentStickyArea={parentStickyArea}
          onFacetPanelOpenChanged={onFacetPanelOpenChanged}
          uiContextTitles={uiContextTitles}
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
  onFacetPanelOpenChanged?: (newState: boolean) => void,
  uiContextTitles?: TitleProps[]
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
  onFacetPanelOpenChanged,
  uiContextTitles
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
    forceShowSpinner,
    savedQueryConfig,
    savedQueryReference,
    setSavedQueryReference
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
   * This will just start the process of registering the facets and we have
   * to wait for facetsRegistered and then we can send the requests.
   */
  const [facetColumnsReady, setFacetColumnsReady] = useState(false);
  /**
   * whether all the facet callbacks are registered and ready to use.
   */
  const [facetsRegistered, setFacetsRegistered] = useState(false);

  const [savedQueryUpdated, setSavedQueryUpdated] = useState<boolean>(false);

  const [permalinkTooltip, setPermalinkTooltip] = useState(MESSAGE_MAP.tooltip.permalink);

  const mainContainer = useRef<HTMLDivElement>(null);
  const topRightContainer = useRef<HTMLDivElement>(null);
  const topLeftContainer = useRef<HTMLDivElement>(null);

  /**
   * The callbacks from faceting.tsx that we will use here
   */
  const facetCallbacks = useRef<{
    getAppliedFilters: () => FacetCheckBoxRow[][],
    removeAppliedFilters: (index?: number | 'filters' | 'cfacets') => void,
    focusOnFacet: (index: number, dontUpdate?: boolean) => void
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

    /**
     * this will affect the reference uri so it must be done before initializing recordset.
     * it includes potentially adding more facets as well as a different way of validating facets.
     */
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
        // execute the following if:
        //   - the savedQuery UI is being shown
        //   - a savedQuery rid is present in the url on page load
        //   - the updated flag is not true
        //     - savedQuery.updated is initialized to true unless there is a proper savedQuery mapping and defined savedQuery rid is set
        if (savedQueryConfig && savedQueryConfig.showUI && savedQueryConfig.rid && !savedQueryUpdated) {
          // to prevent the following code and request from triggering more than once
          // NOTE: doesn't matter if the update is successful or not, we are only preventing this block from triggering more than once
          setSavedQueryUpdated(true);

          const rows: any[] = [];

          const row: any = {}
          row.RID = savedQueryConfig.rid;

          const lastExecutedColumnName = savedQueryConfig.mapping.columnNameMapping?.lastExecutionTime || 'last_execution_time';
          row[lastExecutedColumnName] = 'now';

          rows.push(row);

          // create this fake table object so getStackNode works
          const fauxTable = {
            name: savedQueryConfig.mapping.table,
            schema: {
              name: savedQueryConfig.mapping.schema
            }
          }

          const stackPath = LogService.getStackPath(LogStackPaths.SET, LogStackPaths.SAVED_QUERY_CREATE_POPUP);
          const currStackNode = LogService.getStackNode(LogStackTypes.SAVED_QUERY, fauxTable);

          const logObj = {
            action: LogService.getActionString(LogActions.UPDATE, stackPath),
            stack: LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), {
              'num_updated': 1,
              'updated_keys': {
                'cols': ['RID'],
                'vals': [[savedQueryConfig.rid]]
              }
            })
          };

          const config: any = {
            skipHTTP401Handling: true,
            headers: {}
          };

          config.headers[windowRef.ERMrest.contextHeaderName] = logObj;
          // attributegroup/CFDE:saved_query/RID;last_execution_status
          const updateSavedQueryUrl = windowRef.location.origin + savedQueryConfig.ermrestAGPath + '/RID;' + lastExecutedColumnName;
          ConfigService.http.put(updateSavedQueryUrl, rows, config).then(() => {
            // do nothing
          }).catch((error: any) => {
            $log.warn('saved query last executed time could not be updated');
            $log.warn(error);
          });
        }
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

  useEffect(() => {
    if (!facetColumnsReady || !savedQueryConfig?.showUI) return;

    const savedQueryReferenceUrl = windowRef.location.origin + savedQueryConfig.ermrestTablePath;
    // create the reference to the saved query table used for saving queries
    windowRef.ERMrest.resolve(savedQueryReferenceUrl, ConfigService.contextHeaderParams).then((reference: any) => {
      setSavedQueryReference(reference);
    }).catch((error: any) => {
      // an error here could mean a misconfiguration of the saved query ermrest table path
      $log.warn(error);

      dispatchError({ error: error });
    });
  }, [facetColumnsReady])

  /**
   * if facet panel is not disabled,
   * initialize the recordset data only when all facets are ready and registered
   */
  useEffect(() => {
    if (!facetsRegistered) return;
    initialize();
  }, [facetsRegistered]);

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
      windowRef.removeEventListener('focus', onFocus);
    }
  }, []);

  /**
   * attach the onFocus event listener
   * NOTE: we have to make sure the event listener is updated when the
   * update function changes
   */
  useEffect(() => {
    windowRef.removeEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);
    windowRef.addEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);

    windowRef.removeEventListener(CUSTOM_EVENTS.FORCE_UPDATE_RECORDSET, forceUpdate);
    windowRef.addEventListener(CUSTOM_EVENTS.FORCE_UPDATE_RECORDSET, forceUpdate);

    windowRef.removeEventListener('focus', onFocus);
    windowRef.addEventListener('focus', onFocus);
    return () => {
      windowRef.removeEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);
      windowRef.removeEventListener(CUSTOM_EVENTS.FORCE_UPDATE_RECORDSET, forceUpdate);
      windowRef.removeEventListener('focus', onFocus);
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

    // change the url location in fullscreen mode (only if there aren't any error)
    if (errors.length === 0 && config.displayMode.indexOf(RecordsetDisplayMode.FULLSCREEN) === 0) {
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
      update(pageStates, null, { cause });
    }
  }) as EventListener;

  //------------------- UI related callbacks: --------------------//

  /**
   * The callbacks from faceting.tsx that are used in this component
   */
  const registerCallbacksFromFaceting = (
    getAppliedFilters: () => FacetCheckBoxRow[][],
    removeAppliedFilters: () => void,
    focusOnFacet: (index: number, dontUpdate?: boolean) => void
  ) => {
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

  /**
   * the callback for when permalink button is clicked
   */
  const copyPermalink = (e: React.MouseEvent) => {
    // avoid the navigation
    e.preventDefault();

    // log the action
    logRecordsetClientAction(LogActions.PERMALINK_LEFT);

    // copy to the clipboard
    copyToClipboard(recordsetLink).then(() => {
      setPermalinkTooltip('Copied!');
      setTimeout(() => {
        setPermalinkTooltip(MESSAGE_MAP.tooltip.permalink);
      }, 1000);
    }).catch((err) => {
      $log.warn('failed to copy with the following error:')
      $log.warn(err);
    })
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

  const getRecordsetAppliedFilters = () => {
    return facetCallbacks.current?.getAppliedFilters();
  }

  //-------------------  render logics:   --------------------//

  const panelClassName = facetPanelOpen ? 'open-panel' : 'close-panel';

  const recordsetUIContextTitles = uiContextTitles ? [...uiContextTitles] : [{ reference: initialReference }];
  const recordsetFacetDepthLevel = config.facetDepthLevel !== undefined ? config.facetDepthLevel : 1;

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
              onTitleClick={(identifier) => typeof identifier === 'number' && facetCallbacks.current!.focusOnFacet(identifier)}
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
    if (facetPanelOpen || config.disableFaceting || !reference.display.showFaceting || (recordsetFacetDepthLevel > reference.display.maxFacetDepth)) {
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
            setReadyToInitialize={() => {
              setFacetsRegistered(true);
            }}
            recordsetUIContextTitles={recordsetUIContextTitles}
            recordsetFacetDepthLevel={recordsetFacetDepthLevel}
          />
        </div>
      }
    </div>
  );

  const renderMainContainer = () => {
    const hasSpinner = errors.length === 0 && (isLoading || forceShowSpinner);
    return (
      <div className='main-container dynamic-padding' ref={mainContainer}>
        {hasSpinner &&
          <div className='recordset-main-spinner-container sticky-spinner-outer-container'>
            <ChaiseSpinner className='recordset-main-spinner manual-position-spinner' />
          </div>
        }
        <div className={`main-body${hasSpinner ? ' with-spinner' : ''}`}>
          <RecordsetTable
            config={config}
            initialSortObject={initialReference.location.sortObject}
          />
        </div>
        {config.displayMode === RecordsetDisplayMode.FULLSCREEN && <Footer />}
      </div>
    )
  };

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
                  <ChaiseTooltip placement='bottom' tooltip={permalinkTooltip} dynamicTooltipString>
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
                  {savedQueryConfig?.showUI && savedQueryReference &&
                    <SavedQueryDropdown appliedFiltersCallback={getRecordsetAppliedFilters}></SavedQueryDropdown>
                  }

                </div>
                <h1 id='page-title'>
                  <Title addLink={false} reference={initialReference} />
                  {versionInfo &&
                    <ChaiseTooltip placement='bottom-start' tooltip={`${MESSAGE_MAP.tooltip.versionTime} ${versionInfo.date}`}>
                      <small className='h3-class'>({versionInfo.humanized})</small>
                    </ChaiseTooltip>
                  }
                  {reference.comment && reference.comment.displayMode === CommentDisplayModes.INLINE &&
                    <span className='inline-tooltip inline-tooltip-lg'><DisplayCommentValue comment={reference.comment} /></span>
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
            {facetsRegistered && renderSelectedFilterChiclets()}
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

