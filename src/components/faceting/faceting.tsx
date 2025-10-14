import '@isrd-isi-edu/chaise/src/assets/scss/_faceting.scss';

//react-beatiful-dnd
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DroppableProvided,
  DropResult,
} from '@hello-pangea/dnd';

// ermrestjs
import type { FacetGroup } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';

// Components
import Accordion from 'react-bootstrap/Accordion';
import ChaiseDroppable from '@isrd-isi-edu/chaise/src/components/chaise-droppable';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Dropdown from 'react-bootstrap/Dropdown';
import FacetChoicePicker from '@isrd-isi-edu/chaise/src/components/faceting/facet-choice-picker';
import FacetCheckPresence from '@isrd-isi-edu/chaise/src/components/faceting/facet-check-presence';
import FacetHeader from '@isrd-isi-edu/chaise/src/components/faceting/facet-header';
import FacetRangePicker from '@isrd-isi-edu/chaise/src/components/faceting/facet-range-picker';
import { TitleProps } from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import {
  LogActions,
  LogReloadCauses,
  LogStackPaths,
  LogStackTypes,
} from '@isrd-isi-edu/chaise/src/models/log';
import {
  FacetCheckBoxRow,
  FacetModel,
  FacetRequestModel,
} from '@isrd-isi-edu/chaise/src/models/recordset';

// servies
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import {
  FacetStorageService
} from '@isrd-isi-edu/chaise/src/services/facet-storage';

