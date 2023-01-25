// hooks
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import { appModes, PrefillObject, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { CookieService } from '@isrd-isi-edu/chaise/src/services/cookie';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilities
import { getDisplaynameInnerText, simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { QUERY_PARAMS, RESULT_INFO_VALUES, URL_PATH_LENGTH_LIMIT } from '@isrd-isi-edu/chaise/src/utils/constants'
import {
  allForeignKeyColumnsPrefilled,
  columnToColumnModel, getColumnModelLogAction, getColumnModelLogStack, getPrefillObject,
  populateCreateInitialValues, populateEditInitialValues, populateSubmissionRow
} from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { DEFAULT_HEGHT_MAP } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { addQueryParamsToURL, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

type ResultsetProps = {
  success: { page: any, header: string, appLink?: string }
  disabled?: { page: any, header: string },
  failed?: { page: any, header: string, appLink?: string }
}

export const RecordeditContext = createContext<{
  /* which mode of recordedit we are in */
  appMode: string,
  /* the main entity reference */
  reference: any,
  /* the main page from reading the reference */
  page: any,
  /* the tuples correspondeing to the displayed form */
  tuples: any,
  /**
   * the raw data of outbound foreign keys. used in foreignkey-field to support domain-filter
   * it's a key-value object and follows the same format as the form values.
   * the key is in the format of `${formNumber}-{colName}` and value is an object.
   */
  foreignKeyData: any,
  waitingForForeignKeyData: boolean,
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
  getPrefilledDefaultForeignKeyData: (initialValues: any, setValue: any) => void,
  /* callback for react-hook-form to call when forms are valid */
  onSubmitValid: (data: any) => void,
  /* callback for react-hook-form to call when forms are NOT valid */
  onSubmitInvalid: (data: any) => void,
  /**
   * whether we should show the spinner indicating submitting data or not
   */
  showSubmitSpinner: boolean,
  resultsetProps?: ResultsetProps,
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
  const [columnModels, setColumnModels] = useState<RecordeditColumnModel[]>([]);

  const [waitingForForeignKeyData, setWaitingForForeignKeyData] = useState<boolean>(false);

  const [initialized, setInitialized, initializedRef] = useStateRef(false);

  const [showSubmitSpinner, setShowSubmitSpinner] = useState(false);
  const [resultsetProps, setResultsetProps] = useState<ResultsetProps | undefined>();

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

  /**
   * NOTE the current assumption is that foreignKeyData is used only in
   * foreignkey-field.tsx for domain-filter support.
   *
   * We're currently setting this to true, if:
   *  - there's a prefill query and we need to fetch the prefilled data.
   *  - some foreignkeys have default values and we need to see if the default is accurate.
   */
  const foreignKeyData = useRef<any>({});
  const shouldFetchForeignKeyData = useRef<boolean>(false);
  const pendingForeignKeyRequests = useRef<number>(0);

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);

  useEffect(() => {
    if (!reference || setupStarted.current) return;
    setupStarted.current = true;

    const tempColumnModels: RecordeditColumnModel[] = [];
    reference.columns.forEach((column: any) => {
      const cm = columnToColumnModel(column, queryParams);
      tempColumnModels.push(cm);
    })
    setColumnModels([...tempColumnModels]);

    // generate initial forms hmap
    const tempKeysHMap: any = {};
    const tempFormsHMap: any = {};
    tempColumnModels.forEach((cm: any) => {
      const colname = cm.column.name;
      tempKeysHMap[colname] = -1;
      tempFormsHMap[colname] = [-1];
    });

    setKeysHeightMap(tempKeysHMap);
    setFormsHeightMap(tempFormsHMap);

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

          // TODO this should not be done when we want to have recordedit in modal
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
        // TODO this should not be done when we want to have recordedit in modal
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

  }, [reference]);

  /**
   * Show an alert if user is attempting to leave without saving
   */
  const canLeaveRecordedit = useRef(false);
  useEffect(() => {
    const avoidLeave = (e: any) => {
      if (canLeaveRecordedit.current || ConfigService.chaiseConfig.hideRecordeditLeaveAlert === true) {
        return undefined;
      }
      e.returnValue = 'Do you want to leave this page? Changes you have made will not be saved.';
    }
    window.addEventListener('beforeunload', avoidLeave);
    return () => {
      window.removeEventListener('beforeunload', avoidLeave);
    };
  }, []);

  const onSubmitValid = (data: any) => {
    const submissionRows: any[] = []
    // f is the number in forms array that is
    forms.forEach((f: number) => {
      submissionRows.push(populateSubmissionRow(reference, f, data));
    });

    validateSessionBeforeMutation(() => {
      setShowSubmitSpinner(true);

      const submitSuccessCB = (response: any) => {
        // make sure the leave alert is disabled
        canLeaveRecordedit.current = true;

        // communicate with the caller page that the request is done
        if (appMode === appModes.EDIT) {
          // TODO should most probably be added when we implement assets
          // const data = checkUpdate(submissionRowsCopy, rsTuples);
          try {
            // check if there is a window that opened the current one
            // make sure the update function is defined for that window
            // verify whether we still have a valid vaue to call that function with
            if (window.opener && window.opener.updated && queryParams.invalidate) {
              window.opener.updated(queryParams.invalidate);
            }
          } catch (exp) {
            // if window.opener is from another origin, this will result in error on accessing any attribute in window.opener
            // And if it's from another origin, we don't need to call updated since it's not
            // the same row that we wanted to update in recordset (table directive)
          }
        } else {
          // cleanup the prefill query parameter
          if (queryParams.prefill) {
            CookieService.deleteCookie(queryParams.prefill);
          }

          // add cookie indicating record successfully added
          if (queryParams.invalidate) {
            // the value of the cookie is not important as other apps are just looking for the cookie name
            CookieService.setCookie(queryParams.invalidate, '1', new Date(Date.now() + (60 * 60 * 24 * 1000)));
          }
        }

        const page = response.successful;
        const failedPage = response.failed;
        const disabledPage = response.disabled;
        const qParam: any = {};
        qParam[QUERY_PARAMS.RESULT_INFO] = appMode === appModes.EDIT ? RESULT_INFO_VALUES.EDIT : RESULT_INFO_VALUES.CREATE;

        // redirect to record app
        if (forms.length === 1) {
          // Created a single entity or Updated one
          addAlert('Your data has been saved. Redirecting you now to the record...', ChaiseAlertType.SUCCESS);

          windowRef.location = addQueryParamsToURL(page.reference.contextualize.detailed.appLink, qParam);
        }
        // see if we can just redirect, or if we need the resultset view.
        else {
          const compactRef = page.reference.contextualize.compact;
          const canLinkToRecordset = compactRef.readPath.length <= URL_PATH_LENGTH_LIMIT;

          // redirect to recordset app
          if (!failedPage && !disabledPage && canLinkToRecordset) {
            const verb = appMode === appModes.EDIT ? 'updated' : 'created';
            addAlert(`Your data has been saved. Redirecting you now to the ${verb} records...`, ChaiseAlertType.SUCCESS);

            windowRef.location = addQueryParamsToURL(compactRef.appLink, qParam);
          } else {
            const noun = appMode === appModes.EDIT ? 'update' : 'creation';
            const handlePlural = (p: any) => (p.length > 1 ? 's' : '');

            // resultset view
            setResultsetProps({
              success: {
                page,
                header: `${page.length} successful ${noun}${handlePlural(page)}`,
                ... (canLinkToRecordset && { appLink: compactRef.appLink })
              },
              ... (failedPage && {
                failed: {
                  page: failedPage,
                  header: `${failedPage.length} failed ${noun}${handlePlural(failedPage)}`
                },
              }),
              ... (disabledPage && {
                failed: {
                  page: disabledPage,
                  header: `${disabledPage.length} disabled record${handlePlural(disabledPage)} (due to lack of permission)`
                },
              }),
            });
          }
        }
      };

      const submitErrorCB = (err: any) => {
        console.log(err);
        addAlert(err.message, (err instanceof windowRef.ERMrest.NoDataChangedError ? ChaiseAlertType.WARNING : ChaiseAlertType.ERROR));
      };

      const submitFinallyCB = () => {
        setShowSubmitSpinner(false);
      };

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

        reference.update(tempTuples).then(submitSuccessCB).catch(submitErrorCB).finally(submitFinallyCB);
      } else {
        reference.create(submissionRows).then(submitSuccessCB).catch(submitErrorCB).finally(submitFinallyCB);
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
    const newFormValues: number[] = [];
    // add 'count' number of forms
    setForms((previous: number[]) => {
      const res = [...previous];
      for (let i = 0; i < count; i++) {
        // last value in 'forms' incremented by 1
        const formValue = res[res.length - 1] + 1;
        res.push(formValue);
        newFormValues.push(formValue);
      }

      return [...res];
    })

    // for each form added, push another '-1' into the array for each column
    setFormsHeightMap((previous: any) => {
      const formsHeightMapCpy = simpleDeepCopy(previous);
      for (let i = 0; i < count; i++) {
        Object.keys(formsHeightMapCpy).forEach(k => {
          formsHeightMapCpy[k].push(-1);
        });
      }
      return formsHeightMapCpy;
    });

    return newFormValues;
  };

  const removeForm = (indexes: number[]) => {
    // remove the forms based on the given indexes
    setForms((previous: number[]) => previous.filter(({ }, i: number) => !indexes.includes(i)));

    // remove the entry at 'idx' in the array for each column
    setFormsHeightMap((previous: any) => {
      const formsHeightMapCpy = simpleDeepCopy(previous);
      Object.keys(formsHeightMapCpy).forEach(k => {
        formsHeightMapCpy[k] = formsHeightMapCpy[k].filter(({ }, i: number) => !indexes.includes(i));
      });
      return formsHeightMapCpy;
    });

    setTuples((previous: any[]) => previous.filter(({ }, i: number) => !indexes.includes(i)));

    // TODO: should this cleanup the form data?
    //   if reading the data for submission is done based on formValue (instead of index) this shouldn't matter
  }

  const updateKeysHeightMap = (colName: string, height: number) => {
    setKeysHeightMap((previous: any) => {
      const hMapCopy = simpleDeepCopy(previous);
      hMapCopy[colName] = height;
      return hMapCopy;
    })
  }

  const updateFormsHeightMap = (colName: string, idx: string, height: string | number) => {
    setFormsHeightMap((previous: any) => {
      const hMapCpy = simpleDeepCopy(previous);
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
      initialModel = populateCreateInitialValues(columnModels, forms, queryParams);

        setWaitingForForeignKeyData(initialModel.shouldWaitForForeignKeyData);
        shouldFetchForeignKeyData.current = initialModel.shouldWaitForForeignKeyData;

    } else if (appMode === appModes.EDIT || appMode === appModes.COPY) {
      const tempTuples: any[] = [];
      for (let i = 0; i < page.tuples.length; i++) {
        // We don't want to mutate the actual tuples associated with the page returned from `reference.read`
        // The submission data is copied back to the tuples object before submitted in the PUT request
        const shallowTuple = page.tuples[i].copy();
        tempTuples.push(shallowTuple);
      }

      // using page.tuples here instead of forms
      initialModel = populateEditInitialValues(columnModels, forms, reference.columns, page.tuples, appMode === appModes.COPY);

      setTuples([...tempTuples]);
    }

    foreignKeyData.current = initialModel.foreignKeyData;

    return initialModel.values;
  };

  /**
   * send requests to fetch foreign key data.
   * This is used in create mode so we can fetch the data for foreignkeys that
   * have default or prefilled values.
   * So we can,
   *  - fetch rowname which is displayed to the users.
   *  - populate foreignKeyData ref which is used by domain-filter logic.
   *
   * @param initialValues
   * @param setValue
   */
  const getPrefilledDefaultForeignKeyData = (initialValues: any, setValue: any) => {
    if (!shouldFetchForeignKeyData.current) {
      // if we don't need to fetch the data, then don't.
      return;
    }

    const prefillObj = getPrefillObject(queryParams);

    // NOTE since this is create mode and we're disabling the addForm,
    // we can assume this is the first form
    const formValue = 1;

    if (prefillObj) {
      pendingForeignKeyRequests.current += 1;
      processPrefilledForeignKeys(formValue, prefillObj, setValue);
    }

    // we need to know the number of requests (for spinner), so we have to capture them
    // first before sending the requests.
    type FkRequest = {reference: any, logAction: string, index: number};
    const fkRequests : FkRequest[] = [];

    columnModels.forEach((colModel: RecordeditColumnModel, index: number) => {
      const column = colModel.column;
      if (!column.isForeignKey) return;

      // if it's a prefilled foreignkey, the value is going to be set by processPrefilledForeignKeys
      if (prefillObj && prefillObj.fkColumnNames.indexOf(column.name) !== -1) {
        return;
      }

      // TODO assuming this is the first form!
      const defaultValue = initialValues[`1-${column.name}`];

      // if all the columns of the foreignkey are prefilled, use that instead of default
      if (prefillObj && allForeignKeyColumnsPrefilled(column, prefillObj)) {
        const defaultDisplay = column.getDefaultDisplay(prefillObj.keys);

        // if the data is missing, ermrestjs will return null
        // although the previous allPrefilled should already guard against this.
        if (!defaultDisplay.reference) return;

        // get the actual foreign key data
        // TODO should be modified if recordedit is used in a modal (parent log related params)
        fkRequests.push({
          index,
          reference: defaultDisplay.reference,
          logAction: LogActions.FOREIGN_KEY_PRESELECT
        });

      } else if (defaultValue !== null && defaultValue !== '') {

        // get the actual foreign key data
        // TODO should be modified if recordedit is used in a modal (parent log related params)
        fkRequests.push({
          index,
          reference: column.defaultReference,
          logAction: LogActions.FOREIGN_KEY_DEFAULT
        });
      }

    });

    // capture the number of generated requests
    pendingForeignKeyRequests.current += fkRequests.length;

    // send the requests after finding how many there are
    fkRequests.forEach((req: FkRequest) => {
      fetchForeignKeyData(formValue, [columnModels[req.index].column.name], req.reference, {
        action: getColumnModelLogAction(
          LogActions.FOREIGN_KEY_DEFAULT,
          columnModels[req.index],
          null
        ),
        stack: getColumnModelLogStack(columnModels[req.index], null)
      }, setValue);
    })

  }

  /**
 * In case of prefill and default we only have a reference to the foreignkey,
 * we should do extra reads to get the actual data.
 *
 * NOTE for default we don't want to send the raw data to the ermrestjs request,
 * that's why after fetching the data we're only changing the displayed rowname
 * and the foreignKeyData, not the raw values sent to ermrestjs.
 * @param formValue which form it is
 * @param colNames the column names that will use this data
 * @param fkRef the foreignkey reference that should be used for fetching data
 * @param logObject
 */
  function fetchForeignKeyData(formValue: number, colNames: string[], fkRef: any, logObject: any, setValue: any) {

    // we should get the fk data since it might be used for rowname
    fkRef.contextualize.compactSelectForeignKey.read(1, logObject, false, true).then((page: any) => {
      colNames.forEach(function (colName) {
        // we should not set the raw default values since we want ermrest to handle those for us.
        // so we're just setting the displayed rowname to users
        // and also the foreignkeyData used for the domain-filter logic.

        // default value is validated
        if (page.tuples.length > 0) {
          foreignKeyData.current[`${formValue}-${colName}`] = page.tuples[0].data;
          setValue(`${formValue}-${colName}`, page.tuples[0].displayname.value);
        } else {
          foreignKeyData.current[`${formValue}-${colName}`] = {};
          setValue(`${formValue}-${colName}`, '');
        }
      });
    }).catch(function (err: any) {
      $log.warn(err);
    }).finally(() => {
      pendingForeignKeyRequests.current--;

      if (pendingForeignKeyRequests.current === 0) {
        setWaitingForForeignKeyData(false);
      }

    })

  }

  /**
   * - Attach the values for foreignkeys and columns that are prefilled.
   * - Read the actual parent row in order to attach the foreignkeyData
   * @param  {Object} model           the model object that we attach rows and other value to (recordEditModel)
   * @param  {string[]} fkColumnNames An array of the name of foreign key columns
   * @param  {Object} keys            key-value pair of raw values
   * @param  {string} origUrl         the parent url that should be resolved to get the complete row of data
   * @param  {Object} rowname         the default rowname that should be displayed
   */
  function processPrefilledForeignKeys(formValue: number, prefillObj: PrefillObject, setValue: any) {
    // update the displayed value
    prefillObj.fkColumnNames.forEach(function (cn: string) {
      setValue(`${formValue}-${cn}`, prefillObj.rowname.value);
    });

    // update the raw data that will be sent to ermrsetjs
    Object.keys(prefillObj.keys).forEach((k: string) => {
      setValue(`${formValue}-${k}`, prefillObj.keys[k]);
    });

    // get the actual foreignkey data
    ConfigService.ERMrest.resolve(prefillObj.origUrl, ConfigService.contextHeaderParams).then((ref: any) => {

      // get the first foreignkey relationship between the ref.table and current table
      // and log it as the foreignkey that we are prefilling (eventhough we're prefilling multiple fks)
      const fks = reference.table.foreignKeys.all();
      let source = {};
      for (let i = 0; i < fks.length; i++) {
        if (prefillObj.fkColumnNames.indexOf(fks[i].name) !== -1) {
          source = fks[i].compressedDataSource;
          break;
        }
      }

      // create proper logObject
      const stackNode = LogService.getStackNode(
        LogStackTypes.FOREIGN_KEY,
        ref.table,
        { source: source, entity: true }
      );
      // TODO current path and stack should be passed if recordedit will be used in modal
      const logStackPath = LogService.getStackPath(null, LogStackPaths.FOREIGN_KEY);
      const logObj = {
        action: LogService.getActionString(LogActions.FOREIGN_KEY_PRESELECT, logStackPath),
        stack: LogService.getStackObject(stackNode, null)
      }

      fetchForeignKeyData(formValue, prefillObj.fkColumnNames, ref, logObj, setValue);
    }).catch(function (err: any) {
      $log.warn(err);
    });
  }



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
      foreignKeyData,
      columnModels,
      initialized,
      waitingForForeignKeyData,

      // form
      forms,
      addForm,
      removeForm,
      keysHeightMap,
      updateKeysHeightMap,
      formsHeightMap,
      handleInputHeightAdjustment,
      getInitialFormValues,
      getPrefilledDefaultForeignKeyData,


      //   // log related:
      //   logRecordClientAction,
      //   getRecordLogAction,
      //   getRecordLogStack,
      onSubmitValid,
      onSubmitInvalid,
      showSubmitSpinner,
      resultsetProps,
      MAX_ROWS_TO_ADD: maxRowsToAdd
    };
  }, [
    // main entity:
    reference, page, tuples, columnModels, initialized, waitingForForeignKeyData,
    showSubmitSpinner, resultsetProps,
    forms, keysHeightMap, formsHeightMap,
  ]);

  return (
    <RecordeditContext.Provider value={providerValue}>
      {children}
    </RecordeditContext.Provider>
  )
}
