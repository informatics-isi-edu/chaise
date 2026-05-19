import { useEffect, useRef, useState, type JSX } from 'react';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useViewer from '@isrd-isi-edu/chaise/src/hooks/viewer';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { ViewerZoomFunction } from '@isrd-isi-edu/chaise/src/models/viewer';
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// utils
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getOSDViewerIframe } from '@isrd-isi-edu/chaise/src/utils/viewer-utils';

/**
 * created a separate comp for this to avoid rerendering the parent when internal state changes.
 */
const ViewerMenuButtons = (): JSX.Element => {
  const { addAlert } = useAlert();

  const {
    logViewerClientAction,
    hideAnnotationSidebar,
    toggleAnnotationSidebar,
    annotationFormProps,
    imageID,
    mainImageLoaded,
  } = useViewer();

  const [showChannelList, setShowChannelList] = useState(false);
  const [waitingForScreenshot, setWaitingForScreenshot] = useState(false);
  /**
   * Current display rotation in degrees, normalized to [0, 360).
   * Mirrors what OSD is showing so we can decide when to surface the Save/Reset controls.
   */
  const [currentRotation, setCurrentRotation] = useState(0);

  useEffect(() => {
    const recieveIframeMessage = (event: any) => {
      if (event.origin !== windowRef.location.origin) return;

      const messageType = event.data.messageType;
      switch (messageType) {
        case 'hideChannelList':
          // osd-viewer sends this so we can update the button state
          setShowChannelList(false);
          break;
        case 'showChannelList':
          // osd-viewer sends this so we can update the button state
          setShowChannelList(true);
          break;
        case 'downloadViewDone':
          setWaitingForScreenshot(false);
          break;
        case 'downloadViewError':
          setWaitingForScreenshot(false);
          addAlert(errorMessages.viewer.screenshotFailed, ChaiseAlertType.WARNING);
          break;
      }
    };

    windowRef.addEventListener('message', recieveIframeMessage);

    return () => {
      windowRef.removeEventListener('message', recieveIframeMessage);
    }
  }, []);


  //------------------- UI related callbacks: --------------------//

  const toggleChannelList = () => {
    setShowChannelList((prev: boolean) => {
      const action = prev ? LogActions.VIEWER_CHANNEL_HIDE : LogActions.VIEWER_CHANNEL_SHOW;

      getOSDViewerIframe().contentWindow!.postMessage({ messageType: 'toggleChannelList' }, origin);

      logViewerClientAction(action, false);

      return !prev;
    });
  };

  const changeZoom = (zoomFn: ViewerZoomFunction) => {
    getOSDViewerIframe().contentWindow!.postMessage({ messageType: zoomFn }, origin);

    let action;
    switch (zoomFn) {
      case ViewerZoomFunction.ZOOM_IN:
        action = LogActions.VIEWER_ZOOM_IN;
        break;
      case ViewerZoomFunction.ZOOM_OUT:
        action = LogActions.VIEWER_ZOOM_OUT;
        break;
      default:
        action = LogActions.VIEWER_ZOOM_RESET;
        break;
    }

    logViewerClientAction(action, false);
  }

  const rotateImage = () => {
    const degrees = -90;
    getOSDViewerIframe().contentWindow!.postMessage(
      { messageType: 'rotate', content: { degrees } },
      origin,
    );
    setCurrentRotation((prev) => (((prev + degrees) % 360) + 360) % 360);
    logViewerClientAction(LogActions.VIEWER_ROTATE, false);
  }

  const resetRotation = () => {
    getOSDViewerIframe().contentWindow!.postMessage({ messageType: 'resetRotation' }, origin);
    setCurrentRotation(0);
    logViewerClientAction(LogActions.VIEWER_ROTATE_RESET, false);
  }

  const saveRotation = () => {
    // TODO(rotation): persist current rotation to the Image table once the
    // schema/ACL (canUpdateImageConfig) is wired up. For now this is a no-op
    // so the UI flow is testable without DB writes.
    logViewerClientAction(LogActions.VIEWER_ROTATE_SAVE, false);
  }

  const takeScreenshot = () => {
    setWaitingForScreenshot(true);

    const filename = imageID || 'image';
    getOSDViewerIframe().contentWindow!.postMessage({ messageType: 'downloadView', content: filename }, origin);

    logViewerClientAction(LogActions.VIEWER_SCREENSHOT, false);
  }

  //-------------------  render logics:   --------------------//
  const disableFeatures = !mainImageLoaded;

  let toggleAnnotationSidebarTooltip = hideAnnotationSidebar ? 'Show ' : 'Hide ';
  toggleAnnotationSidebarTooltip += annotationFormProps ? 'the annotation entry form' : 'the list of annotations';

  let toggleAnnotationSidebarLabel = hideAnnotationSidebar ? 'Show ' : 'Hide ';
  toggleAnnotationSidebarLabel += annotationFormProps ? 'Annotation form' : 'Annotations';

  let screenshotTooltip = 'Take a snapshot of image and save it';
  if (waitingForScreenshot) {
    screenshotTooltip = 'Processing the screenshot...';
  }

  return (
    <div className='menu-btn-container'>
      <ChaiseTooltip placement='top' tooltip={toggleAnnotationSidebarTooltip}>
        <button
          className='chaise-btn chaise-btn-primary'
          type='button'
          onClick={toggleAnnotationSidebar}
        >
          <span
            className={`chaise-btn-icon chaise-icon ${hideAnnotationSidebar ? 'chaise-sidebar-open' : 'chaise-sidebar-close'}`}
          ></span>
          <span>{toggleAnnotationSidebarLabel}</span>
        </button>
      </ChaiseTooltip>
      <ChaiseTooltip
        placement='top'
        tooltip={(showChannelList ? 'Hide' : 'Show') + ' the list of channels'}
      >
        <button
          className='chaise-btn chaise-btn-primary'
          type='button'
          onClick={toggleChannelList}
          disabled={disableFeatures}
        >
          <span className='chaise-btn-icon fa-solid fa-bars-progress'></span>
          <span>{(showChannelList ? 'Hide' : 'Show') + ' Channel List'}</span>
        </button>
      </ChaiseTooltip>
      <ChaiseTooltip placement='top' tooltip='Zoom in'>
        <button
          className='chaise-btn chaise-btn-primary'
          type='button'
          onClick={() => changeZoom(ViewerZoomFunction.ZOOM_IN)}
          disabled={disableFeatures}
        >
          <span className='chaise-btn-icon fa-solid fa-magnifying-glass-plus'></span>
          <span>Zoom In</span>
        </button>
      </ChaiseTooltip>
      <ChaiseTooltip placement='top' tooltip='Zoom out'>
        <button
          className='chaise-btn chaise-btn-primary'
          type='button'
          onClick={() => changeZoom(ViewerZoomFunction.ZOOM_OUT)}
          disabled={disableFeatures}
        >
          <span className='chaise-btn-icon fa-solid fa-magnifying-glass-minus'></span>
          <span>Zoom Out</span>
        </button>
      </ChaiseTooltip>
      <ChaiseTooltip placement='top' tooltip='Reset Zoom'>
        <button
          className='chaise-btn chaise-btn-primary'
          type='button'
          onClick={() => changeZoom(ViewerZoomFunction.RESET_ZOOM)}
          disabled={disableFeatures}
        >
          <span className='chaise-btn-icon fa-solid fa-rotate-left'></span>
          <span>Reset Zoom</span>
        </button>
      </ChaiseTooltip>
      <div className='chaise-btn-group'>
        <ChaiseTooltip placement='top' tooltip='Rotate image 90° counterclockwise'>
          <button
            className='chaise-btn chaise-btn-primary'
            type='button'
            onClick={rotateImage}
            disabled={disableFeatures}
          >
            <span className='chaise-btn-icon fa-solid fa-arrows-rotate'></span>
            <span>Rotate Left</span>
          </button>
        </ChaiseTooltip>
        {currentRotation !== 0 && (
          <>
            <ChaiseTooltip placement='top' tooltip='Save rotation'>
              <button
                className='chaise-btn chaise-btn-success icon-btn'
                type='button'
                onClick={saveRotation}
                disabled={disableFeatures}
                aria-label='Save rotation'
              >
                <span className='chaise-btn-icon fa-solid fa-check'></span>
              </button>
            </ChaiseTooltip>
            <ChaiseTooltip placement='top' tooltip='Discard rotation and return to original orientation'>
              <button
                className='chaise-btn chaise-btn-danger icon-btn'
                type='button'
                onClick={resetRotation}
                disabled={disableFeatures}
                aria-label='Discard rotation'
              >
                <span className='chaise-btn-icon fa-solid fa-xmark'></span>
              </button>
            </ChaiseTooltip>
          </>
        )}
      </div>
      <ChaiseTooltip placement='top' tooltip={screenshotTooltip}>
        <button
          className='chaise-btn chaise-btn-primary'
          type='button'
          onClick={takeScreenshot}
          disabled={waitingForScreenshot || disableFeatures}
        >
          {!waitingForScreenshot && <span className='chaise-btn-icon fa-solid fa-camera'></span>}
          {waitingForScreenshot && (
            <span className='chaise-btn-icon'>
              <Spinner animation='border' size='sm' />
            </span>
          )}
          <span>Take a Screenshot</span>
        </button>
      </ChaiseTooltip>
    </div>
  );
}

export default ViewerMenuButtons;
