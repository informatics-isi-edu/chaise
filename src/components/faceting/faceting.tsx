import '@isrd-isi-edu/chaise/src/assets/scss/_faceting.scss';

// Components
import Accordion from 'react-bootstrap/Accordion';
import FacetChoicePicker from '@isrd-isi-edu/chaise/src/components/faceting/facet-choice-picker';
import FacetCheckPresence from '@isrd-isi-edu/chaise/src/components/faceting/facet-check-presence';
import FacetHeader from '@isrd-isi-edu/chaise/src/components/faceting/facet-header';
import FacetRangePicker from '@isrd-isi-edu/chaise/src/components/faceting/facet-range-picker';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { FacetModel, FacetRequestModel } from '@isrd-isi-edu/chaise/src/models/recordset';

// servies
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

//react-beatiful-dnd
import {
  DragDropContext, Draggable, DraggableProvided, DroppableProvided, DropResult
} from 'react-beautiful-dnd';
import ChaiseDroppable from '@isrd-isi-edu/chaise/src/components/chaise-droppable';
import { reorderFacets } from '@isrd-isi-edu/chaise/src/utils/faceting-utils';
import LocalStorage from '@isrd-isi-edu/chaise/src/utils/storage';


type FacetingProps = {
  /**
   * Whether the facet panel is currently open or not
   */
  facetPanelOpen: boolean,
  /**
   * The functions that recordset is going to use from this component..
   * NOTE we have to make sure this function is called after each update of
   *      state variables that they use. Otherwise we will face a staleness issues.
   */
  registerRecordsetCallbacks: any,
  /**
   * the recordset's log stack path
   */
  recordsetLogStackPath: string,
  /**
   * callback that should be called when we're ready to initalize the data
   */
  setReadyToInitialize: () => void,
}

