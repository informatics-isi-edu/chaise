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
import Recordset from '@isrd-isi-edu/chaise/src/components/recordset/recordset';
import ResultsetTable from '@isrd-isi-edu/chaise/src/components/recordedit/resultset-table';
import ResultsetTableHeader from '@isrd-isi-edu/chaise/src/components/recordedit/resultset-table-header';
import Spinner from 'react-bootstrap/Spinner';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import UploadProgressModal from '@isrd-isi-edu/chaise/src/components/modals/upload-progress-modal';

// hooks
import { useEffect, useRef, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';
import { FormProvider, useForm } from 'react-hook-form';
import ViewerAnnotationFormContainer from '@isrd-isi-edu/chaise/src/components/recordedit/viewer-annotation-form-container';

// models
import { LogActions, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import {
  appModes, RecordeditAppState, RecordeditColumnModel,
  RecordeditDisplayMode, RecordeditProps
} from '@isrd-isi-edu/chaise/src/models/recordedit';
import {
  RecordsetConfig, RecordsetDisplayMode,
  RecordsetProps, RecordsetSelectMode, SelectedRow
} from '@isrd-isi-edu/chaise/src/models/recordset';

// providers
import AlertsProvider, { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordeditProvider from '@isrd-isi-edu/chaise/src/providers/recordedit';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { RECORDSET_DEFAULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { copyOrClearValue, getPrefillObject } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
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
      <RecordeditInner parentContainer={parentContainer} />
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
}

const RecordeditInner = ({
  parentContainer
}: RecordeditInnerProps): JSX.Element => {

  const { validateSessionBeforeMutation } = useAuthn();
  const { errors, dispatchError } = useError();
  const { addAlert } = useAlert();
  const {
    appMode, appState, columnModels, config, foreignKeyData, initialized, modalOptions, queryParams, reference, tuples, waitingForForeignKeyData,
    addForm, getInitialFormValues, getPrefilledDefaultForeignKeyData, forms, MAX_ROWS_TO_ADD, removeForm, setAppState,
    showCloneSpinner, setShowCloneSpinner, showApplyAllSpinner, showSubmitSpinner, resultsetProps, uploadProgressModalProps, logRecordeditClientAction
  } = useRecordedit()

  const [showBreadcrumb, setShowBreadcrumb] = useState<boolean>(false);
  const [associationRecordsetProps, setAssociationRecordsetProps] = useState<RecordsetProps | null>(null);
  const [selectedRowsSubmitted, setSelectedRowsSubmitted] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const [formProviderInitialized, setFormProviderInitialized] = useState<boolean>(false);
  const [addFormsEffect, setAddFormsEffect] = useState<boolean>(false);

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

  const canShowBulkDelete = appMode === appModes.EDIT && ConfigService.chaiseConfig.deleteRecord === true;
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
          const idx = tuples.findIndex(function (tuple: any) {
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

  // once data is fetched, initialize the form data with react hook form
  useEffect(() => {
    if (!initialized) return;

    // `hasUniqueAssociation` is set right before `initialized` is set in the provider
    console.log('initialized', appState);
    if (appState === RecordeditAppState.ASSOCIATION_PICKER) {
      setShowBreadcrumb(true);

      let mainRef: any;
      let domainRef: any;
      reference.columns.forEach((column: any) => {
        if (!column.isForeignKey) return;

        const prefillObject = getPrefillObject(queryParams);
        if (prefillObject && prefillObject.fkColumnNames.indexOf(column.name) !== -1) {
          mainRef = column.reference;
          return;
        }

        domainRef = column.reference;
      });
      if (!domainRef) {
        setSelectedRowsSubmitted(true);
        return;
      }

      // TODO: createFacets blob
      const modalReference = domainRef.unfilteredReference.contextualize.compactSelectAssociationLink;

      const recordsetConfig: RecordsetConfig = {
        viewable: false,
        editable: false,
        deletable: false,
        sortable: true,
        selectMode: RecordsetSelectMode.MULTI_SELECT,
        showFaceting: true,
        disableFaceting: false,
        // TODO: should a new case be added?
        displayMode: RecordsetDisplayMode.RE_ASSOCIATION,
      };

      const stackElement = LogService.getStackNode(
        LogStackTypes.RELATED,
        domainRef.table,
        { source: domainRef.compressedDataSource, entity: true, picker: 1 }
      );

      const logInfo = {
        logObject: null,
        logStack: [stackElement],
        // logStack: getRecordLogStack(stackElement),
        logStackPath: LogService.getStackPath(null, LogStackPaths.ADD_PB_POPUP),
      };

      // set recordset select view then set selected rows on "submit"
      setAssociationRecordsetProps({
        initialReference: modalReference,
        initialPageLimit: modalReference.display.defaultPageSize
          ? modalReference.display.defaultPageSize
          : RECORDSET_DEFAULT_PAGE_SIZE,
        config: recordsetConfig,
        logInfo: logInfo,
        parentReference: mainRef
        // getDisabledTuples
      });
    } else {
      setSelectedRowsSubmitted(true);
    }
  }, [initialized]);

  const onSelectedRowsChanged = (selectedRows: SelectedRow[]) => {
    setSelectedRows(selectedRows);
    
    // allow the selected rows to change and UI shows the selected
    return true;
  };

  useEffect(() => {
    // selectedRowsSubmitted is initialized to false and set to true once we have rows selected that are submitted (or row selection is not needed)
    if (!selectedRowsSubmitted) return;

    const initialValues = getInitialFormValues(forms, columnModels);
    methods.reset(initialValues);

    // in create mode, we need to fetch the foreignkey data
    // for prefilled and foreignkeys that have default values
    if (appMode === appModes.CREATE) {
      getPrefilledDefaultForeignKeyData(initialValues, methods.setValue);
    }

    // iterate selected rows and push the data into the fields
    if (selectedRows.length > 0) {

    }

    setAppState(RecordeditAppState.FORM_INPUT);
    setFormProviderInitialized(true);
  }, [selectedRowsSubmitted]);

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
      const alertMessage = `Cannot add ${numberFormsToAdd} records. Please input a value between 1 and ${MAX_ROWS_TO_ADD - numberForms}, inclusive.`;
      addAlert(alertMessage, ChaiseAlertType.ERROR);
      setShowCloneSpinner(false);
      return true;
    }

    // the indices used for tracking input values in react-hook-form
    const newFormValues: number[] = addForm(numberFormsToAdd);

    // the index for the data from last form being cloned
    const lastFormValue = newFormValues[0] - 1;

    const tempFormValues: any = methods.getValues();
    // add data to tempFormValues to initailize new forms
    for (let i = 0; i < newFormValues.length; i++) {
      const formValue = newFormValues[i];
      columnModels.forEach((cm: RecordeditColumnModel) => {
        copyOrClearValue(cm, tempFormValues, foreignKeyData.current, formValue, lastFormValue, false, true);
      });

      // the code above is just copying the displayed rowname for foreignkeys,
      // we still need to copy the raw values
      // but we cannot go basd on visible columns since some of these data might be for invisible fks.
      reference.activeList.allOutBounds.forEach((col: any) => {
        // copy the foreignKeyData (used for domain-filter support in foreignkey-field.tsx)
        foreignKeyData.current[`c_${formValue}-${col.RID}`] = simpleDeepCopy(foreignKeyData.current[`c_${lastFormValue}-${col.RID}`]);

        // copy the raw data (submitted to ermrestjs)
        col.foreignKey.colset.columns.forEach((col: any) => {
          const val = tempFormValues[`c_${lastFormValue}-${col.RID}`];
          if (val === null || val === undefined) return;
          tempFormValues[`c_${formValue}-${col.RID}`] = val;
        });
      });
    }

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
    methods.reset(tempFormValues);
  };

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

  const renderBreadcrumb = () => {
    if (appState === RecordeditAppState.ASSOCIATION_PICKER) {
      return (<h2 style={{color: '#4674a7'}}>
        <span><b>1. Select Rows</b></span>{' > '}
        <span>2. Input Values</span>
      </h2>)
    }

    if (appState === RecordeditAppState.FORM_INPUT) {
      return(
        <h2 style={{color: '#4674a7'}}>
          <span>1. Select Rows</span>{' > '}
          <span><b>2. Input Values</b></span>
        </h2>
      )
    }

    // should be RESULTSET state
    return(
      <h2 style={{color: '#4674a7'}}>
        <span>1. Select Rows</span>{' > '}
        <span>2. Input Values</span>{' > '}
        <span><b>3. Resultset</b></span>
      </h2>
    )
  }

  const renderBottomPanel = () => {
    return (<div className='bottom-panel-container'>
      {/* This is here so the spacing can be done in one place for all the apps */}
      <div className='side-panel-resizable close-panel'></div>
      {/* <!-- Form section --> */}
      <div className='main-container' ref={mainContainer}>
        {appState === RecordeditAppState.FORM_INPUT && columnModels.length > 0 &&
          <div className='main-body'>
            <KeyColumn activeMultiForm={activeMultiForm} toggleActiveMultiForm={toggleActiveMultiForm} />
            <FormContainer activeMultiForm={activeMultiForm} toggleActiveMultiForm={toggleActiveMultiForm} />
          </div>
        }
        {appState === RecordeditAppState.RESULTSET && resultsetProps &&
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
                  <ResultsetTable page={resultsetProps.success.page} />
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
                  <Accordion.Body><ResultsetTable page={resultsetProps.failed.page} /></Accordion.Body>
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
          onSuccess={uploadProgressModalProps.onSuccess}
          onCancel={uploadProgressModalProps.onCancel}
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
      {appState === RecordeditAppState.ASSOCIATION_PICKER && associationRecordsetProps &&
        <>
          <div style={{marginLeft: '20px', marginRight: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              {renderBreadcrumb()}
              <ChaiseTooltip
                placement='bottom'
                tooltip={'Continue to form input with selected rows'}
                // onToggle={(nextShow: boolean) => (setShowSubmitTooltip(nextShow && !(disableSubmit || showSubmitSpinner)))}
                // show={showSubmitTooltip && !(disableSubmit || showSubmitSpinner)}
              >
                <button
                  id='multi-select-submit-btn' className='chaise-btn chaise-btn-primary'
                  type='button' onClick={() => setSelectedRowsSubmitted(true)}
                  disabled={selectedRows.length === 0}
                >
                  {/* {!showSubmitSpinner && <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>}
                  {showSubmitSpinner && <span className='chaise-btn-icon'><Spinner animation='border' size='sm' /></span>} */}
                  <span>Continue</span>
                </button>
              </ChaiseTooltip>
            </div>
          </div>
          <Recordset {...associationRecordsetProps} onSelectedRowsChanged={onSelectedRowsChanged} />
        </>
      }
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
                {appState === RecordeditAppState.FORM_INPUT && <div className='recordedit-title-buttons title-buttons'>
                  {renderSubmitButton()}
                  {renderBulkDeleteButton()}
                </div>}
                {renderBreadcrumb()}
                <h1 id='page-title'>{renderTitle()}</h1>
              </div>
              {appState === RecordeditAppState.FORM_INPUT && <div className='form-controls'>
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
                              setAddFormsEffect(true);
                            }}
                            type='button'
                            disabled={!allFormDataLoaded}
                          >
                            <span>Clone</span>
                          </button>
                        </ChaiseTooltip>
                      </span>
                    </div>
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
