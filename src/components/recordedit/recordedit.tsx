import '@isrd-isi-edu/chaise/src/assets/scss/_recordedit.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Columns from '@isrd-isi-edu/chaise/src/components/recordedit/columns';
import FormContainer from '@isrd-isi-edu/chaise/src/components/recordedit/form-container';
import Title from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

// utils
import { attachContainerHeightSensors, attachMainContainerPaddingSensor } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';


export type RecordeditProps = {
  initialized: boolean
  reference: any
}

const Recordedit = (props: RecordeditProps): JSX.Element => {

  const { initialized, reference } = props;

  // const { getValues, handleSubmit } = useFormContext();

  const parentContainer = document.querySelector('#chaise-app-root') as HTMLElement
  const mainContainer = useRef<HTMLDivElement>(null);

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

  // (reference.columns||[]).map(v => {
  //   console.log(v.type);
  // })
  console.log('record edit props:: ', props.reference.columns);

  const addForm = () => fireCustomEvent('add-form', '.form-container');

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
                {/* <button id='submit-record-button' className='chaise-btn chaise-btn-primary' type='submit' ng-disabled='form.submissionButtonDisabled || !displayReady' ng-click='::form.submit()' ng-attr-tooltip-placement='bottom-right' ng-attr-uib-tooltip='Save this data on the server'> */}
                {initialized && <button 
                  id='submit-record-button' 
                  className='chaise-btn chaise-btn-primary' 
                  type='submit' 
                  form='recordedit-form'
                  // onClick={
                  //   handleSubmit((data: any) => {
                  //     console.log('on submit')
                  //     console.log(data);
                  //     console.log(getValues());
                  //   })
                  // }
                >
                  <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
                  <span>Save</span>
                </button>}
              </div>
              <h1 id='page-title'>
                {/* <span>{{ form.editMode ? 'Edit ' : 'Create new ' }}</span> */}
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
                <input id='copy-rows-input' type='number' className='chaise-input-control chaise-input-control-sm add-rows-input' placeholder='1' min='1' />
                <span className='chaise-input-group-append'>
                  {/* <button id='copy-rows-submit' className='chaise-btn chaise-btn-sm chaise-btn-secondary center-block' onClick={addForm} ng-disabled='!form.canAddMore' type='button' tooltip-placement='bottom-right' uib-tooltip='Duplicate rightmost form the specified number of times.'> */}
                  <button id='copy-rows-submit' className='chaise-btn chaise-btn-sm chaise-btn-secondary center-block' onClick={addForm} type='button'>
                    <span>Clone</span>
                  </button>
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