// utils
import { HELP_PAGES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getHelpPageURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';

type FacetingProps = {
  /**
   * Whether the facet panel is currently open or not
   */
  facetPanelOpen: boolean;
  /**
   * The functions that recordset is going to use from this component..
   * NOTE we have to make sure this function is called after each update of
   *      state variables that they use. Otherwise we will face a staleness issues.
   */
  registerRecordsetCallbacks: (
    getAppliedFilters: () => FacetCheckBoxRow[][],
    removeAppliedFilters: (index?: number | 'filters' | 'cfacets') => void,
    focusOnFacet: (index: number, dontUpdate?: boolean) => void
  ) => void;
  /**
   * the recordset's log stack path
   */
  recordsetLogStackPath: string;
  /**
   * callback that should be called when we're ready to initalize the data
   */
  setReadyToInitialize: () => void;

  recordsetFacetDepthLevel: number;
  recordsetUIContextTitles?: TitleProps[];
};

const Faceting = ({
  facetPanelOpen,
  registerRecordsetCallbacks,
  recordsetLogStackPath,
  setReadyToInitialize,
  recordsetUIContextTitles,
  recordsetFacetDepthLevel,
}: FacetingProps) => {
  const { dispatchError } = useError();
  const {
    reference,
    registerFacetCallbacks,
    update,
    printDebugMessage,
    checkReferenceURL,
    logRecordsetClientAction,
    getLogAction,
    getLogStack,
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
   * Store the displayed order of facets.
   *
   * - The order is encoded as array of items. The item can be either:
   *  - a number: the index of the facet column in reference.facetColumns (or facetModels)
   *  - an array of numbers: indicating a group of facets (the numbers are the indexes of the facet columns in reference.facetColumns or facetModels)
   * - This will allow us to reorder the facets while keeping the internal facet index the way it was.
   */

  // TODO the more I think about it, isOpen should be handled here and should jus get out of facetModels
  // but ...
  const [facetOrders, setFacetOrders, facetOrdersRef] = useStateRef<
    Array<number | { index: number; children: number[] }>
  >(() => {
    return FacetStorageService.getFacetOrder(reference).map((order) => {
      if ('children' in order) {
        return { index: order.index, children: order.children.map((c) => c.index) };
      } else {
        return order.index;
      }
    });
  });

  const [openedFacetGroups, setOpenedFacetGroups, openedFacetGroupsRef] = useStateRef<{
    [structureIndex: string]: boolean;
  }>(() => {
    const res: { [structureIndex: string]: boolean } = {};
    FacetStorageService.getFacetOrder(reference).forEach((order) => {
      if ('children' in order) {
        res[`${order.index}`] = order.isOpen;
      }
    });
    return res;
  });

  const [facetModels, setFacetModels, facetModelsRef] = useStateRef<FacetModel[]>(() => {
    const res: FacetModel[] = [];
    reference.facetColumns.forEach((fc) => {
      // if the parent is closed, we don't want to load the facet
      // let hasParentAndIsClosed = false;
      // if (typeof fc.groupIndex === 'number') {
      //   hasParentAndIsClosed = FacetStorageService.getFacetOpenStatus(reference, fc.groupIndex) === false;
      // }

      const isOpen = FacetStorageService.getFacetOpenStatus(reference, fc.groupIndex, fc.index);

      res.push({
        initialized: false,
        isOpen: isOpen,
        // isLoading: hasParentAndIsClosed ? false : isOpen,
        isLoading: isOpen,
        noConstraints: false,
        facetHasTimeoutError: false,
        // TODO
        // enableFavorites: $scope.$root.session && facetColumn.isEntityMode && table.favoritesPath && table.stableKey.length == 1,
        enableFavorites: false,
        parentLogStackPath: recordsetLogStackPath,
      });
    });
    return res;
  });

  /**
   * this boolean indicates whether users made any changes to the facet list or not.
   * when this is set to true, we should save the changes in the local storage and then change it back to false.
   */
  const [facetListModified, setFacetListModified] = useState(false);
  /**
   * whether the current order is based on teh stored facet order or not.
   */
  const [isStoredFacetOrderApplied, setIsStoredFacetOrderApplied] = useState(FacetStorageService.hasStoredFacetOrder(reference));

  const setFacetModelByIndex = (index: number, updatedVals: { [key: string]: boolean }) => {
    setFacetModels((prevFacetModels: FacetModel[]) => {
      return prevFacetModels.map((fm: FacetModel, fmIndex: number) => {
        if (index !== fmIndex) return fm;
        return { ...fm, ...updatedVals };
      });
    });
  };
  const setMultipleFacetModelsByIndex = (input: {
    [index: number]: { [key: string]: boolean };
  }) => {
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
    reference.facetColumns.forEach((facetColumn, index) => {
      const table = facetColumn.column.table;
      const facetLogStackNode = LogService.getStackNode(LogStackTypes.FACET, table, {
        source: facetColumn.compressedDataSource,
        entity: facetColumn.isEntityMode,
      });

      // the initial open status is based on annotation and also the local storage
      const isOpen = FacetStorageService.getFacetOpenStatus(reference, facetColumn.groupIndex, facetColumn.index);

      // TODO for now we're making sure the groups are open if any of their children are open
      ///     but if that changes, we have to update this logic
      if (isOpen) {
        facetsToPreProcess.current.push(index);
      }

      facetRequestModels.current.push({
        // some facets require extra step to process preselected filters
        preProcessed: !isOpen,
        processed: !isOpen,
        // TODO why??
        // appliedFilters: [],
        registered: false,
        processFacet: (reloadCauses: string[], reloadStartTime: number) => {
          throw new Error('function not registered');
        },
        preProcessFacet: () => {
          throw new Error('function not registered');
        },
        getAppliedFilters: () => {
          throw new Error('function not registered');
        },
        removeAppliedFilters: () => {
          throw new Error('function not registered');
        },
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

    setDisplayFacets(true);
  }, []);

  /**
   * When facets are displayed, scroll to the first open one
   */
  useLayoutEffect(() => {
    if (!displayFacets) return;
    let firstOpen: number | null = null;
    reference.facetColumns.some((fc, index) => {
      // the initial open status is based on annotation and also the local storage
      const isOpen = FacetStorageService.getFacetOpenStatus(reference, fc.groupIndex, fc.index);

      if (isOpen) {
        /**
         * the displayed order of facets might be different from facetColumns order,
         * so we cannot assume the first index that we see is the one that should be opened,
         * and instead have to do Math.min
         */
        if (firstOpen === null) {
          firstOpen = index;
        } else {
          firstOpen = Math.min(index, firstOpen);
        }
      }
      return isOpen;
    });
    setTimeout(() => {
      scrollToFacet(firstOpen === null ? 0 : firstOpen, true);
    }, 200);
  }, [displayFacets]);

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
  }, [facetModels]);

  useEffect(() => {
    registerRecordsetCallbacks(getAppliedFiltersFromRS, removeAppliedFiltersFromRS, focusOnFacet);
  }, [facetModels, facetOrders, facetListModified, isStoredFacetOrderApplied]);

  //-------------------  flow-control related functions:   --------------------//

  const updateFacetStates = (flowControl: any, resetAllOpenFacets?: boolean, cause?: string) => {
    // batch all the state changes into one
    const modifiedAttrs: { [index: number]: { [key: string]: boolean } } = {};

    const updateState = (index: number) => {
      const frm = facetRequestModels.current[index];
      const facetModel = facetModels[index];

      if (flowControl.current.lastActiveFacet === index) {
        return;
      }

      // TODO what about the group open/close state?
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
    };

    // see which facets need to be updated
    facetOrdersRef.current.forEach((fo) => {
      if (typeof fo === 'number') {
        updateState(fo);
      } else {
        fo.children.forEach((childIndex: number) => {
          updateState(childIndex);
        });
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

    printDebugMessage(
      `after facet (index=${index}) update: ${res ? 'successful.' : 'unsuccessful.'}`
    );
  };

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
        printDebugMessage(`initializing facet (index=${index})`);
        facetRequestModels.current[i]
          .preProcessFacet()
          .then(function (res: any) {
            printDebugMessage(
              `after facet (index=${i}) initialize: ${res ? 'successful.' : 'unsuccessful.'}`
            );
            flowControl.current.queue.occupiedSlots--;
            facetRequestModels.current[i].preProcessed = true;
            setFacetModelByIndex(i, { facetHasTimeoutError: false });
            updatePage();
          })
          .catch(function (err: any) {
            // show alert if 400 Query Timeout Error
            if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
              setFacetModelByIndex(i, { facetHasTimeoutError: true });
            } else {
              dispatchError({ error: err });
            }
          });
      })(index, flowControl.current.queue.counter);
    } else {
      const updateFacet = (index: number) => {
        const frm = facetRequestModels.current[index];
        if (!frm.preProcessed || frm.processed || !flowControl.current.haveFreeSlot()) {
          return;
        }

        flowControl.current.queue.occupiedSlots++;
        frm.processed = true;

        (function (i) {
          printDebugMessage(`updating facet (index=${index})`);
          facetRequestModels.current[i]
            .processFacet(frm.reloadCauses, frm.reloadStartTime)
            .then(function (res: any) {
              setFacetModelByIndex(i, { facetHasTimeoutError: false });
              afterFacetUpdate(i, res, flowControl);
              updatePage();
            })
            .catch(function (err: any) {
              // show alert if 400 Query Timeout Error
              if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
                setFacetModelByIndex(i, { facetHasTimeoutError: true });
              } else {
                dispatchError({ error: err });
              }

              afterFacetUpdate(i, true, flowControl);
            });
        })(index);
      };

      facetOrdersRef.current.forEach((o) => {
        if (typeof o === 'number') {
          updateFacet(o);
        } else {
          o.children.forEach((childIndex: number) => {
            updateFacet(childIndex);
          });
        }
      });
    }

    return;
  };

  //-------------------  callbacks that facet pickers will call:   --------------------//

  /**
   * Register the facet functions used for flow-control and recordset communication
   * When all the facets have called this function, it will ask flow-control to initialize data
   */
  const registerFacet = (
    index: number,
    processFacet: (reloadCauses: string[], reloadStartTime: number) => Promise<boolean>,
    preprocessFacet: () => Promise<boolean>,
    getAppliedFilters: () => FacetCheckBoxRow[],
    removeAppliedFilters: () => void
  ) => {
    facetRequestModels.current[index].processFacet = processFacet;
    facetRequestModels.current[index].preProcessFacet = preprocessFacet;
    facetRequestModels.current[index].getAppliedFilters = getAppliedFilters;
    facetRequestModels.current[index].removeAppliedFilters = removeAppliedFilters;
    facetRequestModels.current[index].registered = true;

    if (facetRequestModels.current.every((el) => el.registered)) {
      setAllFacetsRegistered(true);
    }
  };

  /**
   * ask flow-control to update data displayed for one facet
   * @param index the facet index
   * @param setIsLoading whether we should also change the spinner status
   * @param cause the cause of update
   */
  const dispatchFacetUpdate = (
    index: number,
    setIsLoading: boolean,
    cause?: string,
    noConstraints?: boolean
  ): void => {
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
  const updateRecordsetReference = (
    newRef: any,
    index: number,
    cause: string,
    keepRef?: boolean,
    resetAllOpenFacets?: boolean
  ) => {
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
      );
    }
    return true;
  };

  const getFacetLogAction = (index: number, actionPath: LogActions): string => {
    return getLogAction(actionPath, LogStackPaths.FACET);
  };

  const getFacetLogStack = (index: number, extraInfo?: any): any => {
    return getLogStack(facetRequestModels.current[index].logStackNode, extraInfo);
  };

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
    let newRef,
      reason = LogReloadCauses.FACET_CLEAR,
      action: LogActions | null = null;
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
      LogService.logClientAction(
        {
          action: getFacetLogAction(index, LogActions.BREADCRUMB_CLEAR),
          stack: getFacetLogStack(index),
        },
        fc.sourceReference.defaultLogInfo
      );
    } else {
      // // delete all filters and facets
      newRef = reference.removeAllFacetFilters();
      action = LogActions.BREADCRUMB_CLEAR_ALL;
      reason = LogReloadCauses.CLEAR_ALL;

      // remove all the checkboxes in the UI
      facetOrdersRef.current.forEach((order) => {
        if (typeof order === 'number') {
          const frm = facetRequestModels.current[order];
          frm.removeAppliedFilters();
        } else {
          order.children.forEach((childIndex: number) => {
            const frm = facetRequestModels.current[childIndex];
            frm.removeAppliedFilters();
          });
        }
      });
    }

    // whether we should log the action for the whole page or not
    if (action) {
      logRecordsetClientAction(action);
    }

    // removing filter should just reduce the url length limit,
    // so we don't need to check for the returned value of this function
    updateRecordsetReference(newRef, -1, reason);
  };

  /**
   * Focus on the given facet
   * @param index
   * @param dontUpdate whether we should also trigger an update request or not
   */
  const focusOnFacet = (index: number, dontUpdate?: boolean) => {
    const fm = facetModels[index];
    if (!fm.isOpen && dontUpdate !== true) {
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
    const fc = reference.facetColumns[index];
    if (fc.groupIndex && !openedFacetGroupsRef.current[`${fc.groupIndex}`]) {
      // if the parent group is closed, open it first
      toggleFacetGroup(fc.groupIndex, dontLog);
    }

    setTimeout(() => {
      setFacetModels((prevFacetModels) => {
        return prevFacetModels.map((fm: FacetModel, fmIndex: number) => {
          if (index !== fmIndex) return fm;
          const isOpen = !fm.isOpen;

          if (!dontLog) {
            const action = isOpen ? LogActions.OPEN : LogActions.CLOSE;
            // log the action
            LogService.logClientAction(
              {
                action: getFacetLogAction(index, action),
                stack: getFacetLogStack(index),
              },
              reference.facetColumns[fmIndex].sourceReference.defaultLogInfo
            );
          }

          // if we're closing it
          if (!isOpen) {
            return {
              ...fm,
              isOpen,
              // hide the spinner:
              isLoading: false,
              // if we were waiting for data, make sure to fetch it later
              initialized: !fm.isLoading,
            };
          }
          // if it's open and not initialized, then get the data
          else if (!fm.initialized) {
            // send a request
            // TODO should have priority
            dispatchFacetUpdate(index, false);

            return {
              ...fm,
              isOpen,
              isLoading: true,
            };
          }

          // otherwise we should just change the isOpen
          return { ...fm, isOpen };
        });
      });

      // make sure we're saving the new state
      setFacetListModified(true);
      setIsStoredFacetOrderApplied(false);
    }, 20);

  };

  const toggleFacetGroup = (groupIndex: number, dontLog?: boolean) => {
    setOpenedFacetGroups((prev) => {
      const isOpen = !prev[`${groupIndex}`];

      if (!dontLog) {
        // TODO log the action
        // const action = isOpen ? LogActions.OPEN : LogActions.CLOSE;
        // LogService.logClientAction(
        //   {
        //     action: getLogAction(action, LogStackPaths.FACET_GROUP),
        //     stack: LogService.getStack(LogStackTypes.FACET_GROUP, reference.table, {
        //       source: (reference.facetGroups[groupIndex] as FacetGroup).compressedDataSource,
        //       entity: true,
        //     }),
        //   },
        //   reference.defaultLogInfo
        // );
      }
      return { ...prev, [`${groupIndex}`]: isOpen };
    });

    // make sure we're saving the new state
    setFacetListModified(true);
    setIsStoredFacetOrderApplied(false);
  }

  /**
   * Given the index of a facet, scroll to it
   * @param index the index of facet
   * @param dontLog whether we should log this event or not
   */
  const scrollToFacet = (index: number, dontLog?: boolean) => {
    if (!sidePanelContainer.current) return;

    const el = sidePanelContainer.current.querySelector(
      `.facet-item-container.fc-${index}`
    ) as HTMLElement;
    if (!el) return;

    if (!dontLog) {
      const fc = reference.facetColumns[index];
      LogService.logClientAction(
        {
          action: getFacetLogAction(index, LogActions.BREADCRUMB_SCROLL_TO),
          stack: getFacetLogStack(index),
        },
        fc.sourceReference.defaultLogInfo
      );
    }

    // TODO delay this event (using debounce from react branch)
    // scroll
    sidePanelContainer.current.scrollTo({
      top: el.offsetTop,
      behavior: 'smooth',
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
    if (!result.destination) return;

    const items = Array.from(facetOrders);

    // reordering the outer accordion (groups and level-0 facets)
    if (result.type === 'first-level') {
      const [ reorderedItem ] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
    } else {
      const { groupIndex } = FacetStorageService.getFacetInfoFromStructureKey(result.destination.droppableId);
      // reordering inside a group
      const groupItem = items.find((it) => {
        return typeof it !== 'number' && it.index === groupIndex;
      }) as { index: number; children: number[] } | undefined;

      if (!groupItem) {
        $log.error('cannot find the group item for reordering inside a group');
        return;
      }

      const [ reorderedItem ] = groupItem.children.splice(result.source.index, 1);
      groupItem.children.splice(result.destination.index, 0, reorderedItem);
    }

    setFacetOrders(items);
    setFacetListModified(true);
    setIsStoredFacetOrderApplied(false);
  };

  const storeFacetOrder = () => {
    const newStoredOrder = facetOrdersRef.current.map((order) => {
      if (typeof order === 'number') {
        return {
          name: reference.facetColumns[order].sourceObjectWrapper.name,
          open: facetModelsRef.current[order].isOpen,
        };
      } else {
        const groupChildren: { name: string; open: boolean }[] = [];
        order.children.forEach((childIndex) => {
          groupChildren.push({
            name: reference.facetColumns[childIndex].sourceObjectWrapper.name,
            open: facetModelsRef.current[childIndex].isOpen,
          });
        });
        return {
          markdown_name: (reference.facetColumnsStructure[order.index] as FacetGroup).displayname.unformatted as string,
          open: openedFacetGroupsRef.current[`${order.index}`],
          children: groupChildren,
        };
      }
    });
    FacetStorageService.changeStoredFacetOrder(reference, newStoredOrder);
    setFacetListModified(false);
    setIsStoredFacetOrderApplied(true);
  };

  const applyDefaultOrStoredFacetOrder = (useDefault: boolean) => {
    // change their order
    setFacetOrders(() => {
      return FacetStorageService.getFacetOrder(reference, useDefault).map((order) => {
        if ('children' in order) {
          return { index: order.index, children: order.children.map((c) => c.index) };
        } else {
          return order.index;
        }
      });
    });

    setOpenedFacetGroups((prev) => {
      const order = FacetStorageService.getFacetOrder(reference, useDefault);
      const newPrev = { ...prev };
      order.forEach((o) => {
        if ('children' in o) {
          newPrev[`${o.index}`] = o.isOpen;
        }
      });
      return newPrev;
    });

    // open or close facets
    setFacetModels((prevFacetModels) => {
      return prevFacetModels.map((fm: FacetModel, fmIndex: number) => {
        const fc = reference.facetColumns[fmIndex];
        const isOpen = FacetStorageService.getFacetOpenStatus(reference, fc.groupIndex, fc.index, useDefault);

        // if open status has not changed, just return it
        if (fm.isOpen === isOpen) return fm;

        // if we are closing
        if (!isOpen) {
          return {
            ...fm,
            isOpen,
            // hide the spinner:
            isLoading: false,
            // if we were waiting for data, make sure to fetch it later
            initialized: !fm.isLoading,
          };
        }

        // if we're opening and it's not initialized, initiate the request
        if (!fm.initialized) {
          // send a request
          dispatchFacetUpdate(fmIndex, false);
          return { ...fm, isOpen, isLoading: true };
        }

        // otherwise just open it
        return { ...fm, isOpen };
      });
    });

    // set the boolean states
    setIsStoredFacetOrderApplied(!useDefault);
    setFacetListModified(false);
  };

  //-------------------  render logic:   --------------------//

  // bootstrap expects an array of strings
  const activeKeys: string[] = [];
  reference.facetColumnsStructure.forEach((structure) => {
    if (typeof structure === 'number') {
      if (facetModels[structure].isOpen) activeKeys.push(FacetStorageService.getFacetStructureKey(undefined, structure));
    } else if (openedFacetGroups[`${structure.structureIndex}`]) {
      activeKeys.push(FacetStorageService.getFacetStructureKey(structure.structureIndex));
      structure.children.forEach((facetIndex) => {
        if (facetModels[facetIndex].isOpen) activeKeys.push(FacetStorageService.getFacetStructureKey(structure.structureIndex, facetIndex));
      });
    }
  });

  const renderFacetAccordionItem = (key: string, facetIndex: number, draggableIndex: number) => {
    return (
      <Draggable key={key} draggableId={key} index={draggableIndex}>
        {(draggableArgs: DraggableProvided) => (
          <div
            className={`facet-item-container fc-${facetIndex}${facetModels[facetIndex].isOpen ? ' panel-open' : ''}`}
            ref={draggableArgs.innerRef}
            {...draggableArgs.draggableProps}
          >
            <ChaiseTooltip
              placement='right'
              tooltip='Drag and drop this filter to the desired position.'
            >
              <div
                className={`move-icon facet-move-icon-${facetIndex}`}
                {...draggableArgs.dragHandleProps}
              >
                <i className='fa-solid fa-grip-vertical'></i>
              </div>
            </ChaiseTooltip>
            <Accordion.Item eventKey={key} key={key} className='facet-panel'>
              <Accordion.Header
                className={`fc-heading-${facetIndex}`}
                onClick={() => toggleFacet(facetIndex)}
              >
                <FacetHeader
                  displayname={reference.facetColumns[facetIndex].displayname}
                  comment={reference.facetColumns[facetIndex].comment}
                  isLoading={facetModels[facetIndex].isLoading}
                  facetHasTimeoutError={facetModels[facetIndex].facetHasTimeoutError}
                  noConstraints={facetModels[facetIndex].noConstraints}
                />
              </Accordion.Header>
              <Accordion.Body>{renderFacet(facetIndex)}</Accordion.Body>
            </Accordion.Item>
          </div>
        )}
      </Draggable>
    );
  };

  const renderFacetList = () => {
    return facetOrders.map((order, draggableIndex: number) => {
      if (typeof order === 'number') {
        return renderFacetAccordionItem(FacetStorageService.getFacetStructureKey(undefined, order), order, draggableIndex);
      } else {
        const groupIndex = order.index;
        const group = reference.facetColumnsStructure[groupIndex] as FacetGroup;
        const groupStructureKey = FacetStorageService.getFacetStructureKey(groupIndex);

        return (
          <Draggable key={groupStructureKey} draggableId={groupStructureKey} index={groupIndex}>
            {(draggableArgs: DraggableProvided) => (
              <div
                className='facet-group-item-container'
                ref={draggableArgs.innerRef}
                {...draggableArgs.draggableProps}
              >
                <ChaiseTooltip
                  placement='right'
                  tooltip='Drag and drop this filter to the desired position.'
                >
                  <div
                    className={`move-icon group-move-icon-${groupIndex}`}
                    {...draggableArgs.dragHandleProps}
                  >
                    <i className='fa-solid fa-grip-vertical'></i>
                  </div>
                </ChaiseTooltip>
                <Accordion.Item
                  eventKey={groupStructureKey}
                  className='facet-group-item'
                >
                  <Accordion.Header
                    className='facet-group-item-header'
                    onClick={() => toggleFacetGroup(groupIndex)}
                  >
                    <FacetHeader
                      displayname={group.displayname}
                      isLoading={false}
                      facetHasTimeoutError={false}
                      noConstraints={false}
                      comment={group.comment}
                    />
                  </Accordion.Header>
                  <Accordion.Body className='facet-group-item-body'>
                    <ChaiseDroppable droppableId={groupStructureKey} type='second-level'>
                      {(droppableArgs: DroppableProvided) => (
                        <Accordion
                          activeKey={activeKeys}
                          alwaysOpen
                          {...droppableArgs.droppableProps}
                          ref={droppableArgs.innerRef}
                        >
                          {group.children.map((facetIndex, i) =>
                            renderFacetAccordionItem(FacetStorageService.getFacetStructureKey(group.structureIndex, facetIndex), facetIndex, i)
                          )}
                          {droppableArgs.placeholder}
                        </Accordion>
                      )}
                    </ChaiseDroppable>
                  </Accordion.Body>
                </Accordion.Item>
              </div>
            )}
          </Draggable>
        );
      }
    });
  };

  const renderFacet = (index: number) => {
    const fc = reference.facetColumns[index];
    const fm = facetModels[index];
    switch (fc.preferredMode) {
      case 'ranges':
        return (
          <FacetRangePicker
            dispatchFacetUpdate={dispatchFacetUpdate}
            facetColumn={fc}
            facetIndex={index}
            facetModel={fm}
            facetPanelOpen={facetPanelOpen}
            register={registerFacet}
            updateRecordsetReference={updateRecordsetReference}
            getFacetLogAction={getFacetLogAction}
            getFacetLogStack={getFacetLogStack}
          />
        );
      case 'check_presence':
        return (
          <FacetCheckPresence
            facetModel={fm}
            facetColumn={fc}
            facetIndex={index}
            register={registerFacet}
            updateRecordsetReference={updateRecordsetReference}
          />
        );
      default:
        return (
          <FacetChoicePicker
            facetModel={fm}
            facetColumn={fc}
            facetIndex={index}
            register={registerFacet}
            updateRecordsetReference={updateRecordsetReference}
            dispatchFacetUpdate={dispatchFacetUpdate}
            checkReferenceURL={checkReferenceURL}
            facetPanelOpen={facetPanelOpen}
            getFacetLogAction={getFacetLogAction}
            getFacetLogStack={getFacetLogStack}
            recordsetUIContextTitles={recordsetUIContextTitles}
            recordsetFacetDepthLevel={recordsetFacetDepthLevel}
          />
        );
    }
  };

  const renderFacetDropdownMenu = () => {
    const storedIsAvailable = FacetStorageService.hasStoredFacetOrder(reference);
    const showChangeIndicator =
      facetListModified || (storedIsAvailable && !isStoredFacetOrderApplied);
    const allowSave = showChangeIndicator;
    const allowApplyDefault = facetListModified || isStoredFacetOrderApplied;
    const allowApplySaved = storedIsAvailable && showChangeIndicator;

    return (
      <Dropdown className='chaise-dropdown chaise-dropdown-no-icon side-panel-heading-menu'>
        <ChaiseTooltip placement='right' tooltip='Customize the filter order'>
          <Dropdown.Toggle
            className={`chaise-btn chaise-btn-sm chaise-btn-tertiary${showChangeIndicator ? ' chaise-btn-with-indicator' : ''}`}
          >
            <span className='fa-solid fa-bars'></span>
          </Dropdown.Toggle>
        </ChaiseTooltip>
        <Dropdown.Menu>
          <Dropdown.Item
            className='dropdown-item-w-icon save-facet-order-btn'
            disabled={!allowSave}
            onClick={() => storeFacetOrder()}
          >
            <span>
              <span className='dropdown-item-icon fa-solid fa-check-to-slot'></span>
              <span>Save filter order</span>
            </span>
          </Dropdown.Item>
          <Dropdown.Item
            className='dropdown-item-w-icon show-default-facet-order-btn'
            disabled={!allowApplyDefault}
            onClick={() => applyDefaultOrStoredFacetOrder(true)}
          >
            <span>
              <span className='dropdown-item-icon fa-solid fa-undo'></span>
              <span>Reset to default</span>
            </span>
          </Dropdown.Item>
          <Dropdown.Item
            className='dropdown-item-w-icon apply-saved-facet-order-btn'
            disabled={!allowApplySaved}
            onClick={() => applyDefaultOrStoredFacetOrder(false)}
          >
            <span>
              <span className='dropdown-item-icon fa-solid fa-check'></span>
              <span>Apply saved state</span>
            </span>
          </Dropdown.Item>
          <Dropdown.Item
            className='dropdown-item-w-icon side-panel-heading-menu-help-btn'
            href={getHelpPageURL(HELP_PAGES.FACET_PANEL)}
            target='_blank'
          >
            <span>
              <span className='dropdown-item-icon chaise-icon chaise-info'></span>
              <span>Help</span>
            </span>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  };


  if (!displayFacets) {
    if (facetModels.length === 0) {
      return <span>No Filter Options</span>;
    }
    return <></>;
  }

  return (
    <div className='side-panel-container' ref={sidePanelContainer}>
      {renderFacetDropdownMenu()}
      <div className='faceting-columns-container'>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <ChaiseDroppable droppableId='first-level-droppable' type='first-level'>
            {(droppableArgs: DroppableProvided) => (
              <Accordion
                className='panel-group'
                activeKey={activeKeys}
                alwaysOpen
                {...droppableArgs.droppableProps}
                ref={droppableArgs.innerRef}
                key={'facet-list'}
              >
                {renderFacetList()}
                {droppableArgs.placeholder}
              </Accordion>
            )}
          </ChaiseDroppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default Faceting;
