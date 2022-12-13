// hooks
import { createContext, useEffect, useMemo, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import { appModes, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';
// import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
// import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import { getDisplaynameInnerText, simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { columnToColumnModel, populateCreateInitialValues, populateEditInitialValues } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { DEFAULT_HEGHT_MAP, replaceNullOrUndefined } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';


export const RecordeditContext = createContext<{
  /* which mode of recordedit we are in */
  appMode: string,
  /* the main entity reference */
  reference: any,
  /* the main page from reading the reference */
  page: any,
  /* the tuples correspondeing to the displayed form */
  tuples: any,
  /* the created column models from reference.columns */
  columnModels: RecordeditColumnModel[],
  /* Whether the data for the main entity is fetched and the model is initialized  */
  initialized: boolean,
  /* Array of numbers for initalizing form data */
  forms: number[],
  /* callback to add form(s) to the forms array */
  addForm: (count: number) => number[],
  /* callback to remove from(s) from the forms array */
  removeForm: (indexes: number[]) => void,
  /* Object to keep track of height changes for each column name display cell */
  keysHeightMap: any,
  /* callback to manipulate the keys height map */
  updateKeysHeightMap: (colName: string, height: number) => void,
  /* Object to keep track of height changes for each input cell */
  formsHeightMap: any,
  /* callback to manipulate the forms height map */
  handleInputHeightAdjustment: (fieldName: string, msgCleared: boolean, fieldType: string) => void,
  /* returns the initial values for all forms to display */
  getInitialFormValues: (forms: number[], columnModels: RecordeditColumnModel[]) => any,
  /* callback for react-hook-form to call when forms are valid */
  onSubmitValid: (data: any) => void,
  /* callback for react-hook-form to call when forms are NOT valid */
  onSubmitInvalid: (data: any) => void,
  /* max rows allowed to add constant */
  MAX_ROWS_TO_ADD: number
} | null>(null);

type RecordeditProviderProps = {
  appMode: string;
  children: JSX.Element;
  queryParams: any;
  reference: any;
  logInfo: {
    logAppMode?: string;
    logObject?: any;
    logStack: any;
    logStackPath: string;
  }
};

export default function RecordeditProvider({
  appMode,
  children,
  logInfo,
  queryParams,
  reference
}: RecordeditProviderProps): JSX.Element {

  const { addAlert } = useAlert();
  const { session, validateSessionBeforeMutation } = useAuthn();
  const { dispatchError } = useError();

  const maxRowsToAdd = 201;

  const [page, setPage, pageRef] = useStateRef<any>(null);
  const [columnModels, setColumnModels] = useState<RecordeditColumnModel[]>([])
  const [initialized, setInitialized, initializedRef] = useStateRef(false);

  const [tuples, setTuples] = useState<any[]>([]);

  // an array of unique keys to for referencing each form
  const [forms, setForms] = useState<number[]>([1]);
  /*
   * Object to keep track of height changes for each column name display cell
   *  - each key is the column name
   *  - each value is -1 if not changed or the corresponding height value to apply
   */
  const [keysHeightMap, setKeysHeightMap] = useState<any>({})
  /*
   * Object to keep track of height changes for each input cell
   *  - each key is the column name
   *  - each value is an array
   *    - the length of the arrays is equal to the total number of forms
   *    - each value in the  array is 1 if not changed or the corresponding height value to apply
   */
  const [formsHeightMap, setFormsHeightMap] = useState<any>({})

  useEffect(() => {
    if (!reference) return;

    const tempColumnModels: RecordeditColumnModel[] = [];
    reference.columns.forEach((column: any) => {
      tempColumnModels.push(columnToColumnModel(column));
    })
    setColumnModels([...tempColumnModels]);

    // generate initial forms hmap
    const tempKeysHMap: any = {};
    const tempFormsHMap: any = {};
    tempColumnModels.forEach((cm: any) => {
      const colname = makeSafeIdAttr(cm.column.displayname.value);
      tempKeysHMap[colname] = -1;
      tempFormsHMap[colname] = [-1];
    });

    setKeysHeightMap(tempKeysHMap);
    setFormsHeightMap(tempFormsHMap);

    // TODO: table and schema names to attach to app-container
    // idSafeTableName = makeSafeIdAttr(reference.table.name);
    // idSafeSchemaName = makeSafeIdAttr(reference.table.schema.name);

    const ERMrest = windowRef.ERMrest;
    if (appMode === appModes.EDIT || appMode === appModes.COPY) {
      if (reference.canUpdate) {
        let numberRowsToRead = maxRowsToAdd;
        if (queryParams.limit) {
          numberRowsToRead = Number(queryParams.limit);
          if (numberRowsToRead > maxRowsToAdd) {
            let limitMessage = `Trying to edit ${numberRowsToRead} records. A maximum of ${maxRowsToAdd} records can be edited at once. `;
            limitMessage += `Showing the first ${maxRowsToAdd} records.`;
            addAlert(limitMessage, ChaiseAlertType.ERROR);
          }
        }

        // in edit mode, we have to check the TCRS (row-level acls)
        const getTCRS = appMode === appModes.EDIT;
        reference.read(numberRowsToRead, logInfo.logObject, false, false, false, getTCRS).then((readPage: any) => {
          setPage(readPage);
          $log.info('Page: ', readPage);

          if (readPage.tuples.length < 1) {
            // TODO: understand the filter that was used and relate that information to the user (it oucld be a facet filter now)
            const recordSetLink = readPage.reference.unfilteredReference.contextualize.compact.appLink;
            dispatchError({ error: new NoRecordError({}, readPage.reference.displayname.value, recordSetLink) });
          }

          let headTitle;
          // make sure at least one row is editable and setup headTitle
          if (appMode === appModes.EDIT) {
            const forbiddenTuples = readPage.tuples.filter((t: any) => {
              return !t.canUpdate;
            });
            // all the rows are disabled
            if (forbiddenTuples.length === readPage.tuples.length) {
              const errMessage = MESSAGE_MAP.unauthorizedMessage + MESSAGE_MAP.reportErrorToAdmin;
              const forbiddenError = new ERMrest.ForbiddenError(MESSAGE_MAP.unauthorizedErrorCode, errMessage);
              // NOTE there might be different reasons for this (column vs row)
              // should we list all of them?
              forbiddenError.subMessage = forbiddenTuples[0].canUpdateReason;
              dispatchError({ error: forbiddenError });
            }

            headTitle = 'Edit ' + getDisplaynameInnerText(reference.displayname);
            if (readPage.tuples.length === 1) headTitle += ': ' + getDisplaynameInnerText(readPage.tuples[0].displayname);
          } else {
            headTitle = 'Create new ' + getDisplaynameInnerText(reference.displayname);
          }

          // send string to prepend to "headTitle"
          // For editing ==1 record - "Edit <table>: <rowname>"
          // For editing >1 record  - "Edit <table>"
          // For copy >=1 record    - "Create new <table>"
          updateHeadTitle(headTitle);

          if (readPage.tuples.length > 1) {
            const newForms = addForm(readPage.tuples.length - 1)
            console.log(newForms);
          }

          console.log('recordedit initialized');
          setInitialized(true);
        }, (response: any) => {
          const errorData: any = {};
          errorData.redirectUrl = reference.unfilteredReference.contextualize.compact.appLink;
          errorData.gotoTableDisplayname = reference.displayname.value;
          response.errorData = errorData;

          if (isObjectAndKeyDefined(response.errorData, 'redirectPath')) {
            let redirectLink = createRedirectLinkFromPath(response.errorData.redirectPath);
            if (response instanceof ERMrest.InvalidFilterOperatorError) redirectLink = redirectLink.replace('recordedit', 'recordset');
            response.errorData.redirectUrl = redirectLink;
          }

          dispatchError({ error: response });
        });
      } else if (session) {
        const errMessage = MESSAGE_MAP.unauthorizedMessage + MESSAGE_MAP.reportErrorToAdmin;
        const forbiddenError = new ERMrest.ForbiddenError(MESSAGE_MAP.unauthorizedErrorCode, errMessage);
        forbiddenError.subMessage = reference.canUpdateReason;
        dispatchError({ error: forbiddenError });
      } else {
        const errMessage = MESSAGE_MAP.unauthorizedMessage + MESSAGE_MAP.reportErrorToAdmin;
        const unauthorizedError = new ERMrest.UnauthorizedError(MESSAGE_MAP.unauthorizedErrorCode, errMessage);
        dispatchError({ error: unauthorizedError });
      }
    } else if (appMode === appModes.CREATE) {
      if (reference.canCreate) {
        updateHeadTitle('Create new ' + reference.displayname.value);

        console.log('recordedit initialized');
        setInitialized(true);
      } else if (session) {
        const errMessage = MESSAGE_MAP.unauthorizedMessage + MESSAGE_MAP.reportErrorToAdmin;
        const forbiddenError = new ERMrest.ForbiddenError(MESSAGE_MAP.unauthorizedErrorCode, errMessage);
        forbiddenError.subMessage = reference.canCreateReason;
        dispatchError({ error: forbiddenError });
      } else {
        const errMessage = MESSAGE_MAP.unauthorizedMessage + MESSAGE_MAP.reportErrorToAdmin;
        const unauthorizedError = new ERMrest.UnauthorizedError(MESSAGE_MAP.unauthorizedErrorCode, errMessage);
        dispatchError({ error: unauthorizedError });
      }
    }

  }, [reference])

  const onSubmitValid = (data: any) => {
    const submissionRows: any[] = []
    forms.forEach((f: number, idx: number) => {
      const currRow: any = {};
      reference.columns.forEach((col: any) => {
        // TODO: fix indexing
        const v = data[idx + '-' + col.displayname.value];
        currRow[col.name] = (v === undefined || v === '') ? null : v;
      });
      submissionRows.push(currRow);
    });

    validateSessionBeforeMutation(() => {
      const submitSuccessCB = (response: any) => {
        console.log(response);

        // if (isUpdate) {
        //   var data = checkUpdate(submissionRowsCopy, rsTuples);
        //   try {
        //     // check if there is a window that opened the current one
        //     // make sure the update function is defined for that window
        //     // verify whether we still have a valid vaue to call that function with
        //     if (window.opener && window.opener.updated && rsQueryParams.invalidate) {
        //       window.opener.updated(rsQueryParams.invalidate);
        //     }
        //   } catch (exp) {
        //     // if window.opener is from another origin, this will result in error on accessing any attribute in window.opener
        //     // And if it's from another origin, we don't need to call updated since it's not
        //     // the same row that we wanted to update in recordset (table directive)
        //   }
        // } else {
        //   if (!isModalUpdate) {
        //     $cookies.remove(rsQueryParams.prefill);


        //     // add cookie indicating record added
        //     if (rsQueryParams.invalidate) {
        //       $cookies.put(rsQueryParams.invalidate, submissionRowsCopy.length, {
        //         expires: new Date(Date.now() + (60 * 60 * 24 * 1000))
        //       });
        //     }
        //   }
        // }

        const page = response.successful;
        // const failedPage = response.failed;
        // const disabledPage = response.disabled;

        if (forms.length === 1) {
          let redirectUrl = '../';

          // Created a single entity or Updated one
          addAlert('Your data has been submitted. Redirecting you now to the record...', ChaiseAlertType.SUCCESS);
          // TODO can be replaced with page.reference.appLink.detailed
          redirectUrl += 'record/#' + page.reference.location.catalog + '/' + page.reference.location.compactPath;

          // append pcid
          const qCharacter = redirectUrl.indexOf('?') !== -1 ? '&' : '?';
          const contextHeaderParams = ConfigService.contextHeaderParams;
          // Redirect to record or recordset app..
          windowRef.location = redirectUrl + qCharacter + 'pcid=' + contextHeaderParams.cid + '&ppid=' + contextHeaderParams.pid;
        } else {
          // TODO: multi create view post create
        }
      }

      const submitErrorCB = (err: any) => {
        console.log(err);
        addAlert(err.message, (err instanceof windowRef.ERMrest.NoDataChangedError ? ChaiseAlertType.WARNING : ChaiseAlertType.ERROR));
      }

      if (appMode === appModes.EDIT) {
        const tempTuples = [...tuples];

        // TODO submissionRowsCopy for upload
        /**
         * After uploading files, the returned submissionRows contains
         * new file data. This includes filename, filebyte, and md5.
         * The following makes sure that all the data are updated.
         * That's why this for loop must be after uploading files and not before.
         * And we cannot just pass submissionRows to update function, because
         * update function only accepts array of tuples (and not just key-value pair).
         */
        for (let i = 0; i < submissionRows.length; i++) {
          const row = submissionRows[i];
          const data = tempTuples[i].data;
          // assign each value from the form to the data object on tuple
          for (const key in row) {
            data[key] = (row[key] === '' ? null : row[key]);
          }
        }

        reference.update(tuples).then(submitSuccessCB).catch(submitErrorCB);
      } else {
        reference.create(submissionRows).then(submitSuccessCB).catch(submitErrorCB);
      }
    });
  }

  // NOTE: most likely not needed
  const onSubmitInvalid = (data: any) => {
    console.log(data);

    const invalidMessage = 'Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.';
    addAlert(invalidMessage, ChaiseAlertType.ERROR);
  }

  const addForm = (count: number) => {
    const newFormIndexValues: number[] = [];
    // add 'count' number of forms
    setForms((forms: number[]) => {
      for (let i = 0; i < count; i++) {
        forms.push(forms[forms.length - 1] + 1);
        newFormIndexValues.push(forms.length - 1);
      }

      return [...forms]
    })

    // for each form added, push another '-1' into the array for each column
    setFormsHeightMap((formsHeightMap: any) => {
      const formsHeightMapCpy = simpleDeepCopy(formsHeightMap);
      for (let i = 0; i < count; i++) {
        Object.keys(formsHeightMapCpy).forEach(k => {
          formsHeightMapCpy[k].push(-1);
        });
      }
      return formsHeightMapCpy;
    });

    return newFormIndexValues;
  };

  // TODO: event type
  const removeForm = (indexes: number[]) => {
    // remove the forms based on the given indexes
    setForms(forms => forms.filter(({ }, i: number) => !indexes.includes(i)));

    // remove the entry at 'idx' in the array for each column
    setFormsHeightMap((formsHeightMap: any) => {
      const formsHeightMapCpy = simpleDeepCopy(formsHeightMap);
      Object.keys(formsHeightMapCpy).forEach(k => {
        formsHeightMapCpy[k] = formsHeightMapCpy[k].filter(({ }, i: number) => !indexes.includes(i));
      });
      return formsHeightMapCpy;
    });
  }

  const updateKeysHeightMap = (colName: string, height: number) => {
    setKeysHeightMap((keysHeightMap: any) => {
      const hMapCopy = simpleDeepCopy(keysHeightMap);
      hMapCopy[colName] = height;
      return hMapCopy;
    })
  }

  const updateFormsHeightMap = (colName: string, idx: string, height: string | number) => {
    setFormsHeightMap((formsHeightMap: any) => {
      const hMapCpy = simpleDeepCopy(formsHeightMap);
      hMapCpy[colName][idx] = height;

      updateKeysHeightMap(colName, Math.max(...hMapCpy[colName]));

      return hMapCpy;
    });
  }

  const handleInputHeightAdjustment = (fieldName: string, msgCleared: boolean, fieldType: string) => {

    const ele: HTMLElement | null = document.querySelector(`.input-switch-container-${fieldName}`);
    const height = ele?.offsetHeight || 0;
    // how to handle this ? get default heights

    const defaultHeight = DEFAULT_HEGHT_MAP[fieldType];
    const newHeight = height == defaultHeight || msgCleared ? -1 : height;

    // execute the regexp to get individual values from the inputFieldName
    const r = /(\d*)-(.*)/;
    const result = r.exec(fieldName) || [];
    const idx = result[1];
    const colName = result[2];

    updateFormsHeightMap(colName, idx, newHeight);
  }

  const getInitialFormValues = (forms: number[], columnModels: RecordeditColumnModel[]) => {
    let initialModel: any = { values: {} };
    if (appMode === appModes.CREATE) {
      // NOTE: should only be 1 form for create...
      initialModel = populateCreateInitialValues(columnModels, forms);

    } else if (appMode === appModes.EDIT || appMode === appModes.COPY) {
      const tempTuples: any[] = [];
      for (let i = 0; i < page.tuples.length; i++) {
        // We don't want to mutate the actual tuples associated with the page returned from `reference.read`
        // The submission data is copied back to the tuples object before submitted in the PUT request
        const shallowTuple = page.tuples[i].copy();
        tempTuples.push(shallowTuple);
      }

      initialModel = populateEditInitialValues(columnModels, reference.columns, page.tuples, appMode === appModes.COPY);

      setTuples([...tempTuples]);
    }

    return initialModel.values;
  };


  // ---------------- log related function --------------------------- //

  // const logRecordClientAction = (action: LogActions, childStackElement?: any, extraInfo?: any, ref?: any) => {
  //   const usedRef = ref ? ref : reference;
  //   LogService.logClientAction({
  //     action: flowControl.current.getLogAction(action),
  //     stack: flowControl.current.getLogStack(childStackElement, extraInfo)
  //   }, usedRef.defaultLogInfo)
  // };

  // const getRecordLogAction = (actionPath: LogActions, childStackPath?: any) => {
  //   return flowControl.current.getLogAction(actionPath, childStackPath);
  // }

  // const getRecordLogStack = (childStackElement?: any, extraInfo?: any) => {
  //   return flowControl.current.getLogStack(childStackElement, extraInfo);
  // }

  const providerValue = useMemo(() => {
    return {
      // main entity:
      appMode,
      reference,
      page,
      tuples,
      columnModels,
      initialized,

      // form
      forms,
      addForm,
      removeForm,
      keysHeightMap,
      updateKeysHeightMap,
      formsHeightMap,
      handleInputHeightAdjustment,
      getInitialFormValues,

      //   // log related:
      //   logRecordClientAction,
      //   getRecordLogAction,
      //   getRecordLogStack,
      onSubmitValid,
      onSubmitInvalid,
      MAX_ROWS_TO_ADD: maxRowsToAdd
    };
  }, [
    // main entity:
    reference, page, tuples, columnModels, initialized,
    forms, keysHeightMap, formsHeightMap
  ]);

  return (
    <RecordeditContext.Provider value={providerValue}>
      {children}
    </RecordeditContext.Provider>
  )
}
