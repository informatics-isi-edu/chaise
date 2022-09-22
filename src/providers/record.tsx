// hooks
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { LogActions, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { MultipleRecordError, NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';
import { RecordColumnModel, RecordRelatedModel, RecordRelatedModelRecordsetProps, RecordRequestModel } from '@isrd-isi-edu/chaise/src/models/record';
import {
  RecordsetProviderAddUpdateCauses,
  RecordsetProviderFetchSecondaryRequests,
  RecordsetProviderUpdateMainEntity,
} from '@isrd-isi-edu/chaise/src/models/recordset';

// services
import RecordFlowControl from '@isrd-isi-edu/chaise/src/services/record-flow-control';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import Q from 'q';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { isNonEmptyObject, isObjectAndKeyDefined, isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { attachGoogleDatasetJsonLd } from '@isrd-isi-edu/chaise/src/utils/google-dataset';
import { canCreateRelated, generateRelatedRecordModel } from '@isrd-isi-edu/chaise/src/utils/record-utils';

export const RecordContext = createContext<{
  /**
   * The main page
   */
  page: any,
  /**
   * The main record values
   */
  recordValues: any,
  /**
   * can be used to manually trigger a read of the main entity
   */
  readMainEntity: any,
  /**
   * the main entity reference
   */
  reference: any,
  /**
   * Whether the data for the main entity is fetched or not
   */
  initialized: boolean,
  /**
   * The column models
   */
  columnModels: RecordColumnModel[],
  /**
   * Whether we should show empty sections or not
   */
  showEmptySections: boolean,
  toggleShowEmptySections: () => void,
  /**
   * forcefully show the spinner if set to true
   */
  showMainSectionSpinner: boolean,
  /**
   * Whether to show the spinner for the related section
   */
  showRelatedSectionSpinner: boolean
  // TODO while these are not needed for now, but
  // we might want to add them in case we have record-modal
  /*
   * get the appropriate log action
   */
  // getLogAction: (actionPath: LogActions, childStackPath?: any) => string,
  /**
   * get the appropriate log stack
   */
  // getLogStack: (childStackElement?: any, extraInfo?: any) => any,
  /**
   * The related entity models
   */
  relatedModels: RecordRelatedModel[],
  /**
   * allows related models to update their captured state in this provider
   * based on the changes in their inner recordsetProvider
   */
  updateRelatedRecordsetState: (index: number, isInline: boolean, values: RecordRelatedModelRecordsetProps) => void,
  /**
   * register the functions from recordsetProvider that we want to use here.
   */
  registerRelatedModel: (index: number, isInline: boolean,
    updateMainEntity: RecordsetProviderUpdateMainEntity,
    fetchSecondaryRequests: RecordsetProviderFetchSecondaryRequests,
    addUpdateCauses: RecordsetProviderAddUpdateCauses) => void,
  toggleRelatedDisplayMode: (index: number, isInline: boolean) => void,
  /**
   * log client actions
   * Notes:
   *   - the optional `ref` parameter can be used to log based on a different reference object
   */
  logRecordClientAction: (action: LogActions, childStackElement?: any, extraInfo?: any, ref?: any) => void,
  /**
   * get the appropriate log action
   */
  getRecordLogAction: (actionPath: LogActions, childStackPath?: any) => string,
  /**
   * get the appropriate log stack
   */
  getRecordLogStack: (childStackElement?: any, extraInfo?: any) => any,
  /**
   * ask for the page to be updated
   */
  updateRecordPage: (isUpdate: boolean, cause?: string, changedContainers?: any) => void
} | null>(null);

type RecordProviderProps = {
  children: JSX.Element,
  reference: any,
  logInfo: {
    logObject?: any,
    logStack: any,
    logStackPath: string,
    logAppMode?: string
  }
};

export default function RecordProvider({
  children,
  reference,
  logInfo
}: RecordProviderProps): JSX.Element {

  const { dispatchError } = useError();
  const [page, setPage] = useState<any>(null);
  const [recordValues, setRecordValues] = useState<any>([]);
  const [initialized, setInitialized, initializedRef] = useStateRef(false);
  const [showMainSectionSpinner, setShowMainSectionSpinner] = useState(true);
  const [showRelatedSectionSpinner, setShowRelatedSectionSpinner] = useState(true);

  const [modelsInitialized, setModelsInitialized] = useState(false);
  const [modelsRegistered, setModelsRegistered] = useState(false);


  const [showEmptySections, setShowEmptySections] = useState(false);

  const [relatedModels, setRelatedModels, relatedModelsRef] = useStateRef<RecordRelatedModel[]>([]);
  const setRelatedModelsByIndex = (index: number, updatedVals: { [key: string]: any }) => {
    setRelatedModels((prevModels: RecordRelatedModel[]) => {
      return prevModels.map((pm: RecordRelatedModel, pmIndex: number) => {
        if (index !== pmIndex) return pm;
        return { ...pm, ...updatedVals };
      });
    });
  };

  const [columnModels, setColumnModels, columnModelsRef] = useStateRef<(RecordColumnModel)[]>([]);
  const setColumnModelValues = (indexes: { [key: string]: boolean }, values: { [key: string]: any }) => {
    setColumnModels(
      (prevColumnModels: any) => {
        return prevColumnModels.map((cm: any, index: number) => {
          return (index in indexes) ? { ...cm, ...values } : cm;
        });
      }
    )
  };
  const setColumnModelsRelatedModelByIndex = (index: number, updatedVals: { [key: string]: any }) => {
    setColumnModels((prevModels: RecordColumnModel[]) => {
      return prevModels.map((pm: RecordColumnModel, pmIndex: number) => {
        if (index !== pmIndex || !pm.relatedModel) return pm;
        return { ...pm, relatedModel: { ...pm.relatedModel, ...updatedVals } };
      });
    });
  };

  const flowControl = useRef(new RecordFlowControl(logInfo));
  const initializedRelatedCount = useRef(0);
  const initializedInlineRelatedCount = useRef(0);

  // set the page as initialized so we can show the models and register them
  useEffect(() => {
    if (!modelsInitialized) return;
    setInitialized(true);

    // if there aren't any related models, just set registered, so we can
    // then update the whole page.
    if (flowControl.current.relatedRequestModels.length === 0 &&
      !isNonEmptyObject(flowControl.current.inlineRelatedRequestModels)
    ) {
      setModelsRegistered(true);
    }

  }, [modelsInitialized]);

  // initialize the page after all the models are registered
  useEffect(() => {
    if (!modelsRegistered) return;
    updateRecordPage(false);
  }, [modelsRegistered]);

  /**
   * set the state to update the page
   * @param isUpdate
   * @param cause
   * @param changedContainers
   */
  const updateRecordPage = (isUpdate: boolean, cause?: string, changedContainers?: any) => {
    if (!isUpdate) {
      flowControl.current.queue.counter = 0;
      flowControl.current.queue.occupiedSlots = 0;
      // the main request is already fetched
      flowControl.current.dirtyMain = false;
    } else {
      flowControl.current.dirtyMain = true;
    }

    flowControl.current.queue.counter++;

    // request models
    flowControl.current.requestModels.forEach(function (m) {
      m.processed = false;
      // the cause for related and inline are handled by columnModels and relatedTableModels
      if (m.activeListModel.entityset || m.activeListModel.aggregate) {
        // the time that will be logged with the request
        if (!Number.isInteger(m.reloadStartTime) || m.reloadStartTime === -1) {
          m.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
        }

        if (cause && m.reloadCauses && m.reloadCauses.indexOf(cause) === -1) {
          m.reloadCauses.push(cause);
        }
      }
    });

    // inline table
    Object.values(flowControl.current.inlineRelatedRequestModels).forEach(function (m) {
      // TODO causes (changedContainers?)
      m.addUpdateCauses([cause], true);
      if (m.hasWaitFor) {
        m.waitForDataLoaded = false;
      }
    });

    // related table
    flowControl.current.relatedRequestModels.forEach(function (m) {
      // TODO causes (changedContainers?)
      m.addUpdateCauses([cause], true);
      if (m.hasWaitFor) {
        m.waitForDataLoaded = false;
      }
    });

    // $rootScope.pauseRequests = false;
    processRequests(isUpdate);
  };

  // -------------------------- flow control function ---------------------- //
  /**
   * The function that actually sends the requests
   */
  const processRequests = (isUpdate?: boolean) => {
    // TODO $rootScope.pauseRequests
    if (!flowControl.current.haveFreeSlot()) {
      return;
    }
    isUpdate = (typeof isUpdate === 'boolean') ? isUpdate : false;

    if (flowControl.current.dirtyMain) {
      readMainEntity(isUpdate).then(function (tuple) {
        flowControl.current.dirtyMain = false
        processRequests(isUpdate);
      }).catch((error: any) => {
        dispatchError({ error });
      });
      return;
    }

    flowControl.current.requestModels.forEach((reqModel: RecordRequestModel, index: number) => {
      if (!flowControl.current.haveFreeSlot()) return;
      const activeListModel = reqModel.activeListModel;

      if (reqModel.processed) return;
      reqModel.processed = true;

      // inline
      if (activeListModel.inline) {
        const rm = flowControl.current.inlineRelatedRequestModels[activeListModel.index];
        rm.updateMainEntity(processRequests, !isUpdate, afterUpdateRelatedEntity(!!isUpdate, reqModel, rm.index, true));
        return;
      }

      // related
      if (activeListModel.related) {
        const rm = flowControl.current.relatedRequestModels[activeListModel.index];
        rm.updateMainEntity(processRequests, !isUpdate, afterUpdateRelatedEntity(!!isUpdate, reqModel, rm.index, false));
        return;
      }

      // entityset or aggregate
      // TODO

    });

    // aggregates in inline
    // TODO

    // aggregates in related
    // TODO
  };

  const readMainEntity = (isUpdate: boolean, addDatasetJsonLD?: boolean) => {
    const defer = Q.defer();

    setShowMainSectionSpinner(true);

    // TODO
    // clear the value of citation, so we can fetch it again.
    // if (DataUtils.isObjectAndNotNull($rootScope.reference.citation)) {
    //   $rootScope.citationReady = false;
    // } else {
    //   $rootScope.citationReady = true;
    //   $rootScope.citation = null;
    // }

    const logParams: any = flowControl.current.logObject ? flowControl.current.logObject : {};

    const action = isUpdate ? LogActions.RELOAD : LogActions.LOAD;
    logParams.action = LogService.getActionString(action);
    logParams.stack = LogService.getStackObject();

    let causes: string[] = []
    if (Array.isArray(flowControl.current.reloadCauses) && flowControl.current.reloadCauses.length > 0) {
      causes = flowControl.current.reloadCauses;
    }
    if (causes.length > 0) {
      logParams.stack = LogService.addCausesToStack(logParams.stack, causes, flowControl.current.reloadStartTime);
    }

    // making sure we're asking for TRS for the main entity
    reference.read(1, logParams, false, false, true).then((page: any) => {
      $log.info(`Page: ${page}`);

      let recordSetLink;
      const tableDisplayName = page.reference.displayname.value;
      if (page.tuples.length < 1) {
        //  recordSetLink should be used to present user with an option in case of no data found
        recordSetLink = page.reference.unfilteredReference.contextualize.compact.appLink;
        return defer.reject(new NoRecordError({}, tableDisplayName, recordSetLink)), defer.promise;
      }
      else if (page.hasNext || page.hasPrevious) {
        recordSetLink = page.reference.contextualize.compact.appLink;
        return defer.reject(new MultipleRecordError(tableDisplayName, recordSetLink)), defer.promise;
      }

      const tuple = page.tuples[0];

      // create the models if this is the first time calling this function
      if (!initializedRef.current) {
        initializeModels(tuple);
      }

      // if the main section is not waiting for any other requests, hide the spinner
      if (!flowControl.current.mainHasSecondaryRequests) {
        setShowMainSectionSpinner(false);
      }

      // Collate tuple.isHTML and tuple.values into an array of objects
      // i.e. {isHTML: false, value: 'sample'}
      const rv: any[] = [];
      tuple.values.forEach(function (value: any, index: number) {
        // let the old aggregate value be there until we have the new one
        // TODO test this
        if (isUpdate && columnModels[index].requireSecondaryRequest) {
          rv.push(recordValues[index]);
          return;
        }
        rv.push({
          isHTML: tuple.isHTML[index],
          value: value
        });
      });

      setPage(page);
      setRecordValues(rv);

      // the initial values for the templateVariables
      flowControl.current.templateVariables = tuple.templateVariables.values;
      // the aggregate values
      flowControl.current.aggregateResults = {};
      // indicator that the entityset values are fetched
      flowControl.current.entitySetResults = {};

      // TODO
      //whether citation is waiting for other data or we can show it on load
      // var citation = $rootScope.reference.citation;
      // if (DataUtils.isObjectAndNotNull(citation)) {
      //   $rootScope.citationReady = !citation.hasWaitFor;
      //   if ($rootScope.citationReady) {
      //     $rootScope.citation = citation.compute(tuple, $rootScope.templateVariables);
      //   }
      // } else {
      //   $rootScope.citationReady = true;
      //   $rootScope.citation = null;
      // }

      flowControl.current.reloadCauses = [];
      flowControl.current.reloadStartTime = -1;

      if (addDatasetJsonLD) {
        attachGoogleDatasetJsonLd(reference, tuple, flowControl.current.templateVariables);
      }

      defer.resolve(page);
    }).catch(function (exception: any) {
      // show modal with different text if 400 Query Timeout Error
      if (exception instanceof windowRef.ERMrest.QueryTimeoutError) {
        exception.subMessage = exception.message;
        exception.message = 'The main entity cannot be retrieved. Refresh the page later to try again.';
      } else {
        if (isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
          const redirectLink = createRedirectLinkFromPath(exception.errorData.redirectPath);
          exception.errorData.redirectUrl = redirectLink.replace('record', 'recordset');
        }
      }

      defer.reject(exception);
    });

    // clear logObject since it was used just for the first request
    flowControl.current.logObject = {};

    return defer.promise;
  };

  const initializeModels = (tuple: any) => {

    let canCreateAtLeastOne = false;

    // NOTE: when the read is called, reference.activeList will be generated
    // autmoatically but we want to make sure that urls are generated using tuple,
    // so the links are based on facet. We might be able to improve this and avoid
    // duplicated logic.
    const activeList = reference.generateActiveList(tuple);

    // request models
    activeList.requests.forEach((req: any) => {
      let rm = {
        activeListModel: req,
        processed: false,
      };

      if (req.entityset || req.aggregate) {
        const extra: { source: any, entity: boolean, agg?: string } = {
          source: req.column.compressedDataSource,
          entity: req.column.isEntityMode,
        };
        if (req.aggregate) {
          extra.agg = req.column.aggregateFn;
        }

        rm = {
          ...rm,
          // these attributes are used for logging purposes:
          logStack: LogService.getStackObject(
            LogService.getStackNode(LogStackTypes.PSEUDO_COLUMN, req.column.table, extra)
          ),
          logStackPath: LogService.getStackPath(null, LogStackPaths.PSEUDO_COLUMN),
          reloadCauses: [],
          reloadStartTime: -1,
          // to avoid computing this multiple times
          // this reference is going to be used for getting the values
          ...(req.entityset && { reference: req.column.reference.contextualize.compactBrief })
        };
      }

      flowControl.current.requestModels.push(rm);
    });

    // column models
    const computedColumnModels: RecordColumnModel[] = [];
    reference.columns.forEach((col: any, index: number) => {
      const requireSecondaryRequest = col.hasWaitFor || !col.isUnique;
      if (requireSecondaryRequest) {
        flowControl.current.mainHasSecondaryRequests = true;
      }
      const cm: RecordColumnModel = {
        index,
        column: col,
        hasTimeoutError: false,
        isLoading: false,
        requireSecondaryRequest
      };

      // inline
      if (col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate)) {
        flowControl.current.mainHasSecondaryRequests = true;
        cm.relatedModel = generateRelatedRecordModel(col.reference.contextualize.compactBriefInline, index, true, tuple);

        flowControl.current.inlineRelatedRequestModels[index] = {
          index,
          // whether we should do the waitfor logic:
          hasWaitFor: col.hasWaitFor,
          // this indicates that we got the waitfor data:
          // only if w got the waitfor data, and the main data we can popuplate the tableMarkdownContent value
          waitForDataLoaded: !col.hasWaitFor,
          updateMainEntity: () => { throw new Error('function not registered') },
          fetchSecondaryRequests: () => { throw new Error('function not registered') },
          addUpdateCauses: () => { throw new Error('function not registered') },
          registered: false
        }
      }

      computedColumnModels.push(cm);
    });

    setColumnModels(computedColumnModels);

    // related models
    const related = reference.related;
    const computedRelatedModels: RecordRelatedModel[] = [];
    related.forEach((item: any, index: number) => {
      const ref = item.contextualize.compactBrief;
      const canCreate = canCreateRelated(ref);

      // user can modify the current record page and can modify at least 1 of the related tables in visible-foreignkeys
      // TODO does this even make sense?
      if (!canCreateAtLeastOne && canCreate) {
        canCreateAtLeastOne = true;
      }

      flowControl.current.relatedRequestModels.push({
        index,
        hasWaitFor: ref.display.sourceHasWaitFor,
        waitForDataLoaded: false,
        updateMainEntity: () => { throw new Error('function not registered') },
        fetchSecondaryRequests: () => { throw new Error('function not registered') },
        addUpdateCauses: () => { throw new Error('function not registered') },
        registered: false
      });

      computedRelatedModels.push(generateRelatedRecordModel(ref, index, false, tuple));
    });
    setRelatedModels(computedRelatedModels);

    // chaiseConfig.showWriterEmptyRelatedOnLoad takes precedence over heuristics above for $rootScope.showEmptyRelatedTables when true or false
    // showWriterEmptyRelatedOnLoad only applies to users with write permissions for current table
    if (reference.canCreate && typeof ConfigService.chaiseConfig.showWriterEmptyRelatedOnLoad === 'boolean') {
      setShowEmptySections(ConfigService.chaiseConfig.showWriterEmptyRelatedOnLoad);
    } else {
      setShowEmptySections(canCreateAtLeastOne);
    }

    setModelsInitialized(true);
  };

  const updateRelatedRecordsetState = (index: number, isInline: boolean, values: RecordRelatedModelRecordsetProps) => {
    if (isInline) {
      setColumnModelsRelatedModelByIndex(index, { recordsetState: values });
      // setColumnModels((prevModels: RecordColumnModel[]) => {
      //   return prevModels.map((pm: RecordColumnModel, pmIndex: number) => {
      //     if (index !== pmIndex || !pm.relatedModel) return pm;
      //     const rm = { ...pm.relatedModel, recordsetState: values };
      //     return { ...pm, relatedModel: rm };
      //   });
      // });
    } else {
      setRelatedModelsByIndex(index, { recordsetState: values });
      // setRelatedModels((prevModels: RecordRelatedModel[]) => {
      //   return prevModels.map((pm: RecordRelatedModel, pmIndex: number) => {
      //     if (index !== pmIndex) return pm;
      //     return { ...pm, recordsetState: values };
      //   });
      // });
    }
  };

  const registerRelatedModel = (index: number, isInline: boolean,
    updateMainEntity: RecordsetProviderUpdateMainEntity,
    fetchSecondaryRequests: RecordsetProviderFetchSecondaryRequests,
    addUpdateCauses: RecordsetProviderAddUpdateCauses
  ) => {
    if (isInline) {
      flowControl.current.inlineRelatedRequestModels[index].updateMainEntity = updateMainEntity;
      flowControl.current.inlineRelatedRequestModels[index].fetchSecondaryRequests = fetchSecondaryRequests;
      flowControl.current.inlineRelatedRequestModels[index].addUpdateCauses = addUpdateCauses;
      flowControl.current.inlineRelatedRequestModels[index].registered = true;
    } else {
      flowControl.current.relatedRequestModels[index].updateMainEntity = updateMainEntity;
      flowControl.current.relatedRequestModels[index].fetchSecondaryRequests = fetchSecondaryRequests;
      flowControl.current.relatedRequestModels[index].addUpdateCauses = addUpdateCauses;
      flowControl.current.relatedRequestModels[index].registered = true;
    }

    const allInlineRegistered = Object.values(flowControl.current.inlineRelatedRequestModels).every((el) => el.registered);
    const allRelatedRegistered = flowControl.current.relatedRequestModels.every((el) => el.registered);
    if (allInlineRegistered && allRelatedRegistered) {
      setModelsRegistered(true);
    }
  };

  /**
   * When the data for inline or related entities are loaded,
   * - if there's no wait for, or waitfor is loaded: sets the tableMarkdownContent value.
   * - otherwise it will not do anyting.
   */
  const afterUpdateRelatedEntity = (isUpdate: boolean, reqModel: RecordRequestModel, index: number, isInline: boolean) => {
    return function (res: { success: boolean, page: any }) {
      reqModel.processed = !res.success;

      const rm = isInline ? flowControl.current.inlineRelatedRequestModels[index] : flowControl.current.relatedRequestModels[index];

      /*
      * the returned `res` boolean indicates whether we should consider this response final or not.
      * it doesn't necessarily mean that the response was successful, so we should not use the page blindly.
      * If the request errored out (timeout or other types of error) page will be undefined.
      */
      if (res.success && res.page && (!rm.hasWaitFor || rm.waitForDataLoaded)) {

        // NOTE the same thing should also be called for the wait-for reqs of page.content
        // since that request might get back sooner
        if (!isInline && !isUpdate) {
          ++initializedRelatedCount.current;
          if (initializedRelatedCount.current === relatedModels.length) {
            setShowRelatedSectionSpinner(false);
          }
        }
        // TODO this should also take care of aggregates
        if (isInline) {
          ++initializedInlineRelatedCount.current;
          if (initializedInlineRelatedCount.current === Object.keys(flowControl.current.inlineRelatedRequestModels).length) {
            initializedInlineRelatedCount.current = 0;
            setShowMainSectionSpinner(false);
          }
        }

        const updatedValues = {
          tableMarkdownContentInitialized: true,
          tableMarkdownContent: res.page.getContent(flowControl.current.templateVariables)
        };
        if (isInline) {
          setColumnModelsRelatedModelByIndex(index, updatedValues);
        } else {
          setRelatedModelsByIndex(index, updatedValues);
        }
      }
    };
  };

  // ---------------- log related function --------------------------- //

  const logRecordClientAction = (action: LogActions, childStackElement?: any, extraInfo?: any, ref?: any) => {
    const usedRef = ref ? ref : reference;
    LogService.logClientAction({
      action: flowControl.current.getLogAction(action),
      stack: flowControl.current.getLogStack(childStackElement, extraInfo)
    }, usedRef.defaultLogInfo)
  };

  const getRecordLogAction = (actionPath: LogActions, childStackPath?: any) => {
    return flowControl.current.getLogAction(actionPath, childStackPath);
  }

  const getRecordLogStack = (childStackElement?: any, extraInfo?: any) => {
    return flowControl.current.getLogStack(childStackElement, extraInfo);
  }

  // ----------------- utility/misc functions ---------------------------- //

  /**
   * Toggle the empty section
   * @returns
   */
  const toggleShowEmptySections = () => {
    setShowEmptySections((curr) => {
      logRecordClientAction(curr ? LogActions.EMPTY_RELATED_HIDE : LogActions.EMPTY_RELATED_SHOW);
      // TODO test and see if the footer issue still persists
      return !curr;
    })
  };

  const toggleRelatedDisplayMode = (index: number, isInline: boolean) => {
    if (isInline) {
      // NOTE we want to know the current value, that's why we couldn't use the utility function
      setColumnModels((prevModels: RecordColumnModel[]) => {
        return prevModels.map((pm: RecordColumnModel, pmIndex: number) => {
          if (index !== pmIndex || !pm.relatedModel) return pm;

          const isTableDisplay = !pm.relatedModel.isTableDisplay;
          const action = isTableDisplay ? LogActions.RELATED_DISPLAY_MARKDOWN : LogActions.RELATED_DISPLAY_TABLE;

          // TODO what about the stack?
          // logRecordClientAction(action, )
          return { ...pm, relatedModel: { ...pm.relatedModel, isTableDisplay } };
        });
      });
    } else {
      // NOTE we want to know the current value, that's why we couldn't use the utility function
      setRelatedModels((prevModels: RecordRelatedModel[]) => {
        return prevModels.map((pm: RecordRelatedModel, pmIndex: number) => {
          if (index !== pmIndex) return pm;
          const isTableDisplay = !pm.isTableDisplay;
          const action = isTableDisplay ? LogActions.RELATED_DISPLAY_MARKDOWN : LogActions.RELATED_DISPLAY_TABLE;

          // TODO what about the stack?
          // logRecordClientAction(action, )

          return { ...pm, isTableDisplay };
        });
      });
    }
  };


  const providerValue = useMemo(() => {
    return {
      // main entity:
      page,
      recordValues,
      readMainEntity,
      reference,
      initialized,
      columnModels,
      showMainSectionSpinner,
      // both main and related entities section:
      showEmptySections,
      toggleShowEmptySections,
      updateRecordPage,
      // log related:
      logRecordClientAction,
      getRecordLogAction,
      getRecordLogStack,
      // related entity:
      showRelatedSectionSpinner,
      relatedModels,
      updateRelatedRecordsetState,
      registerRelatedModel,
      toggleRelatedDisplayMode
    };
  }, [
    // main entity:
    page, recordValues, initialized, columnModels, showMainSectionSpinner,
    // mix:
    showEmptySections,
    // related entities:
    showRelatedSectionSpinner, relatedModels,
  ]);

  return (
    <RecordContext.Provider value={providerValue}>
      {children}
    </RecordContext.Provider>
  )
}
