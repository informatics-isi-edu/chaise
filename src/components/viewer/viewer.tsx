import '@isrd-isi-edu/chaise/src/assets/scss/_viewer.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import SplitView from '@isrd-isi-edu/chaise/src/components/split-view';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Recordedit from '@isrd-isi-edu/chaise/src/components/recordedit/recordedit';
import ViewerAnnotationList from '@isrd-isi-edu/chaise/src/components/viewer/viewer-annotation-list';
import ViewerAnnotationStrokeSlider from '@isrd-isi-edu/chaise/src/components/viewer/viewer-annotation-stroke-slider';
import ConfirmationModal from '@isrd-isi-edu/chaise/src/components/modals/confirmation-modal';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ViewerMenuButtons from '@isrd-isi-edu/chaise/src/components/viewer/viewer-menu-buttons';
import DeleteConfirmationModal from '@isrd-isi-edu/chaise/src/components/modals/delete-confirmation-modal';

// hooks
import { useEffect, useRef, useState } from 'react';
import useViewer from '@isrd-isi-edu/chaise/src/hooks/viewer';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { ViewerProps, ViewerZoomFunction } from '@isrd-isi-edu/chaise/src/models/viewer';
import { appModes } from '@isrd-isi-edu/chaise/src/models/recordedit';

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

  const {
    initialized, pageTitle, hideAnnotationSidebar, annotationFormProps, showAnnotationFormSpinner, loadingAnnotations,
    submitAnnotationForm, deleteAnnotationConfirmProps, startAnnotationDelete,
    displayDrawingRequiredError, closeAnnotationForm, isInDrawingMode, toggleDrawingMode
  } = useViewer();


  const [displayIframe, setDisplayIframe] = useState(false);

  const [showCloseConfirmationModal, setShowCloseConfirmationModal] = useState(false);

  const mainContainer = useRef<HTMLDivElement>(null);
  const iframeElement = useRef<HTMLIFrameElement>(null);


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

  const onConfirmCloseAnnotationForm = () => {
    setShowCloseConfirmationModal(false);
    closeAnnotationForm();
  }

  //-------------------  render logics:   --------------------//
  /**
   * The left panels that should be resized together
   * This will take care of the resizing the modal header as well
   * implementation copied from components/recordset.tsx
   */
  const leftPartners: HTMLElement[] = [];
  parentContainer?.querySelectorAll('.top-left-panel').forEach((el) => {
    leftPartners.push(el as HTMLElement);
  });

  const showAnnotationForm = !!annotationFormProps;

  let sidePanelTitle = 'Annotations';
  if (showAnnotationForm) {
    sidePanelTitle = annotationFormProps.appMode === appModes.EDIT ? 'Edit annotation' : 'Create annotation';
  }

  const panelClassName = !hideAnnotationSidebar ? 'open-panel' : 'close-panel';

  const renderAnnotaionsListContainer = (leftRef: React.RefObject<HTMLDivElement>) => (
    <div
      className={`side-panel-resizable resizable ${panelClassName}`}
      ref={leftRef}
    >
      <div className='side-panel-container'>
        <div className='annotation-container'>
          {showAnnotationFormSpinner && <div className='annotation-spinner-overlay'></div>}
          {(showAnnotationFormSpinner || loadingAnnotations) &&
            <ChaiseSpinner
              className={`annotation-spinner${showAnnotationFormSpinner ? ' annotation-form-spinner' : ''}`}
              message={showAnnotationFormSpinner ? 'Saving the changes...' : ''}
            />
          }
          <ViewerAnnotationStrokeSlider />
          {showAnnotationForm &&
            <div className='annotation-form-container'>
              {annotationFormProps.appMode !== appModes.EDIT && <div className='drawing-hint'>Drawing is required.</div>}
              <div className='annotation-form-row'>
                <div className='annotation-form-row-header'>
                  <span className='text-danger'><b>*</b> </span>
                  <span className='column-displayname'>Annotated Region</span>
                </div>
                <div className='annotaion-form-row-input'>
                  <ChaiseTooltip placement='right' tooltip={isInDrawingMode ? 'Turn off the drawing tool.' : 'Turn on the darwing tool.'}>
                    <button className='chaise-btn chaise-btn-primary switch-draw-btn' onClick={toggleDrawingMode}>
                      <span className={`chaise-btn-icon fa-solid ${isInDrawingMode ? 'fa-pencil-ruler' : 'fa-eye'}`}></span>
                      <span>{isInDrawingMode ? 'Display all annotations' : 'Switch to drawing mode'}</span>
                    </button>
                  </ChaiseTooltip>

                  {displayDrawingRequiredError && <div className='text-danger'>
                    <div>Please draw annotation on the image.</div>
                  </div>}
                </div>
              </div>
              <Recordedit {...annotationFormProps} />
              <div className='form-btn-container'>
                <ChaiseTooltip placement='bottom' tooltip='Save this data on the server.'>
                  <button className='chaise-btn chaise-btn-primary' onClick={submitAnnotationForm}>
                    <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
                    <span>Save</span>
                  </button>
                </ChaiseTooltip>
                {annotationFormProps.canDelete && <ChaiseTooltip placement='bottom' tooltip='Delete this annotation.'>
                  <button className='chaise-btn chaise-btn-danger' onClick={(e) => startAnnotationDelete(-1, e)}>
                    <span className='chaise-btn-icon fa-regular fa-trash-alt'></span>
                    <span>Delete</span>
                  </button>
                </ChaiseTooltip>}
              </div>
            </div>
          }
          {!showAnnotationForm && <ViewerAnnotationList />}
        </div>
      </div>
    </div>
  );

  const renderMainContainer = () => (
    <div className='main-container dynamic-padding' ref={mainContainer}>
      <div className='main-body'>
        <iframe src='about:blank' id='osd-viewer-iframe' className={!displayIframe ? CLASS_NAMES.HIDDEN : ''} ref={iframeElement}>
          &lt;p&gt;Your browser does not support iframes.&lt;/p&gt;
        </iframe>
        {/* displayIframe */}
      </div>
    </div>
  );

  return (
    <>
      {!initialized && <ChaiseSpinner />}
      <div className={`viewer-container app-content-container ${!initialized ? CLASS_NAMES.HIDDEN : ''}`}>
        <div className='top-panel-container'>
          <Alerts />
          <div className='top-flex-panel'>
            <div className={`top-left-panel ${panelClassName}`}>
              <div className='panel-header'>
                <div className='pull-left'>
                  <h3 className='side-panel-heading'>{sidePanelTitle}</h3>
                </div>
                <div className='pull-right'>
                  {showAnnotationForm &&
                    <button
                      className='chaise-btn chaise-btn-tertiary' onClick={() => setShowCloseConfirmationModal(true)}
                      disabled={showAnnotationFormSpinner}
                    >
                      <span className='chaise-btn-icon fas fa-arrow-left'></span>
                      <span>Back</span>
                    </button>
                  }
                </div>
              </div>
            </div>
            <div className={`top-right-panel${!pageTitle ? ' no-title' : ''}`}>
              {pageTitle &&
                <div className='title-container'>
                  <DisplayValue
                    value={{ isHTML: true, value: pageTitle }}
                    as='h1'
                    props={{ 'id': 'page-title' }}
                  />
                </div>
              }
              <ViewerMenuButtons />
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
          /**
           * the following is needed to make sure the reize works properly when the mouse goes over the iframe.
           */
          onResizeStart={() => { if (iframeElement.current) iframeElement.current.style.pointerEvents = 'none'; }}
          onResizeEnd={() => { if (iframeElement.current) iframeElement.current.style.pointerEvents = 'inherit'; }}
        />
        {showCloseConfirmationModal &&
          <ConfirmationModal
            show={!!showCloseConfirmationModal}
            message={<>Any unsaved change will be discarded. Do you want to continue?</>}
            onConfirm={() => onConfirmCloseAnnotationForm()}
            onCancel={() => setShowCloseConfirmationModal(false)}
          />
        }
        {deleteAnnotationConfirmProps && <DeleteConfirmationModal show={!!deleteAnnotationConfirmProps} {...deleteAnnotationConfirmProps} />}
      </div>
    </>
  )

}

export default Viewer;
