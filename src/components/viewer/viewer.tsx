import '@isrd-isi-edu/chaise/src/assets/scss/_viewer.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import SplitView from '@isrd-isi-edu/chaise/src/components/split-view';
import Title from '@isrd-isi-edu/chaise/src/components/title';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import { useEffect, useRef, useState } from 'react';
import useViewer from '@isrd-isi-edu/chaise/src/hooks/viewer';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { ViewerProps } from '@isrd-isi-edu/chaise/src/models/viewer';

// providers
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import ViewerProvider from '@isrd-isi-edu/chaise/src/providers/viewer';

// utils
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';

const Viewer = ({
  parentContainer = document.querySelector('#chaise-app-root') as HTMLElement,
  reference,
  logInfo,
  queryParams,
}: ViewerProps): JSX.Element => {
  return (
    <AlertsProvider>
      <ViewerProvider
        reference={reference}
        logInfo={logInfo}
        queryParams={queryParams}
      >
        <ViewerInner
          parentContainer={parentContainer}
        />
      </ViewerProvider>
    </AlertsProvider>
  )
};

type ViewerInnerProps = {
  parentContainer?: HTMLElement,
}

const ViewerInner = ({
  parentContainer,
}: ViewerInnerProps) => {

  const { errors } = useError();
  const {
    initialized, pageTitle,
    hideAnnotationSidebar, toggleAnnotationSidebar
   } = useViewer();


  const [displayIframe, setDisplayIframe] = useState(false);

  const mainContainer = useRef<HTMLDivElement>(null);


  // properly set scrollable section height
  useEffect(() => {
    if (!initialized) return;
    const resizeSensors = attachContainerHeightSensors(parentContainer);

    /**
     * fix the size of main-container and sticky areas, and then show the iframe.
     * these have to be done in a digest cycle after setting the displayReady.
     * Because this way, we will ensure to run the height logic after the page
     * content is visible and therefore it can set a correct height for the bottom-container.
     * otherwise the iframe will be displayed in a small box first.
     */
    setDisplayIframe(true);

    return () => {
      resizeSensors?.forEach((rs) => !!rs && rs.detach());
    }
  }, [initialized]);


  //------------------- UI related callbacks: --------------------//



  //-------------------  render logics:   --------------------//

  const renderAnnotaionsListContainer = (leftRef: React.RefObject<HTMLDivElement>) => (
    <div
      className={`side-panel-resizable resizable ${hideAnnotationSidebar ? 'open-panel' : 'close-panel'}`}
      ref={leftRef}
    >
      <div className='side-panel-container'>
        <div className='annotation-list-container'>
          Annotation list!
          {/* TODO stroke slider */}
          {/* TODO Display all/none */}
          {/* TODO Search box */}
          {/* TODO annotation list */}
        </div>
      </div>
    </div>
  );

  const renderMainContainer = () => (
    <div className='main-container dynamic-padding' ref={mainContainer}>
      <div className='main-body'>
        <iframe src='about:blank' id='osd-viewer-iframe' className={!displayIframe ? CLASS_NAMES.HIDDEN: ''}>
          &lt;p&gt;Your browser does not support iframes.&lt;/p&gt;
        </iframe>
        {/* displayIframe */}
      </div>
    </div>
  );

  /**
   * The left panels that should be resized together
   * This will take care of the resizing the modal header as well
   * implementation copied from components/recordset.tsx
   */
  const leftPartners: HTMLElement[] = [];
  parentContainer?.querySelectorAll('.top-left-panel').forEach((el) => {
    leftPartners.push(el as HTMLElement);
  });

  return (
    <>
    {!initialized && <ChaiseSpinner />}
    <div className={`viewer-container app-content-container ${!initialized ? CLASS_NAMES.HIDDEN: ''}`}>
      <div className='top-panel-container'>
        <Alerts />
        <div className='top-flex-panel'>
          <div
            className={`top-left-panel small-panel ${hideAnnotationSidebar ? 'open-panel' : 'close-panel'
              }`}
          >
            <div className='panel-header'>
              <div className='pull-left'>
                <h3 className='side-panel-heading'>Annotations</h3>
              </div>
            </div>
          </div>
          <div className={`top-right-panel${!pageTitle ? ' no-title' : ''}`}>
            {pageTitle &&
              <div className='title-container'>
                <DisplayValue
                  value={{isHTML: true, value: pageTitle}}
                  as='h1'
                  props={{'id': 'page-title'}}
                />
              </div>
            }
            {/* TODO menu buttons */}
          </div>
        </div>
      </div>
      <SplitView
        parentContainer={parentContainer}
        left={renderAnnotaionsListContainer}
        leftPartners={leftPartners}
        right={renderMainContainer}
        minWidth={200}
        maxWidth={40}
        // NOTE the following must have the same value as the one in css.
        // which is $left-panel-width-sm variable in _variables.scss
        initialWidth={15}
        className='bottom-panel-container'
        convertMaxWidth
        convertInitialWidth
      />
    </div>
    </>
  )

}

export default Viewer;
