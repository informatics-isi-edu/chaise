import '@isrd-isi-edu/chaise/src/assets/scss/_recordedit.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DeleteConfirmationModal from '@isrd-isi-edu/chaise/src/components/modals/delete-confirmation-modal';
import KeyColumn from '@isrd-isi-edu/chaise/src/components/recordedit/key-column';
import FormContainer from '@isrd-isi-edu/chaise/src/components/recordedit/form-container';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import ResultsetTable from '@isrd-isi-edu/chaise/src/components/recordedit/resultset-table';
import ResultsetTableHeader from '@isrd-isi-edu/chaise/src/components/recordedit/resultset-table-header';
import Accordion from 'react-bootstrap/Accordion';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';
import { FormProvider, useForm } from 'react-hook-form';

// models
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';

// providers
import AlertsProvider, { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordeditProvider from '@isrd-isi-edu/chaise/src/providers/recordedit';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { attachContainerHeightSensors, attachMainContainerPaddingSensor } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { appModes, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { replaceNullOrUndefined } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';

export type RecordeditProps = {
  appMode: string;
  parentContainer?: HTMLElement;
  queryParams?: any;
  reference: any;
  /* The log related APIs */
  logInfo: {
    logAppMode?: string;
    /* the object that will be logged with the first request */
    logObject?: any;
    logStack: any;
    logStackPath: string;
  }
}

const Recordedit = ({
  appMode,
  parentContainer = document.querySelector('#chaise-app-root') as HTMLElement,
  queryParams,
  reference,
  logInfo
}: RecordeditProps): JSX.Element => {
  return (
    <AlertsProvider>
      <RecordeditProvider reference={reference} logInfo={logInfo} appMode={appMode} queryParams={queryParams}>
        <RecordeditInner parentContainer={parentContainer} />
      </RecordeditProvider>
    </AlertsProvider>
  )
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
    appMode, reference, page, tuples, foreignKeyData, columnModels, initialized, waitingForForeignKeyData,
    forms, addForm, removeForm, getInitialFormValues, getPrefilledDefaultForeignKeyData, MAX_ROWS_TO_ADD,
    showSubmitSpinner, resultsetProps,
  } = useRecordedit()

  const [formProviderInitialized, setFormProviderInitialized] = useState<boolean>(false)

  /**
   * the following are used for bulk delete feature
   */
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<{
    // when object is null, hide the modal
    // object is the props for the the modal
    onConfirm: () => void,
    onCancel: () => void,
    buttonLabel: string,
    message?: JSX.Element
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
   * form is ready when,
   * - form is not initialized
   * - we're waiting for foreignkey data of some columns.
   * after this, user can click on title buttons.
   */
  const allFormDataLoaded = initialized && !waitingForForeignKeyData;
  const canUpdateAtLeastOne = initialized && appMode === appModes.EDIT && tuples && tuples.some((t: any) => t.canUpdate);

  let saveButtonTooltip = 'Save this data on the server.';
  if (!canUpdateAtLeastOne) {
    saveButtonTooltip = 'You cannot update any of the displayed records.';
  }
  else if (!allFormDataLoaded) {
    saveButtonTooltip = 'Waiting for some columns to properly load.';
  }

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
        // TODO should be adjusted if we changed how we're tracking the tuples
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
          message: confirmMessage
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
        removeForm(removedForms);
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

    const initialValues = getInitialFormValues(forms, columnModels);
    methods.reset(initialValues);

    // in create mode, we need to fetch the foreignkey data
    // for prefilled and foreignkeys that have default values
    if (appMode === appModes.CREATE) {
      getPrefilledDefaultForeignKeyData(initialValues, methods.setValue);
    }

    setFormProviderInitialized(true)
  }, [initialized]);

  // properly set scrollable section height
  useEffect(() => {
    if (!formProviderInitialized) return;
    const resizeSensors = attachContainerHeightSensors(parentContainer);

    return () => {
      resizeSensors?.forEach((rs) => !!rs && rs.detach());
    }
  }, [formProviderInitialized]);

  // make sure the right padding is correct regardless of scrollbar being there or not
  useLayoutEffect(() => {
    if (!formProviderInitialized) return;
    const paddingSensor = attachMainContainerPaddingSensor(parentContainer);

    return () => { paddingSensor.detach(); }
  }, [formProviderInitialized]);

  const callAddForm = () => {
    // converts to number type. If NaN is returned, 1 is used instead
    const numberFormsToAdd: number = Number(copyFormRef.current?.value) || 1;

    // log the button was clicked
    // let action = LogActions.FORM_CLONE,
    //   stack = LogService.getStackObject();

    // if (numberFormsToAdd > 1) {
    //   action = LogActions.FORM_CLONE_X;
    //   stack = LogService.addExtraInfoToStack(null, { clone: numberFormsToAdd });
    // }

    // LogService.logClientAction({
    //   action: LogService.getActionString(action),
    //   stack: stack
    // }, reference.defaultLogInfo);

    // TODO: need access to # of forms
    // refactor so provider manages the forms
    const numberForms = forms.length;
    if ((numberFormsToAdd + numberForms) > MAX_ROWS_TO_ADD) {
      const alertMessage = `Cannot add ${numberFormsToAdd} records. Please input a value between 1 and ${MAX_ROWS_TO_ADD - numberForms}, inclusive.`;
      addAlert(alertMessage, ChaiseAlertType.ERROR);
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
        const colName = cm.column.name;
        // should be able to handle falsy values
        tempFormValues[`${formValue}-${colName}`] = replaceNullOrUndefined(tempFormValues[`${lastFormValue}-${colName}`], '');

        if (cm.column.type.name.indexOf('timestamp') !== -1) {
          tempFormValues[`${formValue}-${colName}-date`] = tempFormValues[`${lastFormValue}-${colName}-date`] || '';
          tempFormValues[`${formValue}-${colName}-time`] = tempFormValues[`${lastFormValue}-${colName}-time`] || '';
        }
      });

      // the code above is just copying the displayed rowname for foreignkeys,
      // we still need to copy the raw values
      // but we cannot go basd on visible columns since some of these data might be for invisible fks.
      reference.activeList.allOutBounds.forEach((col: any) => {
        // copy the foreignKeyData (used for domain-filter support in foreignkey-field.tsx)
        foreignKeyData.current[`${formValue}-${col.name}`] = simpleDeepCopy(foreignKeyData.current[`${lastFormValue}-${col.name}`]);

        // copy the raw data (submitted to ermrestjs)
        col.foreignKey.colset.columns.forEach((col: any) => {
          const val = tempFormValues[`${lastFormValue}-${col.name}`];
          if (val === null || val === undefined) return;
          tempFormValues[`${formValue}-${col.name}`] = val;
        });
      });
    }

    methods.reset(tempFormValues)
  };

  /**
   * on load:
   *   - Edit 25 <table> records
   *   - Edit 18/25 <table> records (7 disabled due to permission)
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
        {/* NOTE in Angularjs, in edit mode the link was based on the original link, both now it's always unfiltered */}
        <Title addLink reference={reference}
          link={appMode === appModes.EDIT ? reference.unfilteredReference.contextualize.compact.appLink : undefined} />
        <span> {recordTxt} {appMode === appModes.EDIT ? 'updated' : 'created'} successfully</span>
      </>);
    }

    const tableName = <Title addLink reference={reference} />;
    const fnStr = appMode === appModes.EDIT ? 'Edit' : 'Create';
    const recordStr = forms.length > 1 ? 'records' : 'record';

    let countStr: string = forms.length.toString();
    let dueToPerm = <></>;

    const numDisabled = tuples && tuples.length ? tuples.filter((t: any) => !t.canUpdate).length : 0;
    if (numDisabled !== 0) {
      countStr = `${forms.length - numDisabled}/${forms.length}`;
      dueToPerm = <small>({numDisabled} disabled due to permission)</small>;
    }

    if (appMode === appModes.EDIT && tuples.length === 1 && numDisabled === 0) {
      return (<>Edit {tableName}: <Title displayname={tuples[0].displayname} /></>);
    }

    return (<>{fnStr} {countStr} {tableName} {recordStr}{dueToPerm}</>);
  };

  return (
    <div className='recordedit-container app-content-container'>
      {formProviderInitialized && <FormProvider {...methods}>
        {errors.length === 0 && (showDeleteSpinner || showSubmitSpinner) &&
          <div className='app-blocking-spinner-container'>
            <div className='app-blocking-spinner-backdrop'></div>
            <ChaiseSpinner
              className={showSubmitSpinner ? 'submit-spinner' : 'delete-spinner'}
              message={showSubmitSpinner ? 'Saving...' : 'Deleting...'}
            />
          </div>
        }
        <div className='top-panel-container'>
          {/* recordset level alerts */}
          <Alerts />
          <div className='top-flex-panel'>
            {/* This is here so the spacing can be done in one place for all the apps */}
            <div className='top-left-panel close-panel'></div>
            <div className='top-right-panel'>
              <div className='recordedit-title-container title-container meta-icons'>
                {!resultsetProps && <div className='recordedit-title-buttons title-buttons'>
                  <ChaiseTooltip placement='bottom'  tooltip={saveButtonTooltip}>
                    <button
                      id='submit-record-button'
                      className='chaise-btn chaise-btn-primary'
                      type='submit'
                      form='recordedit-form'
                      disabled={!allFormDataLoaded || (appMode === appModes.EDIT && !canUpdateAtLeastOne)}
                    >
                      <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
                      <span>Save</span>
                    </button>
                  </ChaiseTooltip>
                  {canShowBulkDelete && <ChaiseTooltip placement='bottom' tooltip='Delete the displayed set of records.'>
                    <button className='chaise-btn chaise-btn-primary' onClick={onBulkDeleteButtonClick}>
                      <span className='chaise-btn-icon fa-regular fa-trash-alt'></span>
                      <span>Delete</span>
                    </button>
                  </ChaiseTooltip>}
                </div>}
                <h1 id='page-title'>{renderTitle()}</h1>
              </div>
              {!resultsetProps && <div className='form-controls'>
                <span><span className='text-danger'><b>*</b></span> indicates required field</span>
                <div className='add-forms chaise-input-group'>
                  {appMode === appModes.EDIT ?
                    <ChaiseTooltip tooltip='Reload the page to show the initial forms.' placement='bottom-end'>
                      <button className='chaise-btn chaise-btn-secondary' onClick={onResetClick} type='button'>
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
                            onClick={callAddForm}
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

        <div className='bottom-panel-container'>
          {/* This is here so the spacing can be done in one place for all the apps */}
          <div className='side-panel-resizable close-panel'></div>
          {/* <!-- Form section --> */}
          <div className='main-container' ref={mainContainer}>
            {columnModels.length > 0 && !resultsetProps &&
              <div id='form-section'>
                <KeyColumn />
                <FormContainer />
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
                        <div className='inline-tooltip'>
                          Table below is populated based on newly saved data and might not represent all the information.
                          Use the Edit or Explore button to navigate to the
                          {appMode === appModes.EDIT ? ' updated' : ' created'}
                          {resultsetProps.success.page.length > 0 ? ' records' : 'record'}.
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
          </div>
        </div>
        {showDeleteConfirmationModal &&
          <DeleteConfirmationModal
            show={!!showDeleteConfirmationModal}
            message={showDeleteConfirmationModal.message}
            buttonLabel={showDeleteConfirmationModal.buttonLabel}
            onConfirm={showDeleteConfirmationModal.onConfirm}
            onCancel={showDeleteConfirmationModal.onCancel}
          />
        }
      </FormProvider>}
    </div>
  );
}

export default Recordedit;
