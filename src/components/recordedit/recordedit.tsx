import '@isrd-isi-edu/chaise/src/assets/scss/_recordedit.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Columns from '@isrd-isi-edu/chaise/src/components/recordedit/columns';
import FormContainer from '@isrd-isi-edu/chaise/src/components/recordedit/form-container';
import Title from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useEffect, useLayoutEffect, useRef } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';

// providers
import AlertsProvider, { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordeditProvider from '@isrd-isi-edu/chaise/src/providers/recordedit';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { attachContainerHeightSensors, attachMainContainerPaddingSensor } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

export type RecordeditProps = {
  parentContainer?: HTMLElement;
  reference: any;
}

const Recordedit = ({
  parentContainer = document.querySelector('#chaise-app-root') as HTMLElement,
  reference
}: RecordeditProps): JSX.Element => {
  return (
    <AlertsProvider>
      <RecordeditProvider reference={reference}>
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
  const { initialized, reference, MAX_ROWS_TO_ADD } = useRecordedit()

  const mainContainer = useRef<HTMLDivElement>(null);
  const copyFormRef = useRef<HTMLInputElement>(null);

  // properly set scrollable section height
  useEffect(() => {
    if (!initialized) return;
    const resizeSensors = attachContainerHeightSensors(parentContainer);

    return () => {
      resizeSensors?.forEach((rs) => !!rs && rs.detach());
    }
  }, [initialized]);

  // make sure the right padding is correct regardless of scrollbar being there or not
  useLayoutEffect(() => {
    if (!initialized) return;
    const paddingSensor = attachMainContainerPaddingSensor(parentContainer);

    return () => { paddingSensor.detach(); }
  }, [initialized]);

  const addForm = () => {
    const numberFormstoAdd = copyFormRef.current?.value  || 1;

    // log the button was clicked
    // let action = LogActions.FORM_CLONE,
    //   stack = LogService.getStackObject();

    // if (numberFormstoAdd > 1) {
    //   action = LogActions.FORM_CLONE_X;
    //   stack = LogService.addExtraInfoToStack(null, { clone: numberFormstoAdd });
    // }

    // LogService.logClientAction({
    //   action: LogService.getActionString(action),
    //   stack: stack
    // }, reference.defaultLogInfo);

    // TODO: need access to # of forms
    // refactor so provider manages the forms
    const numberForms = 1;
    if ((numberFormstoAdd as number + numberForms) > MAX_ROWS_TO_ADD) {
      const alertMessage = `Cannot add ${numberFormstoAdd} records. Please input a value between 1 and ${MAX_ROWS_TO_ADD - numberForms}, inclusive.`;
      addAlert(alertMessage, ChaiseAlertType.ERROR);
      return true;
    }

    fireCustomEvent('add-form', '.form-container', { count: numberFormstoAdd });
  }

  return (
    <div className='recordedit-container app-content-container'>
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
                {initialized && <button
                  id='submit-record-button'
                  className='chaise-btn chaise-btn-primary'
                  type='submit'
                  form='recordedit-form'
                  onClick={
                    () => {
                      console.log('submit each form')
                    }
                  }
                >
                  <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
                  <span>Save</span>
                </button>}
              </div>
              <h1 id='page-title'>
                {/* TODO: edit mode
                          <span>{{ form.editMode ? 'Edit ' : 'Create new ' }}</span> 
                          */}
                <span>Create new </span>
                <Title addLink={true} reference={reference}></Title>
                {/* <span ng-if='displayname'>:
                  <chaise-title displayname='displayname'></chaise-title>
                </span> */}
              </h1>
            </div>
            <div className='form-controls'>
              <span><span className='text-danger'><b>*</b></span> indicates required field</span>
              {/* if not edit mode */}
              <div className='add-forms chaise-input-group'>
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
                      onClick={addForm}
                      type='button'
                    >
                      <span>Clone</span>
                    </button>
                  </ChaiseTooltip>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='bottom-panel-container'>
        {/* This is here so the spacing can be done in one place for all the apps */}
        <div className='side-panel-resizable close-panel'></div>
        {/* <!-- Form section --> */}
        <div id='form-section' className='main-container' ref={mainContainer}>
          <Columns columns={reference.columns} />
          <FormContainer columns={reference.columns} />
        </div>
      </div>
    </div>
  );
}

export default Recordedit;
