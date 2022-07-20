import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';

import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import RecordProvider from '@isrd-isi-edu/chaise/src/providers/record';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';
import { useEffect, useLayoutEffect, useState } from 'react';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Button from 'react-bootstrap/Button';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import RecordMainSection from '@isrd-isi-edu/chaise/src/components/record/record-main-section';
import RecordRelatedSection from '@isrd-isi-edu/chaise/src/components/record/record-related-section';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import Export from '@isrd-isi-edu/chaise/src/components/export';

/**
 * Record Action Types can be create, delete, copy, and edit
 */
export enum ACTION_TYPES {
  CREATE,
  DELETE,
  EDIT,
  COPY,
}

/**
 * Page Action Types can be create, delete, copy, and edit
 */
 export enum PAGE_ACTION_TYPES {
  SHOW_EMPTY,
  SHARE_CITE,
}

export type RecordProps = {
  reference: any;
};

const Record = ({ reference }: RecordProps): JSX.Element => {
  return (
    <AlertsProvider>
      <RecordProvider reference={reference}>
        <RecordInner />
      </RecordProvider>
    </AlertsProvider>
  );
};

const RecordInner = (): JSX.Element => {
  const { page, readMainEntity, reference } = useRecord();

  /**
   * State variable to show or hide side panel
   */
  const [showPanel, setShowPanel] = useState<boolean>(true);

  useEffect(() => {
    // get the data
    readMainEntity();
  }, []);

  useLayoutEffect(() => {
    attachContainerHeightSensors();
  });

  // TODO does this make sense?
  if (!page) {
    return <ChaiseSpinner />;
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
  };

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
  };

  /**
   * function to change state to show or hide side panel
   */
  const hidePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <div className='record-container app-content-container'>
      {/* TODO spinner was here with this: (!displayReady || showSpinner) && !error */}
      <div className='top-panel-container'>
        <Alerts />
        {/* TODO */}
        <div className='top-flex-panel'>
          <div
            className={`top-left-panel ${
              showPanel ? 'open-panel' : 'close-panel'
            }`}
          >
            <div className='panel-header'>
              <div className='pull-left'>
                <h3 className='side-panel-heading'>Sections</h3>
              </div>
              <div className='float-right'>
                <ChaiseTooltip
                  placement='top'
                  tooltip='Click to hide table of contents'
                >
                  <Button
                    className='chaise-btn chaise-btn-tertiary'
                    onClick={hidePanel}
                  >
                    <span className='chaise-btn-icon chaise-icon chaise-sidebar-close'></span>
                    Hide panel
                  </Button>
                </ChaiseTooltip>
              </div>
            </div>
          </div>
          <div className='top-right-panel'>
            <div className='page-action-btns'>
              <div className='float-right'>
                <ChaiseTooltip
                  placement='bottom-start'
                  tooltip='Click here to show empty related sections too.'
                >
                  <Button
                    className='chaise-btn chaise-btn-primary'
                    onClick={(event: any) =>
                      onPageAction(PAGE_ACTION_TYPES.SHOW_EMPTY, event)
                    }
                  >
                    <span className='chaise-btn-icon fa fa-th-list'></span>
                    Show empty sections
                  </Button>
                </ChaiseTooltip>
                <ChaiseTooltip
                  placement='bottom-start'
                  tooltip='Click here to show an export format'
                >
                  <Export
                    reference={null}
                    // TODO: it should also be disabled while loading
                    // disabled={isLoading || !page || page.length === 0}
                    disabled={false}
                  />
                </ChaiseTooltip>
                <ChaiseTooltip
                  placement='bottom-start'
                  tooltip='Click here to show the share dialog.'
                >
                  <Button
                    className='chaise-btn chaise-btn-primary'
                    onClick={(event: any) =>
                      onPageAction(PAGE_ACTION_TYPES.SHARE_CITE, event)
                    }
                  >
                    <span className='chaise-btn-icon fa fa-share-square'></span>
                    Share and cite
                  </Button>
                </ChaiseTooltip>
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

                    <div className='title-buttons record-action-btns-container'>
                      <ChaiseTooltip
                        placement='bottom-start'
                        tooltip='Click here to create a record.'
                      >
                        <Button
                          className='chaise-btn chaise-btn-primary'
                          onClick={(event: any) =>
                            onRecordAction(ACTION_TYPES.CREATE, event)
                          }
                        >
                          <span className='chaise-btn-icon fa fa-plus'></span>
                          Create
                        </Button>
                      </ChaiseTooltip>
                      <ChaiseTooltip
                        placement='bottom-start'
                        tooltip='Click here to create a copy of this record'
                      >
                        <Button
                          className='chaise-btn chaise-btn-primary'
                          onClick={(event: any) =>
                            onRecordAction(ACTION_TYPES.COPY, event)
                          }
                        >
                          <span className='chaise-btn-icon fa fa-clipboard'></span>
                          Copy
                        </Button>
                      </ChaiseTooltip>
                      <ChaiseTooltip
                        placement='bottom-start'
                        tooltip='Click here to edit this record'
                      >
                        <Button
                          className='chaise-btn chaise-btn-primary'
                          onClick={(event: any) =>
                            onRecordAction(ACTION_TYPES.EDIT, event)
                          }
                        >
                          <span className='chaise-btn-icon fa fa-pencil'></span>
                          Edit
                        </Button>
                      </ChaiseTooltip>
                      <ChaiseTooltip
                        placement='bottom-start'
                        tooltip='Click here to delete this record'
                      >
                        <Button
                          className='chaise-btn chaise-btn-primary'
                          onClick={(event: any) =>
                            onRecordAction(ACTION_TYPES.DELETE, event)
                          }
                        >
                          <span className='chaise-btn-icon fa fa-trash-alt'></span>
                          Delete
                        </Button>
                      </ChaiseTooltip>
                    </div>
                  </h1>
                  {!showPanel && (
                    <ChaiseTooltip
                      placement='top'
                      tooltip='Click to show table of contents'
                    >
                      <Button
                        onClick={hidePanel}
                        className='chaise-btn chaise-btn-tertiary show-toc-btn'
                      >
                        <span className='chaise-btn-icon chaise-icon chaise-sidebar-open'></span>
                        Show side panel
                      </Button>
                    </ChaiseTooltip>
                  )}
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
          className={`side-panel-resizable record-toc resizable ${
            showPanel ? 'open-panel' : 'close-panel'
          }`}
        >
          {/* TODO table of contents */}
          <div className='side-panel-container'>
              <div className='columns-container'>
                Table Content Goes here
              </div>
          </div>
        
        </div>
        <div
          className='main-container dynamic-padding'
        >
          <div className='main-body'>
            <RecordMainSection reference={reference} tuple={page.tuples[0]} />

            <RecordRelatedSection reference={reference} />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Record;