const Faceting = ({
  facetPanelOpen,
  registerRecordsetCallbacks,
  recordsetLogStackPath,
  setReadyToInitialize
}: FacetingProps) => {

  const { dispatchError } = useError();
  const {
    reference, registerFacetCallbacks, update,
    printDebugMessage, checkReferenceURL,
    logRecordsetClientAction, getLogAction, getLogStack
  } = useRecordset();

  /**
   * we can display the facets as soon as we populate the facetModels
   */
  const [displayFacets, setDisplayFacets] = useState(false);

  /**
   * used to signal to recordset that we can initialize the page
   */
  const [allFacetsRegistered, setAllFacetsRegistered] = useState(false);

  /**
   * Store facets in custom order
   */
  const [orderedFacets, setOrderedFacets] = useState<any[]>([]);

  const [facetModels, setFacetModels, facetModelsRef] = useStateRef<FacetModel[]>(() => {
    const res: FacetModel[] = [];
    let firstOpen = -1;
    reference.facetColumns.forEach((fc: any, index: number) => {
      if (fc.isOpen) {
        firstOpen = (firstOpen === -1 || firstOpen > index) ? index : firstOpen;
      }
      res.push({
        initialized: false,
        isOpen: fc.isOpen,
        isLoading: fc.isOpen,
        noConstraints: false,
        facetHasTimeoutError: false,
        // TODO
        // enableFavorites: $scope.$root.session && facetColumn.isEntityMode && table.favoritesPath && table.stableKey.length == 1,
        enableFavorites: false,
        parentLogStackPath: recordsetLogStackPath
      });
    });
    // all the facets are closed, open the first one
    if (firstOpen === -1 && res.length > 0) {
      firstOpen = 0;
      res[0].isOpen = true;
      res[0].isLoading = true;
    }
    return res;
  });
  const setFacetModelByIndex = (index: number, updatedVals: { [key: string]: boolean }) => {
    setFacetModels((prevFacetModels: FacetModel[]) => {
      return prevFacetModels.map((fm: FacetModel, fmIndex: number) => {
        if (index !== fmIndex) return fm;
        return { ...fm, ...updatedVals };
      });
    });
  };
  const setMultipleFacetModelsByIndex = (input: { [index: number]: { [key: string]: boolean } }) => {
    setFacetModels((prevFacetModels: FacetModel[]) => {
      return prevFacetModels.map((fm: FacetModel, fmIndex: number) => {
        if (!(fmIndex in input)) return fm;
        return { ...fm, ...input[fmIndex] };
      });
    });
  };

  const facetRequestModels = useRef<FacetRequestModel[]>([]);

  const facetsToPreProcess = useRef<number[]>([]);

  const sidePanelContainer = useRef<HTMLDivElement>(null);

  /**
   * make sure the setup is done only once
   */
  const setupStarted = useRef(false);

  /**
   * register the flow-control related callbacks and then show facets
   */
  useEffect(() => {
    // run this setup only once
    if (setupStarted.current) return;
    setupStarted.current = true;

    facetRequestModels.current = [];
    facetsToPreProcess.current = [];

    let atLeastOneOpen = false;
    reference.facetColumns.forEach((facetColumn: any, index: number) => {
      const table = facetColumn.column.table;
      const facetLogStackNode = LogService.getStackNode(
        LogStackTypes.FACET,
        table,
        { source: facetColumn.compressedDataSource, entity: facetColumn.isEntityMode }
      );

      if (facetColumn.isOpen) {
        atLeastOneOpen = true;
        facetsToPreProcess.current.push(index);
      }

      facetRequestModels.current.push({
        // some facets require extra step to process preselected filters
        preProcessed: !facetColumn.isOpen,
        processed: !facetColumn.isOpen,
        // TODO why??
        // appliedFilters: [],
        registered: false,
        processFacet: (reloadCauses: string[], reloadStartTime: number) => { throw new Error('function not registered') },
        preProcessFacet: () => { throw new Error('function not registered') },
        getAppliedFilters: () => { throw new Error('function not registered') },
        removeAppliedFilters: () => { throw new Error('function not registered') },
        reloadCauses: [], // why the reload request is being sent to the server (might be empty)
        reloadStartTime: -1, //when the facet became dirty
        // I could capture the whole logStack,
        // but only did logStackNode so I can call the recordTableUtils.getLogStack with it.
        logStackNode: facetLogStackNode,
        // instead of just logStackPath, we're capturing parent so it can be used in facet and facet picker.
        // parentLogStackPath: $scope.vm.logStackPath ? $scope.vm.logStackPath : logService.logStackPaths.SET,
      });
    });

    /**
     * if there wasn't any facets, just mark the facets are registered
     */
    if (reference.facetColumns.length === 0) {
      setAllFacetsRegistered(true);
      return;
    }

    // all the facets are closed, the fist one should be processed.
    if (!atLeastOneOpen) {
      facetRequestModels.current[0].processed = false;
    }

    setDisplayFacets(true);
  }, []);

  /**
   * When facets are displayed, scroll to the first open one
   */
  useLayoutEffect(() => {
    if (!displayFacets) return;
    let firstOpen = 0;
    reference.facetColumns.some((fc: any, index: number) => {
      if (fc.isOpen) {
        firstOpen = index;
      }
      return fc.isOpen;
    });
    setTimeout(() => {
      scrollToFacet(firstOpen, true);
    }, 200);
  }, [displayFacets])

  /**
   * let recordset know that all the facets are registered and it can initialize.
   * we're changing the state here instead of directly calling to make sure
   * the internal state of faceting is ready as we're doing the registery outside of state.
   */
  useEffect(() => {
    if (!allFacetsRegistered) return;
    setReadyToInitialize();
  }, [allFacetsRegistered]);

  /**
   * This will ensure the registered functions in flow-control
   * are updated based on the latest facet changes
   */
  useEffect(() => {
    registerFacetCallbacks(updateFacetStates, updateFacets);
    registerRecordsetCallbacks(getAppliedFiltersFromRS, removeAppliedFiltersFromRS, focusOnFacet);
  }, [facetModels]);


  /**
   * Allows us to Uniquely identify and access facet order for a given table
   */
  const facetListKey = `facet-order-${reference.table.schema.catalog.id}_${reference.table.schema.name}_${reference.table.name}`;
  /**
   * Fetch custom facet order from localStorage and update the orderedFacets state
   */
  useEffect(() => {

    // Disable dev warnings for facets for this component
    (window as any)['__react-beautiful-dnd-disable-dev-warnings'] = true;

    /**
     * Get Facet Order from LocalStorage
     */ 
     const facetOrder = LocalStorage.getStorage(facetListKey) || undefined;

    // If facet order is not stored in localStorage, display items in default order
    if (!facetOrder) {      
      setOrderedFacets(reference.facetColumns.map((item: any, index: number) => [item, index]))
      return;
    }

    /**
     * If facet order is present in localStorage, rearrange the items according to the stored order
     */
    const facetsInOrder = reorderFacets(reference.facetColumns, facetOrder)
    
    /**
     * Update isOpen state for facets based on stored state
     */
    if(facetModels && facetModels.length){
      let copyOfFacetModels = Array.from(facetModels);

      for(let i=0; i < facetsInOrder.length;i++){
        let facetIndex = facetsInOrder[i][1];

        copyOfFacetModels[facetIndex].isOpen = facetOrder[i].open
      }

      setFacetModels(copyOfFacetModels)
    }

    setOrderedFacets(facetsInOrder)

    return () =>{
      // Enable Dev warnings when the component unmounts
      (window as any)['__react-beautiful-dnd-disable-dev-warnings'] = false;
    }
  }, [])

  useEffect(()=>{
    
    if(!orderedFacets || !orderedFacets.length) return;

    /**
     * store isOpen state for facets to localStorage
     */
    LocalStorage.setStorage(facetListKey, orderedFacets.map(i => ({name : i[0].sourceObjectWrapper.name, open:facetModels[i[1]].isOpen})))
  },[facetModels])

  //-------------------  flow-control related functions:   --------------------//

  const updateFacetStates = (flowControl: any, resetAllOpenFacets?: boolean, cause?: string) => {
    // batch all the state changes into one
    const modifiedAttrs: { [index: number]: { [key: string]: boolean } } = {};

    // see which facets need to be updated
    facetRequestModels.current.forEach(function (frm: any, index: number) {
      const facetModel = facetModels[index];

      if (flowControl.current.lastActiveFacet === index) {
        return;
      }

      // if it's open, we need to process it
      if (facetModel.isOpen) {
        if (!Number.isInteger(frm.reloadStartTime) || frm.reloadStartTime === -1) {
          frm.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
        }
        if (cause && frm.reloadCauses.indexOf(cause) === -1) {
          frm.reloadCauses.push(cause);
        }
        frm.processed = false;
        if (resetAllOpenFacets) {
          modifiedAttrs[index] = { isLoading: true, initialized: false };
        } else {
          modifiedAttrs[index] = { isLoading: true };
        }
      }
      // otherwise we don't need to process it and should just mark
      // it as 'not initialized'
      else {
        frm.processed = true;
        modifiedAttrs[index] = { initialized: false };
      }
    });

    setMultipleFacetModelsByIndex(modifiedAttrs);
  };

  const afterFacetUpdate = (index: number, res: boolean, flowControl: any) => {
    flowControl.current.queue.occupiedSlots--;
    const currFm = facetRequestModels.current[index];
    currFm.processed = res || currFm.processed;

    if (res) {
      currFm.reloadCauses = [];
      currFm.reloadStartTime = -1;
    }

    // currFm.initialized = res || currFm.initialized;
    // currFm.isLoading = !res;
    setFacetModelByIndex(index, { isLoading: !res, initialized: res });

    printDebugMessage(`after facet (index=${index}) update: ${res ? 'successful.' : 'unsuccessful.'}`);
  }

  const updateFacets = (flowControl: any, updatePage: Function) => {
    if (!flowControl.current.haveFreeSlot(false)) {
      $log.debug('No free slot available (faceting).');
      return;
    }

    // preprocess facets first
    const index = facetsToPreProcess.current.shift();
    if (typeof index === 'number') {
      flowControl.current.queue.occupiedSlots++;
      (function (i: number, currentCounter: number) {
        printDebugMessage(`initializing facet (index=${index}`)
        facetRequestModels.current[i].preProcessFacet().then(function (res: any) {
          printDebugMessage(`after facet (index=${i}) initialize: ${res ? 'successful.' : 'unsuccessful.'}`);
          flowControl.current.queue.occupiedSlots--;
          facetRequestModels.current[i].preProcessed = true;
          setFacetModelByIndex(i, { facetHasTimeoutError: false });
          updatePage();
        }).catch(function (err: any) {
          // show alert if 400 Query Timeout Error
          if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
            setFacetModelByIndex(i, { facetHasTimeoutError: true });
          } else {
            dispatchError({ error: err });
          }
        });
      })(index, flowControl.current.queue.counter);
    }
    else {
      facetRequestModels.current.forEach(function (frm, index) {
        if (!frm.preProcessed || frm.processed || !flowControl.current.haveFreeSlot()) {
          return;
        }

        flowControl.current.queue.occupiedSlots++;
        frm.processed = true;

        (function (i) {
          printDebugMessage(`updating facet (index=${index})`);
          facetRequestModels.current[i].processFacet(frm.reloadCauses, frm.reloadStartTime).then(function (res: any) {
            setFacetModelByIndex(i, { facetHasTimeoutError: false });
            afterFacetUpdate(i, res, flowControl);
            updatePage();
          }).catch(function (err: any) {
            // show alert if 400 Query Timeout Error
            if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
              setFacetModelByIndex(i, { facetHasTimeoutError: true });
            } else {
              dispatchError({ error: err });
            }

            afterFacetUpdate(i, true, flowControl);
          });
        })(index);
      });
    }

    return;
  };

  //-------------------  callbacks that facet pickers will call:   --------------------//

  /**
   * Register the facet functions used for flow-control and recordset communication
   * When all the facets have called this function, it will ask flow-control to initialize data
   */
  const registerFacet = (index: number, processFacet: Function, preprocessFacet: Function,
    getAppliedFilters: Function, removeAppliedFilters: Function) => {

    facetRequestModels.current[index].processFacet = processFacet;
    facetRequestModels.current[index].preProcessFacet = preprocessFacet;
    facetRequestModels.current[index].getAppliedFilters = getAppliedFilters;
    facetRequestModels.current[index].removeAppliedFilters = removeAppliedFilters;
    facetRequestModels.current[index].registered = true;

    if (facetRequestModels.current.every((el) => el.registered)) {
      setAllFacetsRegistered(true);
    }
  }

  /**
   * ask flow-control to update data displayed for one facet
   * @param index the facet index
   * @param setIsLoading whether we should also change the spinner status
   * @param cause the cause of update
   */
  const dispatchFacetUpdate = (index: number, setIsLoading: boolean, cause?: string, noConstraints?: boolean): void => {
    const frm = facetRequestModels.current[index];
    frm.processed = false;
    if (setIsLoading) {
      const val: { [key: string]: boolean } = { isLoading: true };
      if (typeof noConstraints === 'boolean') {
        val.noConstraints = noConstraints;
      }
      setFacetModelByIndex(index, val);
    }

    if (!Number.isInteger(frm.reloadStartTime) || frm.reloadStartTime === -1) {
      frm.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
      if (cause && frm.reloadCauses.indexOf(cause) === -1) {
        frm.reloadCauses.push(cause);
      }
    }

    // $log.debug(`faceting: asking flow control to update facet index=${index}`);

    // call the flow-control, so the update of facet is queued properly
    // the timeout makes sure the set-state is done prior to calling the folow-control
    // (the noConstraints is needed to be set beforehand since it will affect the request)
    setTimeout(() => update(null, null, { sameCounter: true }));
  };

  /**
   * Update the reference's recordset and call the flow-control to update
   * NOTE: it will check for the url length limitation
   * @param newRef the new reference
   * @param index facet index
   * @param cause the cause of update
   * @param keepRef if true, we will not change the reference (the function is used for url length check)
   * @returns
   */
  const updateRecordsetReference = (newRef: any, index: number, cause: string, keepRef?: boolean, resetAllOpenFacets?: boolean) => {
    if (!checkReferenceURL(newRef, !keepRef)) {
      return false;
    }

    if (!keepRef) {
      // if we should restart every facet or not
      // reset everything and then focus on the facet that triggered this update
      let lastActiveFacet = index;
      if (resetAllOpenFacets) {
        lastActiveFacet = -1;
        scrollToFacet(index, true);
      }

      update(
        { updateResult: true, updateCount: true, updateFacets: true },
        { reference: newRef },
        { cause, lastActiveFacet, resetAllOpenFacets }
      )
    }
    return true;
  };

  const getFacetLogAction = (index: number, actionPath: LogActions): string => {
    return getLogAction(actionPath, LogStackPaths.FACET);
  };

  const getFacetLogStack = (index: number, extraInfo?: any): any => {
    return getLogStack(facetRequestModels.current[index].logStackNode, extraInfo);
  }

  //------------------- callbacks that recordset will call: ----------------//
  /**
   * it will return an array of arrays
   */
  const getAppliedFiltersFromRS = () => {
    return facetRequestModels.current.map((frm: FacetRequestModel) => {
      return frm.getAppliedFilters();
    });
  };

  /**
   * Remove the applied filters
   * @param index if number it's a facet index, otherwise it will be cfacets or filters.
   */
  const removeAppliedFiltersFromRS = (index?: number | 'filters' | 'cfacets') => {
    let newRef, reason = LogReloadCauses.FACET_CLEAR, action: LogActions | null = null;
    if (index === 'filters') {
      newRef = reference.removeAllFacetFilters(false, true, true);
      action = LogActions.BREADCRUMB_CLEAR_CUSTOM;
      reason = LogReloadCauses.CLEAR_CUSTOM_FILTER;
    } else if (index === 'cfacets') {
      newRef = reference.removeAllFacetFilters(true, false, true);
      action = LogActions.BREADCRUMB_CLEAR_CFACET;
      reason = LogReloadCauses.CLEAR_CFACET;
    } else if (typeof index === 'number') {
      // delete all fitler for one column
      newRef = reference.facetColumns[index].removeAllFilters();

      // remove all the checkboxes in the UI
      facetRequestModels.current[index].removeAppliedFilters();

      // log the action
      const fc = reference.facetColumns[index];
      LogService.logClientAction({
        action: getFacetLogAction(index, LogActions.BREADCRUMB_CLEAR),
        stack: getFacetLogStack(index)
      }, fc.sourceReference.defaultLogInfo);
    } else {
      // // delete all filters and facets
      newRef = reference.removeAllFacetFilters();
      action = LogActions.BREADCRUMB_CLEAR_ALL;
      reason = LogReloadCauses.CLEAR_ALL;

      // remove all the checkboxes in the UI
      facetRequestModels.current.forEach((frm) => { frm.removeAppliedFilters() });
    }

    // whether we should log the action for the whole page or not
    if (action) {
      logRecordsetClientAction(action);
    }

    // removing filter should just reduce the url length limit,
    // so we don't need to check for the returned value of this function
    updateRecordsetReference(newRef, -1, reason);
  }

  /**
   * Focus on the given facet
   * @param index
   * @param dontUpdate whether we should also trigger an update request or not
   */
  const focusOnFacet = (index: number, dontUpdate?: boolean) => {
    const fm = facetModels[index];
    if (!fm.isOpen && (dontUpdate !== true)) {
      toggleFacet(index, true);
    }

    scrollToFacet(index, dontUpdate);
  };

  //-------------------  UI related callbacks:   --------------------//

  /**
   * Toggle the facet and set the proper states
   * might trigger flow control
   * @param index
   * @param dontLog
   */
  const toggleFacet = (index: number, dontLog?: boolean) => {
    setFacetModels((prevFacetModels) => {
      return prevFacetModels.map((fm: FacetModel, fmIndex: number) => {
        if (index !== fmIndex) return fm;
        const isOpen = !fm.isOpen;

        if (!dontLog) {
          const action = isOpen ? LogActions.OPEN : LogActions.CLOSE;
          // log the action
          LogService.logClientAction({
            action: getFacetLogAction(index, action),
            stack: getFacetLogStack(index)
          }, reference.facetColumns[fmIndex].sourceReference.defaultLogInfo);
        }

        // if we're closing it
        if (!isOpen) {
          return {
            ...fm,
            isOpen,
            // hide the spinner:
            isLoading: false,
            // if we were waiting for data, make sure to fetch it later
            initialized: !fm.isLoading
          }

        }
        // if it's open and not initialized, then get the data
        else if (!fm.initialized) {
          // send a request
          // TODO should have priority
          dispatchFacetUpdate(index, false);

          return {
            ...fm,
            isOpen,
            isLoading: true
          };
        }

        // otherwise we should just change the isOpen
        return { ...fm, isOpen };
      });
    });
  };

  /**
   * Given the index of a facet, scroll to it
   * @param index the index of facet
   * @param dontLog whether we should log this event or not
   */
  const scrollToFacet = (index: number, dontLog?: boolean) => {
    if (!sidePanelContainer.current) return;

    const el = sidePanelContainer.current.querySelectorAll('.facet-panel')[index] as HTMLElement;
    if (!el) return;

    if (!dontLog) {
      const fc = reference.facetColumns[index];
      LogService.logClientAction({
        action: getFacetLogAction(index, LogActions.BREADCRUMB_SCROLL_TO),
        stack: getFacetLogStack(index)
      }, fc.sourceReference.defaultLogInfo);
    }

    // TODO delay this event (using debounce from react branch)
    // scroll
    sidePanelContainer.current.scrollTo({
      top: el.offsetTop,
      behavior: 'smooth'
    });

    // flash the activeness
    setTimeout(() => {
      el.classList.add('active');
      setTimeout(() => {
        el.classList.remove('active');
      }, 1600);
    }, 100);

  };

  /**
   * Handle drag and drop events for draggable facets
   */
  const handleOnDragEnd = (result: DropResult) => {
    const items = Array.from(orderedFacets);    

    if (!result.destination) {
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(orderedFacets.length - 1, 0, reorderedItem);
    } else {
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
    }

    // Save facet order to localStorage
    LocalStorage.setStorage(facetListKey, items.map(i => ({name : i[0].sourceObjectWrapper.name, open:facetModels[i[1]].isOpen})))
    setOrderedFacets(items);
  }
  //-------------------  render logic:   --------------------//

  const renderFacet = (fc: any, index: number) => {
    const fm = facetModels[index];
    switch (fc.preferredMode) {
      case 'ranges':
        return <FacetRangePicker
          dispatchFacetUpdate={dispatchFacetUpdate}
          facetColumn={fc} facetIndex={index} facetModel={fm}
          facetPanelOpen={facetPanelOpen}
          register={registerFacet} updateRecordsetReference={updateRecordsetReference}
          getFacetLogAction={getFacetLogAction} getFacetLogStack={getFacetLogStack}
        />
      case 'check_presence':
        return <FacetCheckPresence
          facetModel={fm} facetColumn={fc} facetIndex={index}
          register={registerFacet} updateRecordsetReference={updateRecordsetReference}
        />
      default:
        return <FacetChoicePicker
          facetModel={fm} facetColumn={fc} facetIndex={index}
          register={registerFacet} updateRecordsetReference={updateRecordsetReference}
          dispatchFacetUpdate={dispatchFacetUpdate} checkReferenceURL={checkReferenceURL}
          facetPanelOpen={facetPanelOpen}
          getFacetLogAction={getFacetLogAction} getFacetLogStack={getFacetLogStack}
        />
    }
  };

  // bootstrap expects an array of strings
  const activeKeys: string[] = [];
  facetModels.forEach((fm, index) => { if (fm.isOpen) activeKeys.push(`${index}`) });

  if (!displayFacets) {
    if (facetModels.length === 0) {
      return <span>No Filter Options</span>
    }
    return <></>
  }

  return (
    <div className='side-panel-container' ref={sidePanelContainer}>
      <div className='faceting-columns-container'>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <ChaiseDroppable droppableId={'facet-droppable'}>
            {
              (provided: DroppableProvided) => (
                <Accordion
                  className='panel-group' activeKey={activeKeys} alwaysOpen
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  key={'facet-list'}
                >
                  {orderedFacets.map(([fc, index]: [any, number], idx) => {
                    return <Draggable key={index} draggableId={`facet-${index}`} index={idx}>
                      {
                        (provided: DraggableProvided) => {
                          return <div
                            className='facet-item-container'
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <div className='move-icon' {...provided.dragHandleProps}>
                              <i className='fa-solid fa-grip-vertical'></i>
                            </div>
                            <Accordion.Item
                              eventKey={index + ''} key={index}
                              className={`facet-panel fc-${index}${facetModels[index].isOpen ? ' panel-open' : ''}`}
                            >
                              <Accordion.Header className={`fc-heading-${index}`} onClick={() => toggleFacet(index)}>
                                <FacetHeader
                                  displayname={fc.displayname}
                                  showTooltipIcon={fc.comment ? true : false}
                                  comment={fc.comment}
                                  isLoading={facetModels[index].isLoading}
                                  facetHasTimeoutError={facetModels[index].facetHasTimeoutError}
                                  noConstraints={facetModels[index].noConstraints}
                                />
                              </Accordion.Header>
                              <Accordion.Body>
                                {renderFacet(fc, index)}
                              </Accordion.Body>
                            </Accordion.Item>
                          </div>
                        }
                      }
                    </Draggable>
                  })}
                  {provided.placeholder}
                </Accordion>
              )
            }
          </ChaiseDroppable>
        </DragDropContext>
      </div>
    </div>
  )
}

export default Faceting;
