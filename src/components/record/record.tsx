import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';

import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import RecordProvider from '@isrd-isi-edu/chaise/src/providers/record';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';
import { useEffect, useState } from 'react';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Button from 'react-bootstrap/Button';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import RecordMainSection from '@isrd-isi-edu/chaise/src/components/record/record-main-section';
import RecordRelatedSection from '@isrd-isi-edu/chaise/src/components/record/record-related-section';
import RecordActionButtons, { ACTION_TYPES } from '@isrd-isi-edu/chaise/src/components/record/record-action-buttons';
import RecordPageActionButtons, { PAGE_ACTION_TYPES } from '@isrd-isi-edu/chaise/src/components/record/record-page-action-buttons';


export type RecordProps = {
  reference: any
}

const Record = ({
  reference
}: RecordProps): JSX.Element => {
  return (
    <AlertsProvider>
      <RecordProvider
        reference={reference}
      >
        <RecordInner />
      </RecordProvider>
    </AlertsProvider>
  )
};

const RecordInner = () : JSX.Element => {
  const { page, readMainEntity, reference } = useRecord();

  /**
   * State variable to show or hide side panel
   */
  const [ showPanel, setShowPanel ] = useState<boolean>(true);

  useEffect(() => {
    // get the data
    readMainEntity();
  }, []);

  // TODO does this make sense?
  if (!page) {
    return <ChaiseSpinner/>
  }

  /**
   * Function is triggered after clicking on of the action buttons
   * @param type takes in one of action type (edit, create, copy, delete)
   * @param event on click event 
   */
  const onRecordAction = (type: ACTION_TYPES, event: any) => {
    if (type === ACTION_TYPES.CREATE) {
      console.log('create', event);
    } else if (type === ACTION_TYPES.EDIT) {
      console.log('edit', event);
    } else if (type === ACTION_TYPES.COPY) {
      console.log('copy', event);
    } else if (type === ACTION_TYPES.DELETE) {
      console.log('delete', event);
    }
  }

  /**
   * Function is triggered after clicking on of the page action buttons
   * @param type takes in one of action type (show empty sections, share and cite)
   * @param event on click event 
   */
  const onPageAction = (type: PAGE_ACTION_TYPES, event: any) => {
    if (type === PAGE_ACTION_TYPES.SHOW_EMPTY) {
      console.log('show empty', event);
    } else if (type === PAGE_ACTION_TYPES.SHARE_CITE) {
      console.log('share and cite', event);
    }
  }

  /**
   * function to change state to show or hide side panel
   */
  const hidePanel = () => {
    setShowPanel(!showPanel);
  }

  return (
    <div className='record-container app-content-container'>
      {/* TODO spinner was here with this: (!displayReady || showSpinner) && !error */}
      <div className='top-panel-container'>
        <Alerts/>
        {/* TODO */}
        <div className='top-flex-panel'>
          <div className={`top-left-panel ${showPanel ? 'open-panel' : 'close-panel'}`}>
            <div className='panel-header'>
              <div className='pull-left'>
                <h3 className='side-panel-heading'>
                  Sections
                </h3>
              </div>
              <div className='pull-right'>
                <Button className='chaise-btn chaise-btn-tertiary' onClick={hidePanel}>
                <span className='chaise-btn-icon chaise-icon chaise-sidebar-close'></span>
                  Hide panel
                </Button>
              </div>
            </div> 
          </div>
          <div className='top-right-panel'>
            <div className='page-action-btns'>
              <div className='pull-right'>

                <RecordPageActionButtons 
                  onAction={onPageAction}
                />

              </div>
            </div>
            <div className='title'>
              <div className='entity-display-header'>
                <div className='title-container'>
                  <h1 id='page-title'>
                    
                    <Title 
                      addLink={true} 
                      reference={reference} 
                      displayname={reference.displayname}
                    />
                    <span>: </span>
                    <DisplayValue value={page.tuples[0].displayname} />

                    <RecordActionButtons 
                      onAction={onRecordAction}
                    />

                  </h1>
                  {!showPanel && <Button onClick={hidePanel} className='chaise-btn chaise-btn-tertiary show-toc-btn'>
                    <span className='chaise-btn-icon chaise-icon chaise-sidebar-open'></span>
                    Show side panel
                  </Button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* TODO eventually split-view should be used here as well */}
      <div className='bottom-panel-container'>
        <div 
          id='record-side-pan' 
          className={`side-panel-resizable record-toc resizable ${showPanel ? 'open-panel' : 'close-panel'}`}>
            {/* TODO table of contents */}
            Table Content Goes here
        </div>
        <div className='main-container dynamic-padding'>
          <div className='main-body'>
            <RecordMainSection 
              reference={reference}
              tuple={page.tuples[0]}
            />
            
            <RecordRelatedSection 
              reference={reference}
              tuple={page.tuples[0]}
            />
          </div>
        </div>
      </div>
    </div>
  )
};

export default Record;


