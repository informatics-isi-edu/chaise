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
import RotateLeftIcon from '@isrd-isi-edu/chaise/src/components/icons/rotate-left';
import RotateRightIcon from '@isrd-isi-edu/chaise/src/components/icons/rotate-right';

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
    canUpdateImageConfig,
    mainImageRotation,
    savingImageConfig,
    saveImageConfig,
  } = useViewer();

  const [showChannelList, setShowChannelList] = useState(false);
  const [waitingForScreenshot, setWaitingForScreenshot] = useState(false);

  /**
   * the live viewport rotation in degrees. chaise issues every rotate command,
   * so it can track this without round-tripping to osd-viewer. initialized from
   * (and kept in sync with) the saved default; the save button persists it.
   */
  const currentRotationRef = useRef(mainImageRotation);
  useEffect(() => {
    // runs on initial load and after each successful save; in both cases the
    // live rotation already matches the saved default, so this stays consistent.
    currentRotationRef.current = mainImageRotation;
  }, [mainImageRotation]);

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
    };
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
  };

  const rotateImage = (degrees: number) => {
    currentRotationRef.current = ((currentRotationRef.current + degrees) % 360 + 360) % 360;
    getOSDViewerIframe().contentWindow!.postMessage(
      { messageType: 'rotate', content: { degrees } },
      origin
    );
    logViewerClientAction(LogActions.VIEWER_ROTATE, false, undefined, { degrees });
  };

  const resetRotation = () => {
    // discard unsaved rotation: return to the saved default (not necessarily 0)
    currentRotationRef.current = mainImageRotation;
    getOSDViewerIframe().contentWindow!.postMessage(
      { messageType: 'resetRotation', content: { degrees: mainImageRotation } },
      origin
    );
    logViewerClientAction(LogActions.VIEWER_ROTATE_RESET, false);
  };

  const saveRotation = () => {
    saveImageConfig(currentRotationRef.current);
  };

  const takeScreenshot = () => {
    setWaitingForScreenshot(true);

    const filename = imageID || 'image';
    getOSDViewerIframe().contentWindow!.postMessage(
      { messageType: 'downloadView', content: filename },
      origin
    );

    logViewerClientAction(LogActions.VIEWER_SCREENSHOT, false);
  };

  //-------------------  render logics:   --------------------//
  const disableFeatures = !mainImageLoaded;

  let toggleAnnotationSidebarTooltip = hideAnnotationSidebar ? 'Show ' : 'Hide ';
  toggleAnnotationSidebarTooltip += annotationFormProps
    ? 'the annotation entry form'
    : 'the list of annotations';

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
      <div className='viewer-zoom-btn-group chaise-btn-group'>
        <span className='chaise-btn-group-text'>Zoom</span>
        <ChaiseTooltip placement='top' tooltip='Zoom in'>
          <button
            className='chaise-btn chaise-btn-primary icon-btn'
            type='button'
            onClick={() => changeZoom(ViewerZoomFunction.ZOOM_IN)}
            disabled={disableFeatures}
            aria-label='Zoom in'
          >
            <span className='chaise-btn-icon fa-solid fa-magnifying-glass-plus'></span>
          </button>
        </ChaiseTooltip>
        <ChaiseTooltip placement='top' tooltip='Zoom out'>
          <button
            className='chaise-btn chaise-btn-primary icon-btn'
            type='button'
            onClick={() => changeZoom(ViewerZoomFunction.ZOOM_OUT)}
            disabled={disableFeatures}
            aria-label='Zoom out'
          >
            <span className='chaise-btn-icon fa-solid fa-magnifying-glass-minus'></span>
          </button>
        </ChaiseTooltip>
        <ChaiseTooltip placement='top' tooltip='Reset Zoom'>
          <button
            className='chaise-btn chaise-btn-primary icon-btn'
            type='button'
            onClick={() => changeZoom(ViewerZoomFunction.RESET_ZOOM)}
            disabled={disableFeatures}
            aria-label='Reset zoom'
          >
            <span className='chaise-btn-icon fa-solid fa-undo'></span>
          </button>
        </ChaiseTooltip>
      </div>
      <div className='viewer-rotate-btn-group chaise-btn-group'>
        <span className='chaise-btn-group-text'>Rotate</span>
        <ChaiseTooltip placement='top' tooltip='Rotate 90° counterclockwise'>
          <button
            className='chaise-btn chaise-btn-primary icon-btn'
            type='button'
            onClick={() => rotateImage(-90)}
            disabled={disableFeatures}
            aria-label='Rotate left'
          >
            <RotateLeftIcon className='chaise-btn-icon' width={17} />
          </button>
        </ChaiseTooltip>
        <ChaiseTooltip placement='top' tooltip='Rotate 90° clockwise'>
          <button
            className='chaise-btn chaise-btn-primary icon-btn'
            type='button'
            onClick={() => rotateImage(90)}
            disabled={disableFeatures}
            aria-label='Rotate right'
          >
            <RotateRightIcon className='chaise-btn-icon' width={17} />
          </button>
        </ChaiseTooltip>
        <ChaiseTooltip
          placement='top'
          tooltip='Discard unsaved rotation and return to the saved orientation'
        >
          <button
            className='chaise-btn chaise-btn-primary icon-btn'
            type='button'
            onClick={resetRotation}
            disabled={disableFeatures}
            aria-label='Discard rotation'
          >
            <span className='chaise-btn-icon fa-solid fa-undo'></span>
          </button>
        </ChaiseTooltip>
        {canUpdateImageConfig &&
          <ChaiseTooltip placement='top' tooltip='Save the current rotation'>
            <button
              className='chaise-btn chaise-btn-primary icon-btn'
              type='button'
              onClick={saveRotation}
              disabled={savingImageConfig || disableFeatures}
              aria-label='Save rotation'
            >
              {savingImageConfig ? (
                <span className='chaise-btn-icon'>
                  <Spinner animation='border' size='sm' />
                </span>
              ) : (
                <span className='chaise-btn-icon fa-solid fa-check-to-slot'></span>
              )}
            </button>
          </ChaiseTooltip>
        }
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
          <span>Screenshot</span>
        </button>
      </ChaiseTooltip>
    </div>
  );
};

export default ViewerMenuButtons;
