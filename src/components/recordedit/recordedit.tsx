import '@isrd-isi-edu/chaise/src/assets/scss/_recordedit.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import KeyColumn from '@isrd-isi-edu/chaise/src/components/recordedit/key-column';
import ChaiseFormContainer from '@isrd-isi-edu/chaise/src/components/recordedit/form-container';
import Title from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';
import { FormProvider, useForm } from 'react-hook-form';

// models
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';

// providers
import AlertsProvider, { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordeditProvider from '@isrd-isi-edu/chaise/src/providers/recordedit';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { attachContainerHeightSensors, attachMainContainerPaddingSensor } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { appModes, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

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

  const { addAlert } = useAlert();
  const {
    appMode, reference, page, columnModels, initialized,
    forms, addForm, getInitialFormValues, MAX_ROWS_TO_ADD
  } = useRecordedit()

  const [formProviderInitialized, setFormProviderInitialized] = useState<boolean>(false)

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

  // once data is fetched, initialize the form data with react hook form
  useEffect(() => {
    if (!initialized) return;
    methods.reset(getInitialFormValues(forms, columnModels));

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
    const newFormIndexValues: number[] = addForm(numberFormsToAdd);

    // the index for the data from last form being cloned
    const lastFormIdx = newFormIndexValues[0] - 1;

    const tempFormValues: any = methods.getValues();
    // add data to tempFormValues to initailize new forms
    for (let i = 0; i < newFormIndexValues.length; i++) {
      const formIndex = newFormIndexValues[i];
      columnModels.forEach((cm: RecordeditColumnModel) => {
        const colName = cm.column.name;
        tempFormValues[`${formIndex}-${colName}`] = tempFormValues[`${lastFormIdx}-${colName}`] || '';

        if (cm.column.type.name.indexOf('timestamp') !== -1) {
          tempFormValues[`${formIndex}-${colName}-date`] = tempFormValues[`${lastFormIdx}-${colName}-date`] || '';
          tempFormValues[`${formIndex}-${colName}-time`] = tempFormValues[`${lastFormIdx}-${colName}-time`] || '';
        }
      });
    }

    methods.reset(tempFormValues)
  }

  return (
    <div className='recordedit-container app-content-container'>
      {formProviderInitialized && <FormProvider {...methods}>
        <div className='top-panel-container'>
          {/* recordset level alerts */}
          <Alerts />
          <div className='top-flex-panel'>
            {/* This is here so the spacing can be done in one place for all the apps */}
            <div className='top-left-panel close-panel'></div>
            <div className='top-right-panel'>
              <div className='recordedit-title-container title-container meta-icons'>
                <div className='recordedit-title-buttons title-buttons'>
                  {/* TODO: proper submission workflow, submission disabled, tooltip,
                          ng-disabled='form.submissionButtonDisabled || !displayReady'
                          ng-click='::form.submit()'
                          ng-attr-tooltip-placement='bottom-right'
                          ng-attr-uib-tooltip='Save this data on the server'>
                          */}
                  <button
                    id='submit-record-button'
                    className='chaise-btn chaise-btn-primary'
                    type='submit'
                    form='recordedit-form'
                  >
                    <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
                    <span>Save</span>
                  </button>
                </div>
                <h1 id='page-title'>
                  <span>{appMode === appModes.EDIT ? 'Edit ' : 'Create new '}</span>
                  <Title addLink={true} reference={reference}></Title>{page?.tuples.length === 1 ? ': ' : ''}
                  {page?.tuples.length === 1 && <Title displayname={page.tuples[0].displayname}></Title>}
                </h1>
              </div>
              <div className='form-controls'>
                <span><span className='text-danger'><b>*</b></span> indicates required field</span>
                {appMode !== appModes.EDIT && <div className='add-forms chaise-input-group'>
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
                    {/* TODO: if any of the columns is showing spinner, that means it's waiting for some
                            data and therefore we should just disable the addMore button.
                            ng-disabled='!form.canAddMore'
                            */}
                    <ChaiseTooltip tooltip='Duplicate rightmost form the specified number of times.' placement='bottom-end'>
                      <button
                        id='copy-rows-submit'
                        className='chaise-btn chaise-btn-sm chaise-btn-secondary center-block'
                        onClick={callAddForm}
                        type='button'
                      >
                        <span>Clone</span>
                      </button>
                    </ChaiseTooltip>
                  </span>
                </div>}
              </div>
            </div>
          </div>
        </div>

        <div className='bottom-panel-container'>
          {/* This is here so the spacing can be done in one place for all the apps */}
          <div className='side-panel-resizable close-panel'></div>
          {/* <!-- Form section --> */}
          {columnModels.length > 0 &&
            <div id='form-section' className='main-container' ref={mainContainer}>
              <KeyColumn />
              <ChaiseFormContainer />
            </div>
          }
        </div>
      </FormProvider>}
    </div>
  );
}

export default Recordedit;
