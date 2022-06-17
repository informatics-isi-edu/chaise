import '@isrd-isi-edu/chaise/src/assets/scss/_faceting.scss';

import { useEffect, useRef, useState } from 'react';

// Components
import Accordion from 'react-bootstrap/Accordion';
import Spinner from 'react-bootstrap/Spinner';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import FacetChoicePicker from '@isrd-isi-edu/chaise/src/components/facet-choice-picker';
import FacetRangePicker from '@isrd-isi-edu/chaise/src/components/facet-range-picker';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import FacetCheckPresence from '@isrd-isi-edu/chaise/src/components/facet-check-presence';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { FacetModel, FacetRequestModel } from '@isrd-isi-edu/chaise/src/models/recordset';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// TODO subject to change
type FacetingProps = {
  facetPanelOpen: boolean
}

const Faceting = ({
  facetPanelOpen
}: FacetingProps) => {

  const { dispatchError } = useError();
  const { reference, registerFacetCallbacks, initialize, update, printDebugMessage, checkReferenceURL } = useRecordset();

  const [displayFacets, setDisplayFacets] = useState(false);
  const [readyToInitialize, setReadyToInitialize] = useState(false);

  const [facetModels, setFacetModels] = useState<FacetModel[]>(() => {
    // TODO type
    let res: any[] = [], firstOpen = -1;
    reference.facetColumns.forEach((fc: any, index: number) => {
      if (fc.isOpen) {
        firstOpen = (firstOpen === -1 || firstOpen > index) ? index : firstOpen;
      }
      res.push({
        initialized: false,
        isOpen: fc.isOpen,
        isLoading: fc.isOpen,
        noConstraints: false,
        facetError: false,
        // TODO
        // enableFavorites: $scope.$root.session && facetColumn.isEntityMode && table.favoritesPath && table.stableKey.length == 1,
        enableFavorites: false,
      });
    });
    // all the facets are closed, open the first one
    if (firstOpen === -1) {
      firstOpen = 0;
      res[0].isOpen = true;
      res[0].isLoading = true;
    }

    // TODO focus on the first open.. most probably in the useEffect
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

  // register the flow-control related callbacks
  useEffect(() => {
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
        processFacet: () => { throw new Error('function not registered') },
        preProcessFacet: () => { throw new Error('function not registered') },
        reloadCauses: [], // why the reload request is being sent to the server (might be empty)
        reloadStartTime: -1, //when the facet became dirty
        // TODO log stuff
        // I could capture the whole logStack,
        // but only did logStackNode so I can call the recordTableUtils.getTableLogStack with it.
        // logStackNode: facetLogStackNode,
        // instead of just logStackPath, we're capturing parent so it can be used in facet and facet picker.
        // parentLogStackPath: $scope.vm.logStackPath ? $scope.vm.logStackPath : logService.logStackPaths.SET,
      });
    });

    // all the facets are closed, the fist one should be processed.
    if (!atLeastOneOpen) {
      facetRequestModels.current[0].processed = false;
    }

    setDisplayFacets(true);
  }, []);

  /**
   * After all the facets are registerd, now we can initialize the data
   */
  useEffect(() => {
    if (!readyToInitialize) return;
    // initialize the recordset data only when facets are loaded
    initialize();
  }, [readyToInitialize]);

  /**
   * This will ensure the registered functions in flow-control
   * are updated based on the latest facet changes
   */
  useEffect(() => {
    registerFacetCallbacks(updateFacetStates, updateFacets);
  }, [facetModels]);

  //-------------------  flow-control related functions:   --------------------//

  function registerFacet(index: number, processFacet: Function, preprocessFacet: Function) {
    facetRequestModels.current[index].processFacet = processFacet;
    facetRequestModels.current[index].preProcessFacet = preprocessFacet;
    facetRequestModels.current[index].registered = true;

    if (facetRequestModels.current.every((el) => el.registered)) {
      $log.debug('all facets are registered, going to initialize');
      setReadyToInitialize(true);
    }
  }

  const updateFacetStates = (flowControl: any, cause?: string) => {
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
        modifiedAttrs[index] = { isLoading: true };
      }
      // otherwise we don't need to process it and should just mark
      // it as "not initialized"
      else {
        frm.processed = true;
        modifiedAttrs[index] = { initialized: false };
      }
    });

    // $log.debug('modified arrs:');
    // $log.debug(modifiedAttrs);
    setMultipleFacetModelsByIndex(modifiedAttrs);
  };

  const afterFacetUpdate = (index: number, res: boolean, flowControl: any) => {
    flowControl.current.queue.occupiedSlots--;
    const currFm = facetRequestModels.current[index];
    currFm.processed = res || currFm.processed;
    // currFm.initialized = res || currFm.initialized;
    // currFm.isLoading = !res;
    setFacetModelByIndex(index, { isLoading: !res, initialized: res });

    printDebugMessage(`after facet (index=${index}) update: ${res ? 'successful.' : 'unsuccessful.'}`);
  }

  const updateFacets = (flowControl: any, updatePage: Function) => {
    if (!flowControl.current.haveFreeSlot()) {
      $log.debug('no free slot!');
      return;
    }

    $log.debug(`have free slot, preprocess length: ${facetsToPreProcess.current.length}`);

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
          setFacetModelByIndex(i, { facetError: false });
          updatePage();
        }).catch(function (err: any) {
          // show alert if 400 Query Timeout Error
          if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
            setFacetModelByIndex(i, { facetError: true });
          } else {
            dispatchError({ error: err });
          }
        });
      })(index, flowControl.current.queue.counter);
    }
    else {
      $log.debug(`going through request models, length: ${facetRequestModels.current.length}`);
      facetRequestModels.current.forEach(function (frm, index) {
        if (!frm.preProcessed || frm.processed || !flowControl.current.haveFreeSlot()) {
          return;
        }

        $log.debug(`processing facet ${index}`);
        flowControl.current.queue.occupiedSlots++;
        frm.processed = true;

        (function (i) {
          printDebugMessage(`updating facet (index=${i})`);

          // TODO facetRequestModel stuff should be passed to process facet
          //      e.g. reloadCauses, reloadTime, etc..
          //      everything should be handled here eventually
          //      and the processFacet should only use the values and not modify them
          facetRequestModels.current[i].processFacet().then(function (res: any) {
            setFacetModelByIndex(i, { facetError: false });
            afterFacetUpdate(i, res, flowControl);
            updatePage();
          }).catch(function (err: any) {
            afterFacetUpdate(i, true, flowControl);
            // show alert if 400 Query Timeout Error
            if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
              setFacetModelByIndex(i, { facetError: true });
            } else {
              dispatchError({ error: err });
            }
          });
        })(index);
      });
    }

    return;
  };

  const dispatchFacetUpdate = (index: number, setIsLoading: boolean, cause?: string) => {
    const frm = facetRequestModels.current[index];
    frm.processed = false;
    if (setIsLoading) {
      setFacetModelByIndex(index, { isLoading: true });
    }

    $log.debug(`faceting: asking flow control to update facet index=${index}`);

    if (!Number.isInteger(frm.reloadStartTime) || frm.reloadStartTime === -1) {
      frm.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
      if (cause && frm.reloadCauses.indexOf(cause) === -1) {
        frm.reloadCauses.push(cause);
      }
    }

    // call the flow-control, so the update of facet is queued properly
    update(null, null, false, false, false, true);
  };

  const updateRecordsetReference = (newRef: any, index: number, cause: string, keepRef?: boolean) => {
    if (!checkReferenceURL(newRef)) {
      return false;
    }

    if (!keepRef) {
      update(newRef, null, true, true, true, false, cause, index);
    }
    return true;
  }

  //-------------------  UI related callbacks:   --------------------//

  /**
   * Toggle the facet and set the proper states
   * might trigger flow control
   * @param index
   * @param dontLog
   */
  const toggleFacet = (index: number, dontLog?: boolean) => {
    $log.debug(`facet ${index} toggled!`);

    setFacetModels(facetModels.map((fm: FacetModel, fmIndex: number) => {
      if (index !== fmIndex) return fm;
      const isOpen = !fm.isOpen;

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
    }));


    // TODO
    // if (!dontLog) {
    //   var action = fm.isOpen ? logService.logActions.OPEN : logService.logActions.CLOSE;
    //   // log the action
    //   logService.logClientAction({
    //     action: currentCtrl.getFacetLogAction(index, action),
    //     stack: currentCtrl.getFacetLogStack(index)
    //   }, fc.sourceReference.defaultLogInfo);
    // }
  };

  // TODO
  const scrollToFacet = (index: number, dontLog?: boolean) => {
    $log.debug(`scrolling to facet ${index}`);
  };

  // TODO should be registered in the recordset provider
  const focusOnFacet = (index: number, dontUpdate?: boolean) => {
    const fm = facetModels[index];
    if (!fm.isOpen && (dontUpdate !== true)) {
      toggleFacet(index, true);
    }

    scrollToFacet(index, dontUpdate);
  };


  //-------------------  render logic:   --------------------//

  const renderFacet = (fc: any, index: number) => {
    const fm = facetModels[index];
    switch (fc.preferredMode) {
      // TODO
      // case 'ranges':
      //   return <FacetRangePicker facetColumn={fc} index={index}></FacetRangePicker>
      // case 'check_presence':
      //   return <FacetCheckPresence facetColumn={fc} index={index}></FacetCheckPresence>
      default:
        return <FacetChoicePicker
          facetModel={fm} facetColumn={fc} facetIndex={index}
          register={registerFacet} facetPanelOpen={facetPanelOpen}
          dispatchFacetUpdate={dispatchFacetUpdate} checkReferenceURL={checkReferenceURL}
          updateRecordsetReference={updateRecordsetReference}
        />
    }
  };

  const renderFacets = () => {
    return reference.facetColumns.map((fc: any, index: number) => {
      const facetModel = facetModels[index];

      return (
        // TODO id changed to class (test cases need to be updated)
        <Accordion.Item eventKey={index + ''} key={index} className={`facet-panel fc-${index}`}>
          <Accordion.Header onClick={() => toggleFacet(index)}>
            <div className='accordion-toggle ellipsis' id={'fc-heading-' + index}>
              <span className='facet-header-text'><DisplayValue value={fc.displayname} /></span>
              <span className='facet-header-icon'>
                {
                  (facetModel.isLoading && (!facetModel.facetError || facetModel.noConstraints)) &&
                  <Spinner animation='border' />
                }
                {
                  (facetModel.facetError || facetModel.noConstraints) &&
                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip>
                        {facetModel.noConstraints && <span>showing facet values without any constraints applied.</span>}
                        {facetModel.facetError && <span>Request timeout: The facet values cannot be retrieved for updates.</span>}
                      </Tooltip>
                    }
                  >
                    <span className='fa-solid fa-triangle-exclamation' />
                  </OverlayTrigger>
                }
              </span>
            </div>
          </Accordion.Header>
          <Accordion.Body>
            {renderFacet(fc, index)}
          </Accordion.Body>
        </Accordion.Item>
      )
    })
  };

  // bootstrap expects an array of strings
  const activeKeys: string[] = [];
  facetModels.forEach((fm, index) => { if (fm.isOpen) activeKeys.push(`${index}`) });
  $log.debug(`open facets are: ${activeKeys}`);

  if (!displayFacets) {
    return <></>
  }

  return (
    <div className='faceting-columns-container'>
      <Accordion
        className='panel-group'
        alwaysOpen // allow multiple to be open together
        activeKey={activeKeys}
      >
        {renderFacets()}
      </Accordion>
    </div>
  )
}

export default Faceting;
