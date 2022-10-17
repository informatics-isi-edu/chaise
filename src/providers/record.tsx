// hooks
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { MultipleRecordError, NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';
import {
  CitationModel, RecordColumnModel, RecordRelatedModel,
  RecordRelatedModelRecordsetProps, RecordRequestModel
} from '@isrd-isi-edu/chaise/src/models/record';
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
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { isNonEmptyObject, isObjectAndKeyDefined, isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { attachGoogleDatasetJsonLd } from '@isrd-isi-edu/chaise/src/utils/google-dataset';
import { canCreateRelated, generateRelatedRecordModel, getRelatedPageLimit } from '@isrd-isi-edu/chaise/src/utils/record-utils';

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
   * the citation object
   */
  citation: CitationModel,
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
  updateRecordPage: (isUpdate: boolean, cause?: string, changedContainers?: any) => void,
  /**
   * will pause the requests that are pending for updating the page.
   */
  pauseUpdateRecordPage: () => void,
  /**
   * Resume the requests after pausing
   */
  resumeUpdateRecordPage: () => void,
  /**
   * the ref for the addRecordRequests
   * can be used to see if there are any pending create requests
   * TODO proper type
   */
  addRecordRequests: any
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
  const [page, setPage, pageRef] = useStateRef<any>(null);
  const [recordValues, setRecordValues, recordValuesRef] = useStateRef<any>([]);
  const [initialized, setInitialized, initializedRef] = useStateRef(false);
  const [citation, setCitation] = useState<CitationModel>({
    value: null,
    isReady: false
  });

  const [showMainSectionSpinner, setShowMainSectionSpinner] = useState(true);
  const [showRelatedSectionSpinner, setShowRelatedSectionSpinner, showRelatedSectionSpinnerRef] = useStateRef(true);

  const [modelsInitialized, setModelsInitialized] = useState(false);
  const [modelsRegistered, setModelsRegistered] = useState(false);


  const [showEmptySections, setShowEmptySections, showEmptySectionsRef] = useStateRef(false);

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
  const setColumnModelValues = (indexes: { [key: string]: any }, values: { [key: string]: any }) => {
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

  const addRecordRequests = useRef<any>({});

  const pauseProcessingRequests = useRef(false);

  const flowControl = useRef(new RecordFlowControl(logInfo));
  const initializedRelatedCount = useRef(0);
  const fetchedColsWithSecondaryRequests = useRef(0);

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
  const updateRecordPage = (isUpdate: boolean, cause?: string, changedContainers?: any[]) => {
    // TODO properly use changed containers
    if (!isUpdate) {
      flowControl.current.queue.counter = 0;
      flowControl.current.queue.occupiedSlots = 0;
      // the main request is already fetched
      flowControl.current.dirtyMain = false;
    } else {
      flowControl.current.dirtyMain = true;

      flowControl.current.addCauses([cause]);
    }

    flowControl.current.queue.counter++;

    // request models
    flowControl.current.requestModels.forEach(function (m) {
      m.processed = false;
      // the cause for related and inline are handled by columnModels and relatedTableModels
      if (m.activeListModel.entityset || m.activeListModel.aggregate) {
        flowControl.current.addCausesToRequestModel(m, [cause]);
      }
    });

    // inline table
    const inlineRequestModels = Object.values(flowControl.current.inlineRelatedRequestModels);
    inlineRequestModels.forEach(function (m) {
      // TODO causes (changedContainers?)
      // the last parameter is making sure we're using the same queue for the main and inline
      m.addUpdateCauses([cause], true, !isUpdate ? flowControl.current.queue : undefined);
      if (m.hasWaitFor) {
        m.waitForDataLoaded = false;
      }
    });

    // related table
    flowControl.current.relatedRequestModels.forEach(function (m) {
      // TODO causes (changedContainers?)
      // the last parameter is making sure we're using the same queue for the main and related
      m.addUpdateCauses([cause], true, !isUpdate ? flowControl.current.queue : undefined);
      if (m.hasWaitFor) {
        m.waitForDataLoaded = false;
      }
    });

    // update the cause list
    const uc = LogReloadCauses;
    const selfCause: any = {};
    selfCause[uc.RELATED_BATCH_UNLINK] = selfCause[uc.RELATED_INLINE_BATCH_UNLINK] = uc.ENTITY_BATCH_UNLINK;
    selfCause[uc.RELATED_CREATE] = selfCause[uc.RELATED_INLINE_CREATE] = uc.ENTITY_CREATE;
    selfCause[uc.RELATED_DELETE] = selfCause[uc.RELATED_INLINE_DELETE] = uc.ENTITY_DELETE;
    selfCause[uc.RELATED_UPDATE] = selfCause[uc.RELATED_INLINE_UPDATE] = uc.ENTITY_UPDATE;
    if (Array.isArray(changedContainers)) {
      changedContainers.forEach(function (container) {

        // add it to main causes
        flowControl.current.addCauses([container.cause]);

        // add it to request models for aggregate and entity set
        flowControl.current.requestModels.forEach(function (m) {
          if (m.activeListModel.entityset || m.activeListModel.aggregate) {
            flowControl.current.addCausesToRequestModel(m, [container.cause]);
          }
        });

        // add it to inline related
        inlineRequestModels.forEach(function (m, index) {
          let c = container.cause;
          if (container.isInline && container.index === index) {
            c = selfCause[c];
          }
          m.addUpdateCauses([c]);
        });

        // add it to related
        flowControl.current.relatedRequestModels.forEach(function (m, index) {
          let c = container.cause;
          if (!container.isInline && container.index === index) {
            c = selfCause[c];
          }
          m.addUpdateCauses([m]);
        });

      });
    }

    pauseProcessingRequests.current = false;
    processRequests(isUpdate);
  };

  /**
   * will pause the requests that are pending for updating the page.
   * Currently it's only setting a variable, but we might want to add
   * more logic later.
   */
  const pauseUpdateRecordPage = () => {
    pauseProcessingRequests.current = true;
  }

  /**
   * Resume the requests after pausing
   */
  const resumeUpdateRecordPage = () => {
    if (!pauseProcessingRequests.current) return;
    pauseProcessingRequests.current = false;
    processRequests(true);
  }

  // -------------------------- flow control function ---------------------- //
  /**
   * The function that actually sends the requests
   */
  const processRequests = (isUpdate?: boolean) => {
    // TODO $rootScope.pauseRequests
    if (!flowControl.current.haveFreeSlot() || pauseProcessingRequests.current) {
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

    let i;
    for (i = 0; i < flowControl.current.requestModels.length; i++) {
      const reqModel = flowControl.current.requestModels[i];

      if (!flowControl.current.haveFreeSlot()) return;
      const activeListModel = reqModel.activeListModel;

      if (reqModel.processed) continue;
      reqModel.processed = true;

      // inline
      if (activeListModel.inline) {
        const rm = flowControl.current.inlineRelatedRequestModels[activeListModel.index];
        rm.updateMainEntity(processRequests, !isUpdate, afterUpdateRelatedEntity(!!isUpdate, reqModel, rm.index, true));
        continue;
      }

      // related
      if (activeListModel.related) {
        const rm = flowControl.current.relatedRequestModels[activeListModel.index];
        rm.updateMainEntity(processRequests, !isUpdate, afterUpdateRelatedEntity(!!isUpdate, reqModel, rm.index, false));
        continue;
      }

      // entityset or aggregate
      fetchSecondaryRequest(reqModel, isUpdate, flowControl.current.queue.counter).then((res: boolean) => {
        flowControl.current.queue.occupiedSlots--;
        reqModel.processed = res;
      }).catch((err) => {
        dispatchError({ error: err });
      });
    }

    // aggregates in inline
    for (i = 0; i < columnModels.length; i++) {
      if (!flowControl.current.haveFreeSlot()) return;
      const cm = columnModels[i];
      if (cm.relatedModel) {
        const rm = flowControl.current.inlineRelatedRequestModels[cm.index];
        // TODO does spinner make sense?
        rm.fetchSecondaryRequests(processRequests, false);
      }
    }

    // aggregates in related
    for (i = 0; i < flowControl.current.relatedRequestModels.length; i++) {
      if (!flowControl.current.haveFreeSlot()) return;
      const rm = flowControl.current.relatedRequestModels[i];
      rm.fetchSecondaryRequests(processRequests, false);
    }
  };

  /**
   * Read data for the main entity
   * @param {boolean} isUpdate whether this is update request or load
   * @param {boolean} addDatasetJsonLD whether we should add the dataset json-ld or not
   */
  const readMainEntity = (isUpdate: boolean, addDatasetJsonLD?: boolean) => {
    return new Promise<any>((resolve, reject) => {

      setShowMainSectionSpinner(true);

      // clear the value of citation, so we can fetch it again.
      setCitation({ isReady: isObjectAndNotNull(reference.citation), value: null });

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
          reject(new NoRecordError({}, tableDisplayName, recordSetLink));
          return;
        }
        else if (page.hasNext || page.hasPrevious) {
          recordSetLink = page.reference.contextualize.compact.appLink;
          reject(new MultipleRecordError(tableDisplayName, recordSetLink));
          return;
        }

        const tuple = page.tuples[0];

        // create the models if this is the first time calling this function
        if (!initializedRef.current) {
          initializeModels(tuple);
        }

        // if the main section is not waiting for any other requests, hide the spinner
        if (flowControl.current.numColsRequireSecondaryRequests === 0) {
          setShowMainSectionSpinner(false);
        }

        // if there aren't any related entities don't show the spinner
        if (flowControl.current.relatedRequestModels.length === 0 && showRelatedSectionSpinner) {
          setShowRelatedSectionSpinner(false);
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

        //whether citation is waiting for other data or we can show it on load
        const refCitation = reference.citation;
        if (isObjectAndNotNull(refCitation)) {
          setCitation({
            isReady: !refCitation.hasWaitFor,
            value: refCitation.hasWaitFor ? null : refCitation.compute(tuple, flowControl.current.templateVariables)
          });
        } else {
          setCitation({ isReady: true, value: null });
        }

        flowControl.current.reloadCauses = [];
        flowControl.current.reloadStartTime = -1;

        if (addDatasetJsonLD) {
          attachGoogleDatasetJsonLd(reference, tuple, flowControl.current.templateVariables);
        }

        resolve(page);
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
        reject(exception);
      });

      // clear logObject since it was used just for the first request
      flowControl.current.logObject = {};
    });
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
        ++flowControl.current.numColsRequireSecondaryRequests;
      }
      const cm: RecordColumnModel = {
        index,
        column: col,
        hasTimeoutError: false,
        isLoading: false,
        requireSecondaryRequest,
      };

      // inline
      if (col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate)) {
        cm.relatedModel = generateRelatedRecordModel(
          col.reference.contextualize.compactBriefInline, index, true, tuple, reference
        );

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

      computedRelatedModels.push(generateRelatedRecordModel(ref, index, false, tuple, reference));
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
    } else {
      setRelatedModelsByIndex(index, { recordsetState: values });
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
        afterRequestDone(isUpdate, isInline);

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

  /**
   * @private
   * Generate request for each individual aggregate columns.
   * Returns a promise. The resolved value denotes the success or failure.
   */
  const fetchSecondaryRequest = (reqModel: RecordRequestModel, isUpdate: boolean, current: number) => {
    return new Promise<boolean>((resolve, reject) => {
      const activeListModel = reqModel.activeListModel;

      // show spinner for all the dependent columns
      const updatedColumnModels: any = {};
      activeListModel.objects.forEach(function (obj: any) {
        if (obj.column || obj.inline) {
          updatedColumnModels[obj.index] = true;
        }
        // what about related? we're not showing any spinner...
      });
      setColumnModelValues(updatedColumnModels, { isLoading: true });

      const action = isUpdate ? LogActions.RELOAD : LogActions.LOAD;
      let stack = reqModel.logStack;
      if (Array.isArray(reqModel.reloadCauses) && reqModel.reloadCauses.length > 0) {
        stack = LogService.addCausesToStack(stack, reqModel.reloadCauses, reqModel.reloadStartTime);
      }
      const logObj = {
        action: LogService.getActionString(action, reqModel.logStackPath),
        stack: stack
      };

      let cb;
      if (activeListModel.entityset) {
        cb = reqModel.reference.read(getRelatedPageLimit(reqModel.reference), logObj);
      } else {
        cb = activeListModel.column.getAggregatedValue(pageRef.current, logObj);
      }

      cb.then(function (values: any) {
        if (flowControl.current.queue.counter !== current) {
          resolve(false);
          return;
        }

        // remove the column error (they might retry)
        const errroIndexes: any = {};
        activeListModel.objects.forEach(function (obj: any) {
          if (obj.column) {
            errroIndexes[obj.index] = false;
          }
        });
        setColumnModelValues(errroIndexes, { hasError: false });

        //update the templateVariables
        const sourceDefinitions = reference.table.sourceDefinitions;
        const sm = sourceDefinitions.sourceMapping[activeListModel.column.name];

        if (activeListModel.entityset) { // entitysets
          // this check is unnecessary, otherwise ermrestjs wouldn't add them to the active list
          // but for consistency I left this check here
          // entitysets are fetched to be used in waitfor, so we don't need to do anything else with
          // the returned object apart from updating the templateVariables
          if (activeListModel.objects.length > 0 && Array.isArray(sm)) {
            sm.forEach(function (k) {
              // the returned values is a page object in this case
              flowControl.current.templateVariables[k] = values.templateVariables;
            });
          }

          // update the entitySetResults (we're just using this to make sure it's done)
          flowControl.current.entitySetResults[activeListModel.column.name] = true;
        } else { // aggregates
          // use the returned value (assumption is that values is an array of 0)
          const val = values[0];

          if (activeListModel.objects.length > 0 && Array.isArray(sm)) {
            sm.forEach(function (k) {
              if (val.templateVariables['$self']) {
                flowControl.current.templateVariables[k] = val.templateVariables['$self'];
              }
              if (val.templateVariables['$_self']) {
                flowControl.current.templateVariables[`_${k}`] = val.templateVariables['$_self'];
              }
            });
          }

          //update the aggregateResults
          flowControl.current.aggregateResults[activeListModel.column.name] = val;
        }

        // attach the value if all has been returned
        attachPseudoColumnValue(activeListModel, isUpdate);

        // clear the causes
        reqModel.reloadCauses = [];
        reqModel.reloadStartTime = -1;

        resolve(true);
      }).catch(function (err: any) {
        if (flowControl.current.queue.counter !== current) {
          reject(false);
          return;
        }

        const errorIndexes: any = {};
        activeListModel.objects.forEach(function (obj: any) {
          if (obj.column || obj.inline) {
            errorIndexes[obj.index] = false;
          }
          // what about the related entities?
        });

        if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
          // show the timeout error in dependent models
          setColumnModelValues(errorIndexes, { isLoading: false, hasError: true });

          // mark this request as done
          resolve(true);
        } else {
          setColumnModelValues(errorIndexes, { isLoading: false });
          reject(err);
        }

      });

    });
  };

  /**
   * Whether the data for the column is fetched
   * @param column
   */
  const hasColumnData = (column: any): boolean => {
    return column.isUnique || column.name in flowControl.current.aggregateResults || column.name in flowControl.current.entitySetResults;
  }

  /**
   * @private
   * This function is called inside `_readPseudoColumn`, after
   * the value is attached to the appropriate objects.
   * The purpose of this function is to show value of a model,
   * if all its dependencies are available.
   * @param {any} activeListModel - the model that ermrestjs returns
   */
  const attachPseudoColumnValue = (activeListModel: any, isUpdate: boolean) => {
    const newRecordVals: { [key: number]: any } = {}, // the new values
      doneInlines: { [key: number]: boolean } = {}, // index of inlines that are done
      doneRelated: { [key: number]: boolean } = {}; // index of relateds that are done
    activeListModel.objects.forEach(function (obj: any) {
      if (obj.citation) {
        // we don't need to validate the .citation here because obj.citation means that the citation is available and not null
        const hasAll = reference.citation.waitFor.every(hasColumnData);

        // if all the waitfor values are fetched, we can change the citation value
        if (hasAll) {
          setCitation({
            value: reference.citation.compute(pageRef.current.tuples[0], flowControl.current.templateVariables),
            isReady: true
          });
        }
        return;
      } else if (obj.column) {
        const cmodel = columnModelsRef.current[obj.index];
        const hasAll = cmodel.column.waitFor.every(hasColumnData);
        // we need the second check because ermrestjs is not adding the current column,
        // NOTE I might be able to improve ermrestjs for this purpose
        if (!(hasAll && hasColumnData(cmodel.column))) {
          return;
        }

        const displayValue = cmodel.column.sourceFormatPresentation(
          flowControl.current.templateVariables,
          flowControl.current.aggregateResults[cmodel.column.name],
          pageRef.current.tuples[0]
        );

        afterRequestDone(isUpdate, true);

        newRecordVals[obj.index] = displayValue;
      } else if (obj.inline || obj.related) {
        let ref: any, reqModel: any;
        if (obj.related) {
          ref = relatedModelsRef.current[obj.index].initialReference;
          reqModel = flowControl.current.relatedRequestModels[obj.index];
        } else {
          ref = columnModels[obj.index].relatedModel!.initialReference;
          reqModel = flowControl.current.inlineRelatedRequestModels[obj.index];
        }
        const hasAll = ref.display.sourceWaitFor.every(hasColumnData);
        if (!hasAll) return;

        // in case the main request was slower, this will just signal so the other
        // code path can just set the values
        reqModel.waitForDataLoaded = true;

        afterRequestDone(isUpdate, obj.inline ? true : false);

        // after this we will make sure to set the state variables based on these
        if (obj.related) {
          doneRelated[obj.index] = true;
        } else {
          doneInlines[obj.index] = true;
        }
      }
    });

    // set the values
    setRecordValues((prevValues: any) => (
      prevValues.map((val: any, index: number) => {
        if (index in newRecordVals) {
          return newRecordVals[index];
        }
        return val;
      })
    ));

    // update column models
    setColumnModels((prevModels: RecordColumnModel[]) => (
      prevModels.map((val: RecordColumnModel, index: number) => {
        if (index in newRecordVals) {
          return { ...val, isLoading: false };
        }
        else if (index in doneInlines && !!val.relatedModel) {
          // if the page data is already fetched, we can just popuplate the tableMarkdownContent value.
          // otherwise we should just wait for the related/inline table data to get back to popuplate the tableMarkdownContent
          let mdProps: { tableMarkdownContentInitialized: boolean, tableMarkdownContent: string | null } | {} = {};
          if (val.relatedModel.recordsetState.page && !val.relatedModel.recordsetState.isLoading) {
            mdProps = {
              tableMarkdownContentInitialized: true,
              tableMarkdownContent: val.relatedModel.recordsetState.page.getContent(flowControl.current.templateVariables),
            }
          }
          return { ...val, isLoading: false, relatedModel: { ...val.relatedModel, ...mdProps } };
        }
        return val;
      })
    ));

    // update related model state
    setRelatedModels((prevModels: RecordRelatedModel[]) => (
      prevModels.map((val: RecordRelatedModel, index: number) => {
        if (index in doneRelated) {
          // if the page data is already fetched, we can just popuplate the tableMarkdownContent value.
          // otherwise we should just wait for the related/inline table data to get back to popuplate the tableMarkdownContent
          if (val.recordsetState.page && !val.recordsetState.isLoading) {
            return {
              ...val,
              tableMarkdownContentInitialized: true,
              tableMarkdownContent: val.recordsetState.page.getContent(flowControl.current.templateVariables),
            }
          }
        }
        return val;
      })
    ))
  }

  /**
   * after inline, aggregate, entityset, or related request is done,
   * this function should be called to set the state of spinners.
   */
  const afterRequestDone = (isUpdate: boolean, isInline: boolean) => {
    if (!isInline) {
      if (isUpdate) return;
      ++initializedRelatedCount.current;
      if (initializedRelatedCount.current === relatedModels.length) {
        setShowRelatedSectionSpinner(false);
      }
      return;
    }

    ++fetchedColsWithSecondaryRequests.current;
    if (fetchedColsWithSecondaryRequests.current === flowControl.current.numColsRequireSecondaryRequests) {
      fetchedColsWithSecondaryRequests.current = 0;
      setShowMainSectionSpinner(false);
    }
  }

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
      citation,
      columnModels,
      showMainSectionSpinner,
      // both main and related entities section:
      showEmptySections,
      toggleShowEmptySections,
      updateRecordPage,
      pauseUpdateRecordPage,
      resumeUpdateRecordPage,
      // log related:
      logRecordClientAction,
      getRecordLogAction,
      getRecordLogStack,
      // related section:
      showRelatedSectionSpinner,
      relatedModels,
      updateRelatedRecordsetState,
      registerRelatedModel,
      toggleRelatedDisplayMode,
      addRecordRequests
    };
  }, [
    // main entity:
    page, recordValues, initialized, citation, columnModels, showMainSectionSpinner,
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
