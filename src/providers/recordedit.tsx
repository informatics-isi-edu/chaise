// hooks
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import {
  appModes, LastChunkMap, PrefillObject, RecordeditAppState, RecordeditColumnModel,
  RecordeditConfig, RecordeditDisplayMode, RecordeditForeignkeyCallbacks,
  RecordeditModalOptions, UploadProgressProps
} from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';
import { SelectedRow } from '@isrd-isi-edu/chaise/src/models/recordset';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { CookieService } from '@isrd-isi-edu/chaise/src/services/cookie';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import RecordeditFlowControl from '@isrd-isi-edu/chaise/src/services/recordedit-flow-control';

// utilities
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { URL_PATH_LENGTH_LIMIT } from '@isrd-isi-edu/chaise/src/utils/constants'
import {
  allForeignKeyColumnsPrefilled,
  columnToColumnModel, getPrefillObject,
  populateCreateInitialValues, populateEditInitialValues, populateSubmissionRow
} from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { isObjectAndKeyDefined, isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

type ResultsetProps = {
  pageTitle: string,
  success: { page: any, header: string, exploreLink?: string, editLink?: string },
  failed?: { page: any, header: string, exploreLink?: string }
}

export const RecordeditContext = createContext<{
  /* which mode of recordedit we are in */
  appMode: string,
  appState: RecordeditAppState,
  setAppState: any,
  config: RecordeditConfig,
  modalOptions?: RecordeditModalOptions,
  queryParams: any,
  prefillRowData?: any[],
  /* the main entity reference */
  reference: any,
  /* the tuples correspondeing to the displayed form */
  tuples: any,
  /**
   * the raw data of outbound foreign keys. used in foreignkey-field to support domain-filter
   * it's a key-value object and follows the same format as the form values.
   * the key is in the format of `c_${formNumber}-{col.RID}` and value is an object.
   */
  foreignKeyData: any,
  waitingForForeignKeyData: boolean,
  /* the created column models from reference.columns */
  columnModels: RecordeditColumnModel[],
  /* whether a value can be updated or not (key-value pair where key is the same structure as form values ) */
  canUpdateValues: { [key: string]: boolean };
  /** precomputed column permission error that should be displayed to the users */
  columnPermissionErrors: { [columnName: string]: string };
  /* Whether the data for the main entity is fetched and the model is initialized  */
  initialized: boolean,
  /* Array of numbers for initalizing form data */
  forms: number[],
  /* callback to add form(s) to the forms array */
  addForm: (count: number) => number[],
  /* callback to remove from(s) from the forms array */
  removeForm: (indexes: number[], formValues: any, skipLogging?: boolean) => void,
  /* returns the initial values for all forms to display */
  getInitialFormValues: (forms: number[], columnModels: RecordeditColumnModel[]) => any,
  /* initiate the process of handling prefilled and default foreignkeys (in create mode) */
  getPrefilledDefaultForeignKeyData: (initialValues: any, setValue: any) => void,
  /* callback for react-hook-form to call when forms are valid */
  onSubmitValid: (data: any) => void,
  /* callback for react-hook-form to call when forms are NOT valid */
  onSubmitInvalid: (errors: any, e?: any) => void,
  /**
   * whether we should show the spinner indicating cloning form data
   */
  showCloneSpinner: boolean,
  setShowCloneSpinner: (val: boolean) => void,
  /**
   * whether we should show the spinner indicating cloning form data
   */
  showApplyAllSpinner: boolean,
  setShowApplyAllSpinner: (val: boolean) => void,
  /**
   * whether we should show the spinner indicating submitting data or not
   */
  showSubmitSpinner: boolean,
  resultsetProps?: ResultsetProps,
  uploadProgressModalProps?: UploadProgressProps,
  /* for updating the last contiguous chunk tracking info */
  setLastContiguousChunk: (arg0: any) => void,
  /* useRef react hook to current value */
  lastContiguousChunkRef: any,
  /* max rows allowed to add constant */
  MAX_ROWS_TO_ADD: number,
  prefillAssociationFkLeafColumn: any,
  setPrefillAssociationFkLeafColumn: (val: any) => void,
  prefillAssociationFkMainColumn: any,
  setPrefillAssociationFkMainColumn: (val: any) => void,
  prefillAssociationSelectedRows: SelectedRow[],
  setPrefillAssociationSelectedRows: (val: SelectedRow[]) => void,
  updateAssociationSelectedRows: (oldValues: any, newRow?: SelectedRow) => void,
  /**
   * log client actions
   * Notes:
   *   - the optional `ref` parameter can be used to log based on a different reference object
   */
  logRecordeditClientAction: (actionPath: LogActions, childStackPath?: any, childStackElement?: any, extraInfo?: any, ref?: any) => void,
  /**
   * get the appropriate log action.
   * if called with `true` argument, it will return the stack path.
   */
  getRecordeditLogAction: (actionPath: LogActions | true, childStackPath?: any) => string,
  /**
   * get the appropriate log stack
   */
  getRecordeditLogStack: (childStackElement?: any, extraInfo?: any) => any,
  /**
   * customize the foreignkey callbacks
   */
  foreignKeyCallbacks?: RecordeditForeignkeyCallbacks
} | null>(null);

type RecordeditProviderProps = {
  /**
   * the mode of the app
   */
  appMode: string;
  /**
   * the config object
   */
  config: RecordeditConfig;
  /**
   * parameters for the modal
   */
  modalOptions?: RecordeditModalOptions;
  /**
   * modify submission rows prior to submission
   */
  modifySubmissionRows?: (submissionRows: any[]) => void
  /**
   * called when form was submitted successfuly
   */
  onSubmitSuccess?: (response: { successful: any, failed: any, disabled: any }) => void,
  /**
   * called when form submission (create/update request) errored out
   * return true from this function if you want recordedit to show the alert.
   */
  onSubmitError?: (exception: any) => boolean,
  /**
   * initial data that you want to be displayed (only honored in create mode)
   */
  prefillRowData?: any[];
  /**
   * the tuples that we want to edit (only honored in edit mode)
   */
  initialTuples?: any[],
  /**
   * name of the columns that should be hidden
   * TODO only honored by viewer-annotation-form-container for now
   * but form-container should also honor it
   */
  hiddenColumns?: string[];
  /**
   * customize the foreignkey callbacks
   */
  foreignKeyCallbacks?: RecordeditForeignkeyCallbacks,
  /**
   * the query parameters that the page might have
   */
  queryParams: any;
  /**
   * main reference of the form
   */
  reference: any;
  /**
   * log related properties
   */
  logInfo: {
    logAppMode: string;
    logObject?: any;
    logStack: any;
    logStackPath: string;
  },
  /**
   * the element that renderes the form
   */
  children: JSX.Element;
};

export default function RecordeditProvider({
  appMode,
  children,
  config,
  logInfo,
  modalOptions,
  onSubmitSuccess,
  onSubmitError,
  prefillRowData,
  initialTuples,
  queryParams,
  reference,
  hiddenColumns,
  foreignKeyCallbacks,
  modifySubmissionRows
}: RecordeditProviderProps): JSX.Element {

  const { addAlert, removeAllAlerts } = useAlert();
  const { session, validateSessionBeforeMutation, validateSession } = useAuthn();
  const { dispatchError, errors, loginModal } = useError();

  const maxRowsToAdd = 201;

  const [columnModels, setColumnModels] = useState<RecordeditColumnModel[]>([]);
  const [canUpdateValues, setCanUpdateValues] = useState<any>({});
  const [columnPermissionErrors, setColumnPermissionErrors] = useState<any>({});

  const [waitingForForeignKeyData, setWaitingForForeignKeyData] = useState<boolean>(false);

  const [initialized, setInitialized, initializedRef] = useStateRef(false);

  // the current view that the recordedit app is showing: association picker, form input, or resultset
  const [appState, setAppState] = useState<RecordeditAppState>(RecordeditAppState.FORM_INPUT);

  const [showCloneSpinner, setShowCloneSpinner] = useState(false);
  const [showApplyAllSpinner, setShowApplyAllSpinner] = useState(false);
  const [showSubmitSpinner, setShowSubmitSpinner] = useState(false);
  const [resultsetProps, setResultsetProps] = useState<ResultsetProps | undefined>();
  const [uploadProgressModalProps, setUploadProgressModalProps] = useState<UploadProgressProps | undefined>();
  /*
   * Object for keeping track of each file and their existing upload jobs so we can resume on interruption
   * 
   * For example, we have the following 3 scenarios:
   *   1. contiguous offset: 1; chunks in flight with index 2, 3; chunk completed with index 4 (after chunk at index 4 is acknowledged w/ 204)
   *     - [0, 1, empty, empty, 4]
   *   2. contiguous offset: 1; chunks in flight with index 2; chunks completed with index 3, 4 (after chunk at index 3 is acknowledged w/ 204)
   *     - [0, 1, empty, 3, 4]
   *   3. contiguous offset: 4; (after chunk at index 2 is acknowledged w/ 204)
   *     - [0, 1, 2, 3, 4]
   * 
   * Object structure is as follows where index is the index of the last contiguous chunk that was uploaded.
   * {
   *   `${file.md5_base64}_${column_name}_${record_index}`: {
   *     lastChunkIdx: index
   *     jobUrl: uploadJob.hash ( in the form of '/hatrac/path/to/file.png;upload/somehash')
   *     fileSize: size_in_bytes,
   *     uploadVersion: versioned_url ( in the form of '/hatrac/path/to/file.png:version')
   *   }
   * }
   */
  const [lastContiguousChunk, setLastContiguousChunk, lastContiguousChunkRef] = useStateRef<LastChunkMap | null>(null);

  const [tuples, setTuples, tuplesRef] = useStateRef<any[]>(Array.isArray(initialTuples) ? initialTuples : []);

  // an array of unique keys to for referencing each form
  const [forms, setForms] = useState<number[]>([1]);

  // array of selected rows for association picker. when forms are removed this needs to be updated
  const [prefillAssociationSelectedRows, setPrefillAssociationSelectedRows] = useState<SelectedRow[]>([]);
  const [prefillAssociationFkLeafColumn, setPrefillAssociationFkLeafColumn] = useState<any>(null);
  const [prefillAssociationFkMainColumn, setPrefillAssociationFkMainColumn] = useState<any>(null);

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
  const flowControl = useRef(new RecordeditFlowControl(queryParams));

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);

  useEffect(() => {
    if (!reference || setupStarted.current) return;
    setupStarted.current = true;

    const tempColumnModels: RecordeditColumnModel[] = [];
    reference.columns.forEach((column: any) => {
      const isHidden = Array.isArray(hiddenColumns) && hiddenColumns.indexOf(column.name) !== -1;
      const cm = columnToColumnModel(column, isHidden, queryParams);
      tempColumnModels.push(cm);
    })
    setColumnModels([...tempColumnModels]);

    const ERMrest = ConfigService.ERMrest;
    if (appMode === appModes.EDIT || appMode === appModes.COPY) {
      if (reference.canUpdate) {
        if (tuplesRef.current && tuplesRef.current.length > 0) {
          // it's already initialized (because of initialTuples)
          setInitialized(true);
          return;
        }

        let numberRowsToRead = maxRowsToAdd;
        if (queryParams.limit) {
          numberRowsToRead = Number(queryParams.limit);
          if (numberRowsToRead > maxRowsToAdd) {
            let limitMessage = `Trying to edit ${numberRowsToRead} records. A maximum of ${maxRowsToAdd} records can be edited at once. `;
            limitMessage += `Showing the first ${maxRowsToAdd} records.`;
            addAlert(limitMessage, ChaiseAlertType.ERROR);
          }
        }

        const logParams = {
          action: getRecordeditLogAction(LogActions.LOAD),
          stack: getRecordeditLogStack()
        };

        // in edit mode, we have to check the TCRS (row-level acls)
        const getTCRS = appMode === appModes.EDIT;
        reference.read(numberRowsToRead, logParams, false, false, false, getTCRS).then((readPage: any) => {
          if (readPage.tuples.length < 1) {
            // TODO: understand the filter that was used and relate that information to the user (it oucld be a facet filter now)
            const recordSetLink = readPage.reference.unfilteredReference.contextualize.compact.appLink;
            dispatchError({ error: new NoRecordError({}, readPage.reference.displayname.value, recordSetLink) });
          }

          // capture the tuples
          const usedTuples: any[] = [];
          const forbiddenTuples: any[] = [];
          readPage.tuples.forEach((t: any) => {
            if (appMode === appModes.EDIT && !t.canUpdate) {
              forbiddenTuples.push(t);
              return;
            }
            // We don't want to mutate the actual tuples associated with the page returned from `reference.read`
            // The submission data is copied back to the tuples object before submitted in the PUT request
            usedTuples.push(t.copy());
          });
          setTuples([...usedTuples]);

          // update head title
          // TODO this should not be done when we want to have recordedit in modal
          // send string to prepend to "headTitle"
          // For editing ==1 record - "Edit <table>: <rowname>"
          // For editing >1 record  - "Edit <table>"
          // For copy >=1 record    - "Create new <table>"
          let headTitle;
          if (appMode === appModes.EDIT) {
            headTitle = 'Edit ' + getDisplaynameInnerText(reference.displayname);
            if (usedTuples.length === 1) headTitle += ': ' + getDisplaynameInnerText(usedTuples[0].displayname);
          } else {
            headTitle = 'Create new ' + getDisplaynameInnerText(reference.displayname);
          }
          if (config.displayMode === RecordeditDisplayMode.FULLSCREEN) {
            updateHeadTitle(headTitle);
          }

          // if all the rows are disabled, throw an error without marking the recordedit as initialized
          if (usedTuples.length === 0) {
            const errMessage = MESSAGE_MAP.unauthorizedMessage + MESSAGE_MAP.reportErrorToAdmin;
            const forbiddenError = new ERMrest.ForbiddenError(MESSAGE_MAP.unauthorizedErrorCode, errMessage);
            // NOTE there might be different reasons for this (column vs row)
            // should we list all of them?
            forbiddenError.subMessage = forbiddenTuples[0].canUpdateReason;
            dispatchError({ error: forbiddenError });
            return;
          }

          if (forbiddenTuples.length > 0) {
            const msg = `${forbiddenTuples.length}/${readPage.tuples.length} entries were removed from editing due to the lack of permission.`;
            addAlert(msg, ChaiseAlertType.WARNING);
          }

          // add more forms if we need to
          if (usedTuples.length > 1) {
            addForm(usedTuples.length - 1);
          }

          // mark recordedit as initialized
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
        if (config.displayMode === RecordeditDisplayMode.FULLSCREEN) {
          updateHeadTitle('Create new ' + reference.displayname.value);
        }

        // TODO: remove this and appState..?
        const prefillObject = getPrefillObject(queryParams);
        // used to trigger recordset select view
        if (prefillObject?.hasUniqueAssociation) setAppState(RecordeditAppState.ASSOCIATION_PICKER);

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
   * if because of column-level acls, columns of one of the rows cannot be
   * updated, we cannot update any other rows. so we should precompute this
   * and attach the error so we can show it later to the users.
   * This will take care of populating on load as well as when forms are removed.
   */
  useEffect(() => {
    if (appMode !== appModes.EDIT || tuples.length === 0 || !canUpdateValues) return;

    // update the column permission errors when forms are changed removed
    const res: { [columnName: string]: string } = {};
    forms.forEach(({ }, formIndex) => {
      columnModels.forEach((cm, i) => {
        // assumption is that isDisabled is not based on per column ACLs
        if (cm.isDisabled) return;

        const tuple = tuples[formIndex];
        if (tuple.canUpdate && !tuple.canUpdateValues[i] && !res[cm.column.name]) {
          let errMessage = 'This field cannot be modified. ';
          errMessage += `To modify it, remove all records that have this field disabled (e.g. Record Number ${formIndex + 1})`;
          res[cm.column.name] = errMessage;
        }
      });
    });
    setColumnPermissionErrors(res);
  }, [forms, tuples]);

  /**
   * Show an alert if user is attempting to leave without saving
   */
  const canLeaveRecordedit = useRef(false);
  useEffect(() => {
    const avoidLeave = (e: any) => {
      // if we're showing errors or login-modal, allow users to navigate away
      if (loginModal || errors.length > 0) {
        return undefined;
      }
      if (canLeaveRecordedit.current || ConfigService.chaiseConfig.hideRecordeditLeaveAlert === true) {
        return undefined;
      }
      e.returnValue = 'Do you want to leave this page? Changes you have made will not be saved.';
    }

    windowRef.removeEventListener('beforeunload', avoidLeave);
    windowRef.addEventListener('beforeunload', avoidLeave);
    return () => {
      windowRef.removeEventListener('beforeunload', avoidLeave);
    };
  }, [loginModal, errors]);

  const onSubmitValid = (data: any) => {
    // remove all existing alerts
    removeAllAlerts();

    const submissionRows: any[] = [];
    // f is the number in forms array that is
    forms.forEach((f: number) => {
      submissionRows.push(populateSubmissionRow(reference, f, data, prefillRowData));
    });
    if (modifySubmissionRows) {
      modifySubmissionRows(submissionRows);
    }

    /**
     * Add raw values that are not visible to submissionRowsCopy:
     *
     * submissionRows is the datastructure that will be used for creating
     * the upload url. It must have all the visible and invisible data.
     * The following makes sure that submissionRows has all the underlying data
     */
    if (appMode === appModes.EDIT) {
      for (let i = 0; i < submissionRows.length; i++) {
        const newData = submissionRows[i];
        const oldData = tuples[i].data;

        // make sure submissionRows has all the data
        for (const key in oldData) {
          if (key in newData) continue;
          newData[key] = oldData[key];
        }
      }
    }

    validateSessionBeforeMutation(() => {
      // show spinner
      setShowSubmitSpinner(true);

      uploadFiles(submissionRows, () => {
        // close the modal
        setUploadProgressModalProps(undefined);

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
              if (windowRef.opener && windowRef.opener.updated && queryParams.invalidate) {
                windowRef.opener.updated(queryParams.invalidate);
              }
            } catch (exp) {
              // if windowRef.opener is from another origin, this will result in error on accessing any attribute in windowRef.opener
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

          if (onSubmitSuccess) {
            onSubmitSuccess(response);
          }
          // redirect to record app
          else if (forms.length === 1) {
            // Created a single entity or Updated one
            addAlert('Your data has been saved. Redirecting you now to the record...', ChaiseAlertType.SUCCESS);

            windowRef.location = page.reference.contextualize.detailed.appLink;
          }
          // see if we can just redirect, or if we need the resultset view.
          else {
            const compactRef = page.reference.contextualize.compact;
            const canLinkToRecordset = compactRef.readPath.length <= URL_PATH_LENGTH_LIMIT;

            const handlePlural = (p: any) => (p.length > 1 ? 's' : '');

            // if we have failures: <num> {updated|created} records
            // otherwise: {Updated|Created} records
            let headerPrefix = appMode === appModes.EDIT ? 'Updated' : 'Created';
            if (failedPage) {
              headerPrefix = page.length + (appMode === appModes.EDIT ? ' updated' : 'created');
            }

            // resultset view
            setAppState(RecordeditAppState.RESULTSET);
            setResultsetProps({
              success: {
                page,
                header: `${headerPrefix} record${handlePlural(page)}`,
                ... (canLinkToRecordset && {
                  exploreLink: compactRef.appLink, editLink: compactRef.contextualize.entryEdit.appLink
                })
              },
              ... (failedPage && {
                failed: {
                  page: failedPage,
                  header: `${failedPage.length} failed ${appMode === appModes.EDIT ? 'update' : 'creation'}${handlePlural(failedPage)}`
                },
                // TODO add exploreLink (most probably requires ermrestjs change)
              }),
            });
          }
        };

        const submitErrorCB = (exception: any) => {
          if (onSubmitError) {
            const res = onSubmitError(exception);
            if (!res) return;
          }

          validateSession().then((session) => {
            if (!session && exception instanceof ConfigService.ERMrest.ConflictError) {
              // login in a modal should show (Session timed out)
              dispatchError({ error: new ConfigService.ERMrest.UnauthorizedError() })
              return;
            }

            // append link to end of alert.
            if (exception instanceof ConfigService.ERMrest.DuplicateConflictError) {
              const link = exception.duplicateReference.contextualize.detailed.appLink;
              exception.message += ` Click <a href="${link}" target="_blank">here</a> to see the conflicting record that already exists.`;
            }

            const alertType = (exception instanceof ConfigService.ERMrest.NoDataChangedError ? ChaiseAlertType.WARNING : ChaiseAlertType.ERROR);
            addAlert(exception.message, alertType);
          })


        };

        const submitFinallyCB = () => {
          setShowSubmitSpinner(false);
        };

        const logParams = {
          ... (logInfo.logObject ? logInfo.logObject : {}),
          action: getRecordeditLogAction(appMode === appModes.EDIT ? LogActions.UPDATE : LogActions.CREATE),
          stack: getRecordeditLogStack()
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

          reference.update(tempTuples, logParams).then(submitSuccessCB).catch(submitErrorCB).finally(submitFinallyCB);
        } else {
          const createRef = reference.unfilteredReference.contextualize.entryCreate;
          createRef.create(submissionRows, logParams).then(submitSuccessCB).catch(submitErrorCB).finally(submitFinallyCB);
        }
      });
    });
  }

  // NOTE: most likely not needed
  const onSubmitInvalid = (errors: Object, e?: any) => {
    $log.debug('errors in the form:');
    $log.debug(errors);
    const invalidMessage = 'Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.';
    addAlert(invalidMessage, ChaiseAlertType.ERROR);
  }

  const uploadFiles = (submissionRowsCopy: any[], onSuccess: () => void) => {
    const uploadInfo = areFilesValid(submissionRowsCopy);
    // if there are no file inputs, or no files to upload
    if (!uploadInfo.hasAssetColumn) {
      onSuccess();
    } else if (uploadInfo.filesValid) {
      // If url is valid
      setUploadProgressModalProps({
        rows: submissionRowsCopy,
        onSuccess: onSuccess,
        onCancel: (exception: any) => {
          setShowSubmitSpinner(false);

          // NOTE: This check was being done in angularJS since the modal was closed with a message if the user aborted uploading
          //   - in ReactJS it's handling the case when the modal is closed and no "exception" is returned (undefined)
          //   - when we abort the upload, we're calling onCancel without any parameters
          if (isObjectAndNotNull(exception)) {
            let message;
            if (exception.message) {
              message = exception.message;
              if (exception.code === 403) message = MESSAGE_MAP.hatracUnauthorizedMessage + ' ' + message;
            } else {
              // happens with an error with code 0 (Timeout Error)
              message = MESSAGE_MAP.errorMessageMissing;
            }

            // we don't know how to handle the error in the code, show error to user as alert
            addAlert(message, ChaiseAlertType.ERROR);
          }

          // close the modal
          setUploadProgressModalProps(undefined);
        }
      })
    } else {
      setShowSubmitSpinner(false);
    }
  }

  const areFilesValid = (rows: any[]) => {
    let isValid = true, index = 0, hasAssetColumn = false;
    // Iterate over all rows that are passed as parameters to the modal controller
    rows.forEach((row) => {

      index++;

      // Iterate over each property/column of a row
      for (const k in row) {

        // If the column type is object and has a file property inside it
        // Then increment the count for no of files and create an uploadFile Object for it
        // Push this to the tuple array for the row
        // NOTE: each file object has an hatracObj property which is an hatrac object
        try {
          let column = reference.columns.find((c: any) => { return c.name === k; });
          if (!column) {
            // the file might be related to one of the columns in the input-iframe column mapping
            reference.columns.forEach((col: any) => {
              if (!col.isInputIframe) return;
              column = col.inputIframeProps.columns.find((c: any) => c.name === k);
            })
          }
          if (column && column.isAsset) {
            hasAssetColumn = true;

            if (row[k].url === '' && !column.nullok) {
              isValid = false;
              addAlert('Please select file for column ' + k + ' for record ' + index, ChaiseAlertType.ERROR);
            } else if (row[k] !== null && typeof row[k] === 'object' && row[k].file) {
              try {
                if (!row[k].hatracObj.validateURL(row)) {
                  isValid = false;
                  addAlert('Invalid url template for column ' + k + ' for record ' + index, ChaiseAlertType.ERROR);
                }
              } catch (e) {
                isValid = false;
                addAlert('Invalid url template for column ' + k + ' for record ' + index, ChaiseAlertType.ERROR);
              }
            }
          }
        } catch (e) {
          //Nothing to do
        }
      }
    });

    return { filesValid: isValid, hasAssetColumn: hasAssetColumn };
  }

  const addForm = (count: number) => {
    const newFormValues: number[] = [];

    const tempForms = [...forms];
    for (let i = 0; i < count; i++) {
      // last value in 'forms' incremented by 1
      const formValue = tempForms[tempForms.length - 1] + 1;
      tempForms.push(formValue);
      newFormValues.push(formValue);
    }

    // add 'count' number of forms
    setForms(tempForms);

    return newFormValues;
  };

  /**
   * 
   * @param indexes array of indexes to remove from forms array (and tuples array)
   * @param formValues formValuesused for cleaning up 
   * @param skipLogging boolean to skip logging the remove action
   */
  const removeForm = (indexes: number[], formValues: any, skipLogging?: boolean) => {
    if (!skipLogging) {
      logRecordeditClientAction(LogActions.FORM_REMOVE);
    }

    const prefillObject = getPrefillObject(queryParams);
    if (prefillObject?.hasUniqueAssociation) {
      let tempSelectedRows = [...prefillAssociationSelectedRows];
      // TODO: this is ignoring composite foreign keys
      // NOTE: indexes is the value AT the given index in forms[] to remove
      indexes.forEach((idx: number) => {
        // get values from RHF to then find the rows in prefillAssociationSelectedRows to remove
        prefillAssociationFkLeafColumn.foreignKey.colset.columns.forEach((fkCol: any) => {
          // RHF indexing starts at 1
          const RHFindex = `c_${forms[idx]}-${fkCol.RID}`;
          const valueToCompare = formValues[RHFindex];
          
          const keyCol = prefillAssociationFkLeafColumn.foreignKey.mapping.get(fkCol)
          
          tempSelectedRows = tempSelectedRows.filter((row: SelectedRow) => {
            return row.data[keyCol.name] !== valueToCompare;
          });
        });
        
      });
      
      setPrefillAssociationSelectedRows(tempSelectedRows);
    }

    // remove the forms based on the given indexes
    setForms((previous: number[]) => previous.filter(({ }, i: number) => !indexes.includes(i)));

    setTuples((previous: any[]) => previous.filter(({ }, i: number) => !indexes.includes(i)));

    // TODO: should this cleanup the form data?
    //   if reading the data for submission is done based on formValue (instead of index) this shouldn't matter
  }

  const updateAssociationSelectedRows = (oldValues: any, newRow?: SelectedRow) => {
    let tempSelectedRows = [...prefillAssociationSelectedRows];
    tempSelectedRows = tempSelectedRows.filter((row: SelectedRow) => {
      // oldValues is keyed by the column name we are matching against
      const oldKeys: string[] = Object.keys(oldValues);
      let matchedVals = 0;
      for (let i=0; i < oldKeys.length; i++) {
        const key = oldKeys[i];
        if (row.data[key] === oldValues[key]) matchedVals += 1;
      }

      return matchedVals !== oldKeys.length;
    });

    if (newRow) tempSelectedRows.push(newRow);

    setPrefillAssociationSelectedRows(tempSelectedRows);
  }

  const getInitialFormValues = (forms: number[], columnModels: RecordeditColumnModel[]) => {
    let initialModel: any = { values: {} };
    if (appMode === appModes.CREATE) {
      // NOTE: should only be 1 form for create...
      initialModel = populateCreateInitialValues(columnModels, forms, queryParams, prefillRowData);

      setWaitingForForeignKeyData(initialModel.shouldWaitForForeignKeyData);
      shouldFetchForeignKeyData.current = initialModel.shouldWaitForForeignKeyData;
    } else if (appMode === appModes.EDIT || appMode === appModes.COPY) {
      // using page.tuples here instead of forms
      initialModel = populateEditInitialValues(reference, columnModels, forms, tuplesRef.current, appMode);

      setCanUpdateValues(initialModel.canUpdateValues);
    }

    foreignKeyData.current = initialModel.foreignKeyData

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

    columnModels.forEach((colModel: RecordeditColumnModel, index: number) => {
      const column = colModel.column;
      if (!column.isForeignKey) return;

      // if it's a prefilled foreignkey, the value is going to be set by processPrefilledForeignKeys
      if (prefillObj && prefillObj.fkColumnNames.indexOf(column.name) !== -1) {
        return;
      }

      // TODO assuming this is the first form!
      const defaultValue = initialValues[`c_1-${column.RID}`];

      // if all the columns of the foreignkey are prefilled, use that instead of default
      if (prefillObj && allForeignKeyColumnsPrefilled(column, prefillObj)) {
        const defaultDisplay = column.getDefaultDisplay(prefillObj.keys);

        // if the data is missing, ermrestjs will return null
        // although the previous allPrefilled should already guard against this.
        if (!defaultDisplay.reference) return;

        // get the actual foreign key data
        // TODO should be modified if recordedit is used in a modal (parent log related params)
        flowControl.current.addForeignKeyRequest(index, defaultDisplay.reference, LogActions.FOREIGN_KEY_PRESELECT);

      } else if (defaultValue !== null && defaultValue !== '') {

        // get the actual foreign key data
        // TODO should be modified if recordedit is used in a modal (parent log related params)
        flowControl.current.addForeignKeyRequest(index, column.defaultReference, LogActions.FOREIGN_KEY_DEFAULT);
      }

    });

    flowControl.current.setValue = setValue;
    processForeignKeyRequests();
  }

  // ---------------- fk flow-control related function --------------------------- //

  /**
   * flow-control logic for foreign key requests
   */
  function processForeignKeyRequests() {
    if (!flowControl.current.haveFreeSlot()) {
      return;
    }

    if (!flowControl.current.prefillProcessed && flowControl.current.prefillObj) {
      flowControl.current.queue.occupiedSlots++;
      flowControl.current.prefillProcessed = true;
      processPrefilledForeignKeys(flowControl.current.prefillObj, flowControl.current.setValue);
    }

    flowControl.current.foreignKeyRequests.forEach((fkReq) => {
      if (fkReq.processed || !flowControl.current.haveFreeSlot()) {
        return;
      }

      flowControl.current.queue.occupiedSlots++;
      fkReq.processed = true;

      const cm = columnModels[fkReq.colIndex];
      const logObj = {
        action: getRecordeditLogAction(fkReq.logAction, cm.logStackPathChild),
        stack: getRecordeditLogStack(cm.logStackNode)
      };
      fetchForeignKeyData([cm.column.RID], fkReq.reference, logObj, flowControl.current.setValue);
    });
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
  function processPrefilledForeignKeys(prefillObj: PrefillObject, setValue: any) {

    // NOTE since this is create mode and we're disabling the addForm,
    // we can assume this is the first form
    const formValue = 1;

    // update the displayed value
    prefillObj.fkColumnNames.forEach((name: string) => {
      const colRID = prefillObj.columnNameToRID[name];
      setValue(`c_${formValue}-${colRID}`, prefillObj.rowname.value);
    });

    // update the raw data that will be sent to ermrestjs
    Object.keys(prefillObj.keys).forEach((columnName: string) => {
      const colRID = prefillObj.columnNameToRID[columnName];
      setValue(`c_${formValue}-${colRID}`, prefillObj.keys[columnName]);
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

      // since this is not necessarily related to a columnModel, we have
      // to create the stack node ourself
      const stackNode = LogService.getStackNode(
        LogStackTypes.FOREIGN_KEY,
        ref.table,
        { source: source, entity: true }
      );

      const logObj = {
        action: getRecordeditLogAction(LogActions.FOREIGN_KEY_PRESELECT, LogStackPaths.FOREIGN_KEY),
        stack: getRecordeditLogStack(stackNode)
      }

      const fkColumnRIDs: string[] = []
      prefillObj.fkColumnNames.forEach((name: string) => {
        fkColumnRIDs.push(prefillObj.columnNameToRID[name]);
      });
      fetchForeignKeyData(fkColumnRIDs, ref, logObj, setValue);
    }).catch(function (err: any) {
      $log.warn(err);
    });
  }

  /**
   * In case of prefill and default we only have a reference to the foreignkey,
   * we should do extra reads to get the actual data.
   *
   * NOTE for default we don't want to send the raw data to the ermrestjs request,
   * that's why after fetching the data we're only changing the displayed rowname
   * and the foreignKeyData, not the raw values sent to ermrestjs.
   * @param formValue which form it is
   * @param colRIDs the columns RIDs that will use this data
   * @param fkRef the foreignkey reference that should be used for fetching data
   * @param logObject
   */
  function fetchForeignKeyData(colRIDs: string[], fkRef: any, logObject: any, setValue: any) {
    // NOTE since this is create mode and we're disabling the addForm,
    // we can assume this is the first form
    const formValue = 1;

    // we should get the fk data since it might be used for rowname
    fkRef.contextualize.compactSelectForeignKey.read(1, logObject, false, true).then((page: any) => {
      colRIDs.forEach(function (RID) {
        // we should not set the raw default values since we want ermrest to handle those for us.
        // so we're just setting the displayed rowname to users
        // and also the foreignkeyData used for the domain-filter logic.

        // default value is validated
        if (page.tuples.length > 0) {
          foreignKeyData.current[`c_${formValue}-${RID}`] = page.tuples[0].data;
          setValue(`c_${formValue}-${RID}`, page.tuples[0].displayname.value);
        } else {
          foreignKeyData.current[`c_${formValue}-${RID}`] = {};
          setValue(`c_${formValue}-${RID}`, '');
        }
      });
    }).catch(function (err: any) {
      $log.warn(err);
    }).finally(() => {
      flowControl.current.queue.occupiedSlots--;

      if (flowControl.current.allRequestsProcessed()) {
        setWaitingForForeignKeyData(false);
      } else {
        processForeignKeyRequests();
      }
    })

  }

  // ---------------- log related function --------------------------- //

  /**
   * log client action
   * @param actionPath the action string (without the stack path)
   * @param childStackPath (the stack path of the current child)
   * @param childStackElement the created child stack element
   * @param extraInfo extra information that we want to add to stack
   * @param ref the reference to use for default log info.
   */
  const logRecordeditClientAction = (actionPath: LogActions, childStackPath?: any, childStackElement?: any, extraInfo?: any, ref?: any) => {
    const usedRef = ref ? ref : reference;
    LogService.logClientAction({
      action: getRecordeditLogAction(actionPath, childStackPath),
      stack: getRecordeditLogStack(childStackElement, extraInfo)
    }, usedRef.defaultLogInfo);
  };

  /**
   * return the action string that should be used for logging.
   * NOTE if `true` passed as the first parameter, it will return the stack path.
   * @param actionPath the action string (without the stack path) or `true`.
   * @param childStackPath (the stack path of the current child)
   */
  const getRecordeditLogAction = (actionPath: LogActions | true, childStackPath?: any) => {
    let stackPath = logInfo.logStackPath;
    if (actionPath === true) {
      return stackPath;
    }
    if (childStackPath) {
      stackPath = LogService.getStackPath(stackPath, childStackPath);
    }
    return LogService.getActionString(actionPath, stackPath, logInfo.logAppMode);
  }

  /**
   * return the stack object that should be used for logging.
   * @param childStackElement the created child stack element
   * @param extraInfo extra information that we want to add to stack
   */
  const getRecordeditLogStack = (childStackElement?: any, extraInfo?: any) => {
    let stack = logInfo.logStack;
    if (childStackElement) {
      stack = logInfo.logStack.concat(childStackElement);
    }
    if (extraInfo) {
      return LogService.addExtraInfoToStack(stack, extraInfo);
    }
    return stack;
  }

  const providerValue = useMemo(() => {
    return {
      // main entity:
      appMode,
      appState,
      setAppState,
      canUpdateValues,
      columnModels,
      columnPermissionErrors,
      config,
      foreignKeyData,
      initialized,
      modalOptions,
      queryParams,
      prefillRowData,
      reference,
      tuples,
      waitingForForeignKeyData,
      foreignKeyCallbacks,

      // form
      forms,
      addForm,
      removeForm,
      getInitialFormValues,
      getPrefilledDefaultForeignKeyData,

      onSubmitValid,
      onSubmitInvalid,
      showCloneSpinner,
      setShowCloneSpinner,
      showApplyAllSpinner,
      setShowApplyAllSpinner,
      showSubmitSpinner,
      resultsetProps,
      uploadProgressModalProps,
      setLastContiguousChunk,
      lastContiguousChunkRef,
      MAX_ROWS_TO_ADD: maxRowsToAdd,

      // prefill association modal
      prefillAssociationFkLeafColumn,
      setPrefillAssociationFkLeafColumn,
      prefillAssociationFkMainColumn,
      setPrefillAssociationFkMainColumn,
      prefillAssociationSelectedRows,
      setPrefillAssociationSelectedRows,
      updateAssociationSelectedRows,

      // log related:
      logRecordeditClientAction,
      getRecordeditLogAction,
      getRecordeditLogStack,
    };
  }, [
    // main entity:
    appState, columnModels, columnPermissionErrors, initialized, reference, tuples, waitingForForeignKeyData,
    forms, showCloneSpinner, showApplyAllSpinner, showSubmitSpinner, resultsetProps,
    prefillAssociationFkLeafColumn, prefillAssociationFkMainColumn, prefillAssociationSelectedRows
  ]);

  return (
    <RecordeditContext.Provider value={providerValue}>
      {children}
    </RecordeditContext.Provider>
  )
}
