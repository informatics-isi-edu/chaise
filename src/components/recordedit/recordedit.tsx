import '@isrd-isi-edu/chaise/src/assets/scss/_recordedit.scss';

// components
import { Accordion, Modal } from 'react-bootstrap';
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DeleteConfirmationModal, { DeleteConfirmationModalTypes } from '@isrd-isi-edu/chaise/src/components/modals/delete-confirmation-modal';
import FormContainer from '@isrd-isi-edu/chaise/src/components/recordedit/form-container';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import KeyColumn from '@isrd-isi-edu/chaise/src/components/recordedit/key-column';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/modals/recordset-modal';
import ResultsetTable from '@isrd-isi-edu/chaise/src/components/recordedit/resultset-table';
import ResultsetTableHeader from '@isrd-isi-edu/chaise/src/components/recordedit/resultset-table-header';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import UploadProgressModal from '@isrd-isi-edu/chaise/src/components/modals/upload-progress-modal';

// hooks
import { useEffect, useRef, useState, type JSX } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';
import { FormProvider, useForm } from 'react-hook-form';
import ViewerAnnotationFormContainer from '@isrd-isi-edu/chaise/src/components/recordedit/viewer-annotation-form-container';

// models
import { LogActions, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import {
  appModes, RecordeditColumnModel,
  RecordeditDisplayMode, RecordeditProps
} from '@isrd-isi-edu/chaise/src/models/recordedit';
import {
  RecordsetConfig, RecordsetDisplayMode,
  RecordsetProps, RecordsetSelectMode, SelectedRow
} from '@isrd-isi-edu/chaise/src/models/recordset';
import { RecordeditNotifyActions } from '@isrd-isi-edu/chaise/src/models/events';

// providers
import AlertsProvider, { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordeditProvider from '@isrd-isi-edu/chaise/src/providers/recordedit';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { RECORDEDIT_MAX_ROWS, RECORDSET_DEFAULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import {
  copyOrClearValue, disabledTuplesPromise, populateCreateInitialValues
} from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { attachContainerHeightSensors, attachMainContainerPaddingSensor } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

const Recordedit = ({
  appMode,
  config,
  logInfo,
  modalOptions,
  parentContainer = document.querySelector('#chaise-app-root') as HTMLElement,
  initialTuples,
  prefillRowData,
  queryParams,
  reference,
  hiddenColumns,
  foreignKeyCallbacks,
  modifySubmissionRows,
  onSubmitSuccess,
  onSubmitError
}: RecordeditProps): JSX.Element => {
  const provider = (
    <RecordeditProvider
      appMode={appMode}
      config={config}
      logInfo={logInfo}
      modalOptions={modalOptions}
      queryParams={queryParams}
      initialTuples={initialTuples}
      prefillRowData={prefillRowData}
      reference={reference}
      hiddenColumns={hiddenColumns}
      foreignKeyCallbacks={foreignKeyCallbacks}
      modifySubmissionRows={modifySubmissionRows}
      onSubmitSuccess={onSubmitSuccess}
      onSubmitError={onSubmitError}
    >
      <RecordeditInner
        parentContainer={parentContainer}
        prefillRowData={prefillRowData}
        queryParams={queryParams}
      />
    </RecordeditProvider>
  );

  // in viewer-annotation mode, we want the alerts to be handled by the parent
  if (config.displayMode === RecordeditDisplayMode.VIEWER_ANNOTATION) {
    return provider;
  }

  return <AlertsProvider>{provider}</AlertsProvider>;
}

export type RecordeditInnerProps = {
  parentContainer?: HTMLElement;
  prefillRowData?: any[];
  queryParams?: any;
}

const RecordeditInner = ({
  parentContainer,
  prefillRowData,
  queryParams
}: RecordeditInnerProps): JSX.Element => {

  const { validateSessionBeforeMutation } = useAuthn();
  const { errors, dispatchError } = useError();
  const { addTooManyFormsAlert } = useAlert();
  const {
    appMode, columnModels, config, foreignKeyData, initialized, modalOptions,
    prefillObject, bulkForeignKeySelectedRows, setBulkForeignKeySelectedRows,
    reference, tuples, waitingForForeignKeyData, addForm, getInitialFormValues,
    getPrefilledDefaultForeignKeyData, forms, MAX_ROWS_TO_ADD, removeForm, showCloneSpinner, setShowCloneSpinner,
    showApplyAllSpinner, showSubmitSpinner, resultsetProps, uploadProgressModalProps, logRecordeditClientAction, notifyParentPage
  } = useRecordedit();

  const [formProviderInitialized, setFormProviderInitialized] = useState<boolean>(false);
  const [addFormsEffect, setAddFormsEffect] = useState<boolean>(false);

  // the next 3 state variables are used when there is a prefill object for starting recordedit with more than one form to associate on creation
  const [showBulkForeignKeyModal, setShowBulkForeignKeyModal] = useState<boolean>(false);
  const [bulkForeignKeyRecordsetProps, setBulkForeignKeyRecordsetProps] = useState<RecordsetProps | null>(null);
  // when initializing the page, the selections in the modal that appears first should fill the first form
  const [bulkForeignKeySelectionsFillFirstForm, setBulkForeignKeySelectionsFillFirstForm] = useState<boolean>(true);

  /**
   * The following state variable and function for modifying the state are defined here instead of the recordedit context for the reason
   * stated below from linked article. These properties are passed as props to the components so they only rerender when they need to instead
   * of when the context changes
   *
   *  - activeMultiForm is used by key-column and form-container
   *  - toggleActiveMultiForm is used by key-column and multi-form-input-row
   *
   * https://adevnadia.medium.com/react-re-renders-guide-preventing-unnecessary-re-renders-8a3d2acbdba3#:~:text=There%20is%20no%20way%20to
   * There is no way to prevent a component that uses a portion of Context value from re-rendering, even if the used piece
   * of data hasn’t changed, even with useMemo hook. Context selectors, however, could be faked with the use of
   * higher-order components and React. memo .
   */
  const [activeMultiForm, setActiveMultiForm] = useState<number>(-1);
  const toggleActiveMultiForm = (colIndex: number) => {
    setActiveMultiForm((prev) => {
      return colIndex === prev ? -1 : colIndex;
    });
  };

  /**
   * the following are used for bulk delete feature
   */
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<{
    // when object is null, hide the modal
    // object is the props for the the modal
    onConfirm: () => void,
    onCancel: () => void,
    buttonLabel: string,
    message?: JSX.Element,
    reference?: any
  } | null>(null);

  const [showDeleteSpinner, setShowDeleteSpinner] = useState(false);

  const mainContainer = useRef<HTMLDivElement>(null);
  const copyFormRef = useRef<HTMLInputElement>(null);

  // type FormDefaultValues = {
  //   [`${name}-min`]: RangeOptions['absMin'];
  //   [`${name}-max`]: RangeOptions['absMax'];
  // };

  /**
   * TODO
   * Need to find a way to dynamically generate the type for FormDefaultValue based on the types of the columns
   */
  const methods = useForm<any>({
    mode: 'all',
    reValidateMode: 'onChange',
    resolver: undefined,
    context: undefined,
    criteriaMode: 'firstError',
    shouldUnregister: false,
    shouldUseNativeValidation: false,
    delayError: undefined
  });

  const canShowBulkDelete = appMode === appModes.EDIT && ConfigService.chaiseConfig.deleteRecord !== false;
  /**
   * enable the button if at least one row can be deleted
   */
  const canEnableBulkDelete = canShowBulkDelete && tuples.some((t: any) => t.canDelete);

  /**
   * form is ready when,
   * - form is not initialized
   * - we're waiting for foreignkey data of some columns.
   * after this, user can click on title buttons.
   */
  const allFormDataLoaded = initialized && !waitingForForeignKeyData;

  /**
   * handler for bulk delete button. it will,
   * - check the session
   * - show confirm modal
   * - call bulk delete
   */
  const onBulkDeleteButtonClick = () => {
    // TODO do we need an indicator that we're waiting for session fetch?
    validateSessionBeforeMutation(() => {
      if (ConfigService.chaiseConfig.confirmDelete === undefined || ConfigService.chaiseConfig.confirmDelete) {
        LogService.logClientAction({
          action: LogService.getActionString(LogActions.DELETE_INTEND),
          stack: LogService.getStackObject()
        });

        let confirmMessage;
        if (tuples.length > 1) {
          confirmMessage = <>Are you sure you want to delete all {tuples.length} of the displayed records?</>
        }
        setShowDeleteConfirmationModal({
          buttonLabel: 'Delete',
          onConfirm: () => { bulkDelete() },
          onCancel: () => {
            setShowDeleteConfirmationModal(null);
            LogService.logClientAction({
              action: LogService.getActionString(LogActions.DELETE_CANCEL),
              stack: LogService.getStackObject()
            });
          },
          message: confirmMessage,
          reference
        });

      } else {
        bulkDelete();
      }
    })
    return;
  };

  /**
   * the function that calls delete
   */
  const bulkDelete = () => {
    // make sure the main spinner is displayed
    setShowDeleteSpinner(true);
    // close the confirmation modal if it exists
    setShowDeleteConfirmationModal(null);

    const logObj = {
      // NOTE should be changed to use internal function if we want to
      // have recordedit on a modal
      action: LogService.getActionString(LogActions.DELETE),
      stack: LogService.getStackObject()
    };

    // TODO should be adjusted if we changed how we're tracking the tuples
    reference.delete(tuples, logObj).then((response: any) => {
      const allDeleted = response.failedTupleData.length === 0;
      // let the caller record or recordset page know about this event
      notifyParentPage({
        id: queryParams ? queryParams.invalidate : '',
        type: RecordeditNotifyActions.DELETE,
        details: {
          partial: !allDeleted
        }
      });
      /**
       * * will be called when some records failed to delete
       */
      const partialSuccessCB = () => {
        // remove the forms that have been deleted
        const removedForms: number[] = [];
        response.successTupleData.forEach((data: any) => {
          // data is an object of key/value pairs for each piece of key information
          // { keycol1: val, keycol2: val2, ... }
          // TODO should be adjusted if we changed how we're tracking the tuples
          const idx = tuples.findIndex((tuple: any) => {
            return Object.keys(data).every(function (key) {
              return tuple.data[key] === data[key];
            });
          });

          if (idx >= 0) {
            removedForms.push(idx);
          }
        });

        removeForm(removedForms, true);
      };
      /**
       * will be called when all records were deleted
       */
      const fullSuccesCB = () => {
        windowRef.location = reference.contextualize.compact.appLink;
      }
      dispatchError({
        error: response,
        isDismissible: !allDeleted,
        okBtnActionMessage: allDeleted ? MESSAGE_MAP.clickActionMessage.okGoToRecordset : undefined,
        okBtnCallback: allDeleted ? fullSuccesCB : partialSuccessCB,
        closeBtnCallback: allDeleted ? fullSuccesCB : partialSuccessCB
      });
    }).catch((error: any) => {
      dispatchError({ error: error, isDismissible: true });
    }).finally(() => {
      // hide the spinner
      setShowDeleteSpinner(false);
    });
  };

  /**
   * the callback for reset button displayed in edit mode
   */
  const onResetClick = () => {
    // TODO log the client action
    windowRef.location.reload();
  };

  // once data is fetched, initialize the form data with RHF
  useEffect(() => {
    if (!initialized) return;

    /**
     * used to trigger recordset select view when selecting multiple foreign key values
     *
     * trigger the bulk foreign key modal when there are 2 foreign keys and
     * we know the leaf column for the relation is visible in create mode
     *
     * if `bulkCreateForeignKeyObject` is defined on `reference`, we know the above is true
     */
    if (reference.bulkCreateForeignKeyObject) openBulkForeignKeyModal();

    const initialValues = getInitialFormValues(forms, columnModels);
    methods.reset(initialValues);

    // in create mode, we need to fetch the foreignkey data
    // for prefilled and foreignkeys that have default values
    if (appMode === appModes.CREATE) {
      // updates React hook form state with `setValue`
      getPrefilledDefaultForeignKeyData(initialValues, methods.setValue);
    }

    setFormProviderInitialized(true);
  }, [initialized]);

  /**
   * - properly set scrollable section height
   * - make sure the right padding is correct regardless of scrollbar being there or not
   */
  useEffect(() => {
    if (!formProviderInitialized || config.displayMode !== RecordeditDisplayMode.FULLSCREEN) return;

    const resizeSensors = attachContainerHeightSensors(parentContainer);
    resizeSensors.push(attachMainContainerPaddingSensor(parentContainer));

    return () => {
      resizeSensors?.forEach((rs) => !!rs && rs.detach());
    }
  }, [formProviderInitialized]);

  /**
   * This useEffect triggers when addFormsEffect is set to true when "clone" is clicked
   * this allows for showCloneSpinner state variable to change separately from callAddForm (which changes the total # of forms)
   * when showCloneSpinner is changed there is a repaint of the DOM before this useEffect triggers,
   *    which shows the spinner before triggering the addForms logic (which can be slow when many forms are added at once)
   */
  useEffect(() => {
    if (!addFormsEffect) return;

    setAddFormsEffect(false);
    callAddForm();
  }, [addFormsEffect]);

  const callAddForm = () => {
    // converts to number type. If NaN is returned, 1 is used instead
    const numberFormsToAdd: number = Number(copyFormRef.current?.value) || 1;

    // log the button was clicked
    logRecordeditClientAction(
      numberFormsToAdd > 1 ? LogActions.FORM_CLONE_X : LogActions.FORM_CLONE,
      undefined, undefined,
      numberFormsToAdd > 1 ? { clone: numberFormsToAdd } : undefined
    );

    // refactor so provider manages the forms
    const numberForms = forms.length;
    if ((numberFormsToAdd + numberForms) > MAX_ROWS_TO_ADD) {
      // calculate the number of forms the user can still add
      const numberFormsAllowed = MAX_ROWS_TO_ADD - numberForms
      let alertMessage = `Cannot add ${numberFormsToAdd} records. Please input a value between 1 and ${numberFormsAllowed}, inclusive.`;
      if (numberFormsAllowed === 0) alertMessage = `Cannot add ${numberFormsToAdd} records. Maximum number of forms already added.`;
      addTooManyFormsAlert(alertMessage, ChaiseAlertType.ERROR);
      setShowCloneSpinner(false);
      return true;
    }

    const newFormsObj: { tempFormValues: any, lastFormValue: number } = createNewForms(methods.getValues(), numberFormsToAdd);

    /**
     * NOTE: This might be able to be optimized to use setValue for each value in the new forms instead of resetting EVERY form in react hook form
     *   for instance, 4 forms exist and 1 new form is added, this will call "reset" on all 5 forms
     *
     * Is it possible for this change to cause longer scripting time? For instance, iterating over every single cell for each new form
     * could end up taking longer using setValue (and whatever happens in react-hook-form) vs no iteration and instead leaving it up to
     * react-hook-form and how `methods.reset()` works
     *
     * A contradicting note, since each new form being added needs to render new input fields, form-row component will rerender. This
     * means all input fields (already existing and new ones) will be rendered when new forms are added. Refactoring this might not change
     * rendering performance at all. Maybe to prevent previous input fields from rerendering, the input-switch component should be memoized?
     */
    methods.reset(newFormsObj.tempFormValues);
  };

  /**
   * creates new forms by copying values from previous form
   *
   * @param formValues values for ALL forms
   * @param numberFormsToAdd the number of forms to copy values for
   * @returns an object with the new formValues and the form number for the last form
   */
  const createNewForms = (formValues: any, numberFormsToAdd: number) => {
    // the indices used for tracking input values in react-hook-form
    const newFormValues: number[] = addForm(numberFormsToAdd);

    // the index for the data from last form being cloned
    const lastFormValue = newFormValues[0] - 1;

    let tempFormValues = { ...formValues };
    // add data to tempFormValues to initailize new forms
    for (let i = 0; i < newFormValues.length; i++) {
      const formValue = newFormValues[i];
      columnModels.forEach((cm: RecordeditColumnModel) => {
        // don't copy the value for the leaf column for an assoication that is unique
        if (cm.isLeafInUniqueBulkForeignKeyCreate) return;

        copyOrClearValue(cm, tempFormValues, foreignKeyData.current, formValue, lastFormValue, false, true);
      });

      // the code above is just copying the displayed rowname for foreignkeys,
      // we still need to copy the raw values
      // but we cannot go based on visible columns since some of this data might be for invisible fks.
      tempFormValues = setOutboundForeignKeyValues(tempFormValues, formValue, lastFormValue);
    }

    return { tempFormValues, lastFormValue };
  }

  /**
   * set values in foreignkey data and formValues for all out foreign key columns
   *
   * @param formValues the existing values in the form
   * @param formNumber the form number we are setting values for
   * @param lastFormValue the last form number that values are copied from
   * @param checkPrefill if prefill should be checked for copying
   * @returns updated form values to set in react hook form
   */
  const setOutboundForeignKeyValues = (formValues: any, formNumber: number, lastFormValue: number, checkPrefill?: boolean) => {
    const tempFormValues = { ...formValues };
    reference.activeList.allOutBounds.forEach((col: any) => {
      const bulkFKObject = reference.bulkCreateForeignKeyObject;
      // don't copy the value if the column is the leaf column in a unique key for bullk foreign key create
      if (bulkFKObject?.isUnique && col.name === bulkFKObject.leafColumn.name) return;

      // copy the foreignKeyData (used for domain-filter support in foreignkey-field.tsx)
      foreignKeyData.current[`c_${formNumber}-${col.RID}`] = simpleDeepCopy(foreignKeyData.current[`c_${lastFormValue}-${col.RID}`]);

      if (checkPrefill) {
        // check prefill object for the columns that are being prefilled to update the new forms since we aren't calling getPrefilledDefaultForeignKeyData()
        if (prefillObject?.fkColumnNames.indexOf(col.name) !== -1) {
          tempFormValues[`c_${formNumber}-${col.RID}`] = formValues[`c_${lastFormValue}-${col.RID}`];
        }
      }

      // copy the raw data (submitted to ermrestjs)
      col.foreignKey.colset.columns.forEach((col: any) => {
        const val = formValues[`c_${lastFormValue}-${col.RID}`];
        if (val === null || val === undefined) return;

        tempFormValues[`c_${formNumber}-${col.RID}`] = val;
      });
    });

    return tempFormValues;
  }

  // show the prefill bulk foreign key modal if we have a prefill object and bulk foreign key recordset props
  const openBulkForeignKeyModal = () => {
    const bulkFKObject = reference.bulkCreateForeignKeyObject;
    // check for bulkCreateForeignKeyObject being defined since a malformed prefillObject should be ignored
    //   and the `bulkCreateForeignKeyObject` constructor will handle those malformed cases
    if (!bulkFKObject) return;

    const domainRef: any = bulkFKObject.leafColumn.reference;
    const andFilters: any[] = bulkFKObject.andFiltersForLeaf();

    const modalReference = domainRef.addFacets(andFilters).contextualize.compactSelectBulkForeignKey;

    const recordsetConfig: RecordsetConfig = {
      viewable: false,
      editable: false,
      deletable: false,
      sortable: true,
      selectMode: RecordsetSelectMode.MULTI_SELECT,
      disableFaceting: false,
      displayMode: RecordsetDisplayMode.FK_POPUP_BULK_CREATE
    };

    const stackElement = LogService.getStackNode(
      LogStackTypes.FOREIGN_KEY,
      domainRef.table,
      { source: domainRef.compressedDataSource, entity: true, picker: 1 }
    );

    const logInfo = {
      logStack: [stackElement],
      logStackPath: LogService.getStackPath(null, LogStackPaths.FOREIGN_KEY_BULK_POPUP),
    };

    let getDisabledTuples;
    if (bulkFKObject.isUnique) {
      /**
       * The existing rows in this table must be disabled so users doesn't resubmit them.
       *
       * set getDisabledTuples again since the selected rows could have changed since the last time the modal was opened
       * selected rows can be changed by updating a single foreign key input, removing the value, or removing a form entirely
       */
      getDisabledTuples = disabledTuplesPromise(
        domainRef.contextualize.compactSelectBulkForeignKey,
        bulkFKObject.disabledRowsFilter(),
        bulkForeignKeySelectedRows
      );
    }

    const pageSize = modalReference.display.defaultPageSize ? modalReference.display.defaultPageSize : RECORDSET_DEFAULT_PAGE_SIZE;

    // set recordset select view then set selected rows on "submit"
    setBulkForeignKeyRecordsetProps({
      initialReference: modalReference,
      initialPageLimit: pageSize,
      config: recordsetConfig,
      logInfo: logInfo,
      parentReference: reference,
      getDisabledTuples
    });

    setShowBulkForeignKeyModal(true);
  }

  const onBulkForeignKeyModalRowsChanged = (rows: SelectedRow[]) => {
    // return "false" to disable submit button in modal
    let numForms = forms.length;

    // if we fill the first form, then reduce our calculation by 1
    // NOTE: forms.length "should" be 1 at this point before subtracting 1
    if (bulkForeignKeySelectionsFillFirstForm) numForms--;

    if (rows.length + numForms < RECORDEDIT_MAX_ROWS) {
      return true;
    }

    // there are too many forms trying to be added
    const numberFormsAllowed = RECORDEDIT_MAX_ROWS - numForms;
    let alertMessage = `Cannot select ${rows.length} records. Please input a value between 1 and ${numberFormsAllowed}, inclusive.`;
    if (numberFormsAllowed === 0) alertMessage = `Cannot select ${rows.length} records. Maximum number of forms already added.`;

    return alertMessage;
  }

  // user closes the modal without making any selections
  const closeBulkForeignKeyCB = () => {
    // if the page was loaded with a modal showing and it is dismissed, update app state variable and do nothing else
    // ensure `bulkForeignKeySelectedRows` is initialized with an empty value
    if (bulkForeignKeySelectionsFillFirstForm) {
      setBulkForeignKeySelectionsFillFirstForm(false);
      setBulkForeignKeySelectedRows([null]);
    }

    setShowBulkForeignKeyModal(false);
  }

  /**
   * user makes selections in the multi select foreign key modal and clicks submit
   * this function updates the selected rows (if the foreign keys are part of a unique key) and fills in the new forms based
   * on the state of the app and the number of selected rows
   *
   * if the first modal is submitted after load of app page, one of the selected values will
   * fill in the first form. After that, the selections will copy the last form's values or use default
   * values based on what is set in the annotation (pending annotation implementation)
   *
   * NOTE: This should only be called if reference.bulkCreateForeignKeyObject is defined
   *
   * @param modalSelectedRows the selected rows from the foreign key modal
   */
  const submitBulkForeignKeyCB = (modalSelectedRows: SelectedRow[]) => {
    setShowBulkForeignKeyModal(false);

    // should not happen since submit button is greyed out
    if (!modalSelectedRows || modalSelectedRows.length === 0) return;

    const bulkFKObject = reference.bulkCreateForeignKeyObject
    if (bulkFKObject.isUnique) {
      /**
       * copy modalSelectedRows 2nd to preserve indexes in bulkForeignKeySelectedRows
       *
       * this function does 2 different things:
       *  - fills the first form and adds new forms
       *  - OR only adds new forms
       *
       * in both cases, the selected rows are added to the forms in the same order that
       * the rows were selected in the modal. As we are adding new forms, we copy the
       * values from the modalSelectedRows in the same index order
       **/
      const newRows = [...bulkForeignKeySelectedRows, ...modalSelectedRows]
      setBulkForeignKeySelectedRows(newRows);
    }

    // recordedit has already been initialized so start adding new forms
    const tempFormValues = methods.getValues();
    let initialValues = tempFormValues,
      startFormNumber: number;

    if (bulkForeignKeySelectionsFillFirstForm) {
      if (modalSelectedRows.length > 1) {
        initialValues = createNewForms(tempFormValues, modalSelectedRows.length - 1).tempFormValues;
      }

      startFormNumber = 1;

      setBulkForeignKeySelectionsFillFirstForm(false);
    } else {
      // use default values to fill new forms
      const newFormValues: number[] = addForm(modalSelectedRows.length);
      const newRowsModel = populateCreateInitialValues(columnModels, newFormValues, prefillObject, prefillRowData);
      const newValues = newRowsModel.values;

      foreignKeyData.current = {
        ...foreignKeyData.current,
        ...newRowsModel.foreignKeyData
      };

      // NOTE: should we call getPrefilledDefaultForeignKeyData here instead of checking the prefillObject?

      startFormNumber = newFormValues[0];
      newFormValues.forEach((formNumber: number) => {
        // copy values to object we want to use for RHF
        Object.keys(newValues).forEach((key: string) => {
          // we want to make sure we are only copying the data for newly created rows
          if (key.startsWith(`c_${formNumber}-`)) {
            initialValues[key] = newValues[key];
          }
        });

        initialValues = setOutboundForeignKeyValues(initialValues, formNumber, startFormNumber - 1, true);
      });
    }

    // iterate selectedRows to fill in the fkey information
    modalSelectedRows.forEach((row: SelectedRow, index: number) => {
      if (foreignKeyData && foreignKeyData.current) {
        foreignKeyData.current[`c_${startFormNumber + index}-${bulkFKObject.leafColumn.RID}`] = row.data;
      }

      // find the raw value of the fk columns that correspond to the selected row
      // since we've already added a not-null hidden filter, the values will be not-null.
      bulkFKObject.leafColumn.foreignKey.colset.columns.forEach((col: any) => {
        const referencedCol = bulkFKObject.leafColumn.foreignKey.mapping.get(col);

        // setFunction(`c_${formNumber}-${col.RID}`, selectedRow.data[referencedCol.name]);
        initialValues[`c_${startFormNumber + index}-${col.RID}`] = row.data[referencedCol.name];
      });

      // update "display" value
      initialValues[`c_${startFormNumber + index}-${bulkFKObject.leafColumn.RID}`] = row.displayname.value;
    });

    // required to set values in all new forms in the RHF model
    methods.reset(initialValues);
  };

  const sendMessageToCaller = (message: RecordeditNotifyActions) => {
    notifyParentPage({
      id: queryParams.invalidate,
      type: message
    })
  }

  const renderSpinner = () => {
    if (errors.length === 0 && (showDeleteSpinner || showSubmitSpinner || showCloneSpinner || showApplyAllSpinner)) {
      let spinnerClassName = 'submit-spinner';
      let spinnerMessage = 'Saving...';

      if (showDeleteSpinner) {
        spinnerClassName = 'delete-spinner';
        spinnerMessage = 'Deleting...';
      } else if (showCloneSpinner) {
        spinnerClassName = 'clone-spinner';
        spinnerMessage = 'Cloning...';
      } else if (showApplyAllSpinner) {
        spinnerClassName = 'apply-all-spinner';
        spinnerMessage = 'Updating Values...';
      }

      return (
        <div className='app-blocking-spinner-container'>
          <div className='app-blocking-spinner-backdrop'></div>
          <ChaiseSpinner
            className={spinnerClassName}
            message={spinnerMessage}
          />
        </div>
      )
    }
  };

  /**
   * on load:
   *   - Edit 25 <table> records
   *   - Edit <table>:<rowname>
   *   - Create <number> <table> record
   * on resultset view:
   *   - 18 <table> records {updated|created} successfully
   *   - 18/25 <table> records {updated|created} successfully
   */
  const renderTitle = () => {
    if (resultsetProps) {
      let count = resultsetProps.success.page.length;
      if (resultsetProps.failed) {
        count = `${count}/${resultsetProps.failed.page.length + count}`;
      }
      const recordTxt = resultsetProps.success.page.length > 1 ? 'records' : 'record';

      return (<>
        <span>{count} </span>
        <Title addLink reference={reference}
          link={appMode === appModes.EDIT ? reference.unfilteredReference.contextualize.compact.appLink : undefined} />
        <span> {recordTxt} {appMode === appModes.EDIT ? 'updated' : 'created'} successfully</span>
      </>);
    }

    const tableName = <Title addLink reference={reference} />;
    const fnStr = appMode === appModes.EDIT ? 'Edit' : 'Create';

    if (appMode === appModes.EDIT && tuples.length === 1) {
      return (<>Edit {tableName}: <Title displayname={tuples[0].displayname} /></>);
    }

    return (<>{fnStr} {forms.length.toString()} {tableName} {forms.length > 1 ? 'records' : 'record'}</>);
  };

  const renderSubmitButton = () => {
    const isModal = config.displayMode === RecordeditDisplayMode.POPUP;
    let tooltip = 'Waiting for some columns to properly load.';

    if (allFormDataLoaded) tooltip = isModal ? 'Save the current search criteria.' : 'Save this data on the server.';
    return (
      <ChaiseTooltip
        placement='bottom'
        tooltip={tooltip}
      >
        <button
          id={isModal ? 'modal-submit-record-btn' : 'submit-record-button'}
          className='chaise-btn chaise-btn-primary'
          type='submit'
          form='recordedit-form'
          disabled={!allFormDataLoaded}
        >
          <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
          <span>Save</span>
        </button>
      </ChaiseTooltip>
    )
  };

  const renderBulkDeleteButton = () => {
    if (!canShowBulkDelete) return;
    const tooltip = canEnableBulkDelete ? 'Delete the displayed set of records.' : 'None of the displayed records can be deleted.';
    return <ChaiseTooltip placement='bottom' tooltip={tooltip}>
      <button id='bulk-delete-button' className='chaise-btn chaise-btn-primary' onClick={onBulkDeleteButtonClick} disabled={!canEnableBulkDelete}>
        <span className='chaise-btn-icon fa-regular fa-trash-alt'></span>
        <span>Delete</span>
      </button>
    </ChaiseTooltip>
  };

  const renderBottomPanel = () => {
    return (<div className='bottom-panel-container'>
      {/* This is here so the spacing can be done in one place for all the apps */}
      <div className='side-panel-resizable close-panel'></div>
      {/* <!-- Form section --> */}
      <div className='main-container' ref={mainContainer}>
        {columnModels.length > 0 && !resultsetProps &&
          <div className='main-body'>
            <KeyColumn activeMultiForm={activeMultiForm} toggleActiveMultiForm={toggleActiveMultiForm} />
            <FormContainer activeMultiForm={activeMultiForm} toggleActiveMultiForm={toggleActiveMultiForm} />
          </div>
        }
        {resultsetProps &&
          <div className='resultset-tables chaise-accordions'>
            <Accordion alwaysOpen defaultActiveKey={['0', '1']} className='panel-group'>
              <Accordion.Item eventKey='0' className='chaise-accordion'>
                <Accordion.Button as='div'>
                  <ResultsetTableHeader
                    appMode={appMode} header={resultsetProps.success.header}
                    exploreLink={resultsetProps.success.exploreLink}
                    editLink={resultsetProps.success.editLink}
                  />
                </Accordion.Button>
                <Accordion.Body>
                  {resultsetProps.success.exploreLink &&
                    <div className='inline-tooltip inline-tooltip-lg'>
                      <p>
                        This table content displays user submitted values.
                        Use the <a href={resultsetProps.success.editLink}>Bulk Edit</a> button
                        to continue making changes to these entries,
                        or <a href={resultsetProps.success.exploreLink}>Explore</a> button
                        to navigate to the <code><Title reference={reference} comment={false} /></code> search page with these entries selected.
                      </p>
                    </div>
                  }
                  {/* Intersecting behaviour of scroll should be visible if there are multiple tables
                  on one page which here seems to be the case when there are successful as well as failed records */}
                  <ResultsetTable page={resultsetProps.success.page} showSingleScrollbar={!!resultsetProps.failed} />
                </Accordion.Body>
              </Accordion.Item>
              {resultsetProps.failed &&
                <Accordion.Item eventKey='1' className='chaise-accordion'>
                  <Accordion.Button as='div'>
                    <ResultsetTableHeader
                      appMode={appMode} header={resultsetProps.failed.header}
                      exploreLink={resultsetProps.failed.exploreLink}
                    />
                  </Accordion.Button>
                  <Accordion.Body><ResultsetTable page={resultsetProps.failed.page} showSingleScrollbar={!!resultsetProps.failed} /></Accordion.Body>
                </Accordion.Item>
              }
            </Accordion>
          </div>
        }
        {config.displayMode !== RecordeditDisplayMode.POPUP && <Footer />}
      </div>
    </div>)
  }

  const renderModals = () => {
    const deleteConfirmContext = tuples.length > 1 ? DeleteConfirmationModalTypes.BULK : DeleteConfirmationModalTypes.SINGLE;
    return (<>
      {showDeleteConfirmationModal &&
        <DeleteConfirmationModal
          show={!!showDeleteConfirmationModal}
          message={showDeleteConfirmationModal.message}
          buttonLabel={showDeleteConfirmationModal.buttonLabel}
          onConfirm={showDeleteConfirmationModal.onConfirm}
          onCancel={showDeleteConfirmationModal.onCancel}
          reference={showDeleteConfirmationModal.reference}
          context={deleteConfirmContext}
        />
      }
      {uploadProgressModalProps &&
        <UploadProgressModal
          show={!!uploadProgressModalProps}
          rows={uploadProgressModalProps.rows}
          linkedData={uploadProgressModalProps.linkedData}
          templateVariables={uploadProgressModalProps.templateVariables}
          onSuccess={uploadProgressModalProps.onSuccess}
          onCancel={uploadProgressModalProps.onCancel}
        />
      }
      {showBulkForeignKeyModal && bulkForeignKeyRecordsetProps &&
        <RecordsetModal
          modalClassName='bulk-foreign-key-popup'
          recordsetProps={bulkForeignKeyRecordsetProps}
          onSelectedRowsChanged={onBulkForeignKeyModalRowsChanged}
          onSubmit={submitBulkForeignKeyCB}
          onClose={closeBulkForeignKeyCB}
          displayname={reference.bulkCreateForeignKeyObject.leafColumn.displayname}
        />
      }
    </>);
  }

  // if the main data is not initialized, just show spinner
  if (!initialized) {
    if (errors.length > 0) {
      return <></>;
    }
    return <ChaiseSpinner />;
  }

  if (config.displayMode === RecordeditDisplayMode.POPUP) {
    /**
     * Popup differences:
     *  - <Modal> wraps all of recordedit app
     *  - <Modal.Header> does NOT include <Alerts>, they are part of modal body
     *  - <renderSubmitButton> has different tooltip and id
     *  - Close button
     *  - title is <h2> instead of <h1>
     *  - bulk delete, clone, reset controls not shown
     *
     * Since there are so many differences, Recordedit when shown in a modal has a very different "top panel"
     */
    return (
      <Modal
        className='create-saved-query'
        show={true}
        onHide={modalOptions?.onClose}
      >
        <div className='recordedit-container app-content-container'>
          {formProviderInitialized && <FormProvider {...methods}>
            {renderSpinner()}
            <Modal.Header>
              <div className='top-panel-container'>
                <div className='top-flex-panel'>
                  {/* NOTE: This is here so the spacing can be done in one place for all the apps */}
                  <div className='top-left-panel close-panel'></div>
                  <div className='top-right-panel'>
                    <div className='recordedit-title-container title-container meta-icons'>
                      <div className='saved-query-controls recordedit-title-buttons title-buttons'>
                        {renderSubmitButton()}
                        <ChaiseTooltip
                          placement='bottom'
                          tooltip='Close this popup.'
                        >
                          <button
                            className='chaise-btn chaise-btn-secondary pull-right modal-close' type='button'
                            onClick={() => modalOptions?.onClose()}
                          >
                            <strong className='chaise-btn-icon'>X</strong>
                            <span>Cancel</span>
                          </button>
                        </ChaiseTooltip>
                      </div>
                      {/* NOTE: Modal uses h2 */}
                      <h2 className='modal-title'>
                        {/* NOTE: currently only used for saved queries. Turn into configuration param if reused */}
                        <span>Save current search criteria for table </span>
                        <Title reference={modalOptions?.parentReference} />
                      </h2>
                      <div className='form-controls'>
                        {/* NOTE: required-info used in testing for reseting cursor position when testing tooltips */}
                        <span className='required-info'><span className='text-danger'><b>*</b></span> indicates required field</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Modal.Header>
            <Modal.Body>
              <Alerts />
              {renderBottomPanel()}
            </Modal.Body>
            {renderModals()}
          </FormProvider>}
        </div>
      </Modal>
    )
  }

  if (config.displayMode === RecordeditDisplayMode.VIEWER_ANNOTATION) {
    return (
      <>
        {formProviderInitialized && <FormProvider {...methods}>
          {/* the spinners are displayed in place in the viewer.tsx component */}
          <ViewerAnnotationFormContainer />
          {/*
            submit and delete button are added in the viewer.tsx comp
            - we cannot submit right away and we have to get the annotation file first.
            - delete expected behavior is different
          */}
          {renderModals()}
        </FormProvider>}
      </>
    )
  }

  return (
    <div className='recordedit-container app-content-container'>
      {formProviderInitialized && <FormProvider {...methods}>
        {renderSpinner()}
        <div className='top-panel-container'>
          {/* recordedit level alerts */}
          <Alerts />
          <div className='top-flex-panel'>
            {/* NOTE: This is here so the spacing can be done in one place for all the apps */}
            <div className='top-left-panel close-panel'></div>
            <div className='top-right-panel'>
              <div className='recordedit-title-container title-container meta-icons'>
                {!resultsetProps && <div className='recordedit-title-buttons title-buttons'>
                  {renderSubmitButton()}
                  {renderBulkDeleteButton()}
                </div>}
                <h1 id='page-title'>{renderTitle()}</h1>
              </div>
              {!resultsetProps && <div className='form-controls'>
                {/* NOTE: required-info used in testing for reseting cursor position when testing tooltips */}
                <span className='required-info'><span className='text-danger'><b>*</b></span> indicates required field</span>
                <div className='add-forms chaise-input-group'>
                  {appMode === appModes.EDIT ?
                    <ChaiseTooltip tooltip='Reload the page to show the initial forms.' placement='bottom-end'>
                      <button id='recordedit-reset' className='chaise-btn chaise-btn-secondary' onClick={onResetClick} type='button'>
                        <span className='chaise-btn-icon fa-solid fa-undo'></span>
                        <span>Reset</span>
                      </button>
                    </ChaiseTooltip>
                    :
                    <>
                      <div className='chaise-input-group'>
                        <span className='chaise-input-group-prepend'>
                          <div className='chaise-input-group-text chaise-input-group-text-sm'>Qty</div>
                        </span>
                        <input
                          id='copy-rows-input'
                          ref={copyFormRef}
                          type='number'
                          className='chaise-input-control chaise-input-control-sm add-rows-input'
                          placeholder='1'
                          min='1'
                          max='200'
                        />
                        <span className='chaise-input-group-append'>
                          <ChaiseTooltip
                            tooltip={
                              allFormDataLoaded ?
                                'Duplicate rightmost form the specified number of times.' :
                                'Waiting for some columns to properly load.'
                            }
                            placement='bottom-end'
                          >
                            <button
                              id='copy-rows-submit'
                              className='chaise-btn chaise-btn-sm chaise-btn-secondary center-block'
                              onClick={() => {
                                setShowCloneSpinner(true);
                                // adding setTimeout to allow the spinner to show before calling addForms
                                setTimeout(() => {
                                  setAddFormsEffect(true);
                                });
                              }}
                              type='button'
                              disabled={!allFormDataLoaded}
                            >
                              <span>Clone</span>
                            </button>
                          </ChaiseTooltip>
                        </span>
                      </div>
                      {bulkForeignKeyRecordsetProps &&
                        // only show bulk foreign key modal button if we started with a bulk foreing key picker
                        // bulkForeignKeyRecordsetProps only get set if there is a `reference.bulkCreateForeignKeyObject` defined when the recordedit app loads
                        <ChaiseTooltip
                          tooltip={`Select more ${reference.bulkCreateForeignKeyObject.leafColumn.displayname.value} for new forms`}
                          placement='bottom-end'
                        >
                          <button
                            id='recordedit-add-more'
                            className='chaise-btn chaise-btn-sm chaise-btn-secondary'
                            onClick={openBulkForeignKeyModal}
                            type='button'
                          >
                            <span className='chaise-btn-icon fa-solid fa-plus' />
                            <span>Add more</span>
                          </button>
                        </ChaiseTooltip>
                      }
                    </>
                  }
                </div>
              </div>}
            </div>
          </div>
        </div>
        {renderBottomPanel()}
        {renderModals()}
      </FormProvider>}
    </div>
  );
}

export default Recordedit;
