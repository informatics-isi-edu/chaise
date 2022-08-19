import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Export from '@isrd-isi-edu/chaise/src/components/export';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import RecordMainSection from '@isrd-isi-edu/chaise/src/components/record/record-main-section';
import RecordRelatedSection from '@isrd-isi-edu/chaise/src/components/record/record-related-section';
import Title from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useEffect, useLayoutEffect, useState } from 'react';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

// providers
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordProvider from '@isrd-isi-edu/chaise/src/providers/record';

// utilities
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';

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
  const { page, readMainEntity, reference, initialized } = useRecord();

  /**
   * State variable to show or hide side panel
   */
  const [showPanel, setShowPanel] = useState<boolean>(true);

  // initialize the page
  useEffect(() => {
    readMainEntity().then((p: any) => {
      // send string to prepend to "headTitle" format: <table-name>: <row-name>
      const title = `${getDisplaynameInnerText(reference.displayname)}: ${getDisplaynameInnerText(p.tuples[0].displayname)}`;
      updateHeadTitle(title);
    }).catch(() => { /* the readMainEntity itself is calling the error handler */ });
  }, []);

  // properly set scrollable section height
  useLayoutEffect(() => {
    if (!initialized) return;
    const resizeSensors = attachContainerHeightSensors();

    return () => {
      resizeSensors?.forEach((rs) => rs.detach());
    }
  }, [initialized]);

  // TODO does this make sense?
  // we're currently showing the header buttons while loading
  // but I don't see the point and I think not showing anything makes more sense
  if (!page) {
    return <ChaiseSpinner />;
  }

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
            className={`top-left-panel ${showPanel ? 'open-panel' : 'close-panel'
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
                  <div
                    className='chaise-btn chaise-btn-tertiary'
                    onClick={hidePanel}
                  >
                    <span className='record-app-action-icon chaise-icon chaise-sidebar-close'></span>
                    Hide panel
                  </div>
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
                  <div className='chaise-btn chaise-btn-primary'>
                    <span className='record-app-action-icon  fa fa-th-list'></span>
                    Show empty sections
                  </div>
                </ChaiseTooltip>
                <Export reference={reference} disabled={false} />
                <ChaiseTooltip
                  placement='bottom-start'
                  tooltip='Click here to show the share dialog.'
                >
                  <div className='chaise-btn chaise-btn-primary'>
                    <span className='record-app-action-icon  fa fa-share-square'></span>
                    Share and cite
                  </div>
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
                        <div className='chaise-btn chaise-btn-primary'>
                          <span className='record-app-action-icon fa fa-plus'></span>
                          Create
                        </div>
                      </ChaiseTooltip>
                      <ChaiseTooltip
                        placement='bottom-start'
                        tooltip='Click here to create a copy of this record'
                      >
                        <div className='chaise-btn chaise-btn-primary'>
                          <span className='record-app-action-icon  fa fa-clipboard'></span>
                          Copy
                        </div>
                      </ChaiseTooltip>
                      <ChaiseTooltip
                        placement='bottom-start'
                        tooltip='Click here to edit this record'
                      >
                        <div className='chaise-btn chaise-btn-primary'>
                          <span className='record-app-action-icon  fa fa-pencil'></span>
                          Edit
                        </div>
                      </ChaiseTooltip>
                      <ChaiseTooltip
                        placement='bottom-start'
                        tooltip='Click here to delete this record'
                      >
                        <div className='chaise-btn chaise-btn-primary'>
                          <span className='record-app-action-icon fa fa-trash-alt'></span>
                          Delete
                        </div>
                      </ChaiseTooltip>
                    </div>
                  </h1>
                  {!showPanel && (
                    <ChaiseTooltip
                      placement='top'
                      tooltip='Click to show table of contents'
                    >
                      <div
                        onClick={hidePanel}
                        className='chaise-btn chaise-btn-tertiary show-toc-btn'
                      >
                        <span className='record-app-action-icon chaise-icon chaise-sidebar-open'></span>
                        Show side panel
                      </div>
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
          className={`side-panel-resizable record-toc resizable ${showPanel ? 'open-panel' : 'close-panel'
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
            {/* TODO there's no reason to have these two comps, needs discussion */}
            <RecordMainSection />
            <RecordRelatedSection />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Record;
