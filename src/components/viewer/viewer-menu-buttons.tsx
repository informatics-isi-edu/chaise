import { useEffect, useRef, useState, type JSX } from 'react';
import { createPortal } from 'react-dom';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Dropdown from 'react-bootstrap/Dropdown';
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
  } = useViewer();

  const [showChannelList, setShowChannelList] = useState(false);
  const [waitingForScreenshot, setWaitingForScreenshot] = useState(false);
  /**
   * Current display rotation in degrees, normalized to [0, 360).
   * Mirrors what OSD is showing so we can decide when to surface the Save/Reset controls.
   */
  const [currentRotation, setCurrentRotation] = useState(0);
  /**
   * Whether the rotation overlay banner has been tucked away. Resets on every
   * new rotation / discard so transitions always start with the banner visible
   * again. Set to true on Save so the user can tuck it after committing.
   */
  const [bannerCollapsed, setBannerCollapsed] = useState(false);

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

  const rotateImage = (degrees: number) => {
    getOSDViewerIframe().contentWindow!.postMessage(
      { messageType: 'rotate', content: { degrees } },
      origin,
    );
    setCurrentRotation((prev) => (((prev + degrees) % 360) + 360) % 360);
    // Every new rotation re-surfaces the banner; previous "tucked" state is
    // about old information.
    setBannerCollapsed(false);
    logViewerClientAction(LogActions.VIEWER_ROTATE, false);
  }

  const resetRotation = () => {
    getOSDViewerIframe().contentWindow!.postMessage({ messageType: 'resetRotation' }, origin);
    setCurrentRotation(0);
    setBannerCollapsed(false);
    logViewerClientAction(LogActions.VIEWER_ROTATE_RESET, false);
  }

  const saveRotation = () => {
    // TODO(rotation): persist current rotation to the Image table once the
    // schema/ACL (canUpdateImageConfig) is wired up. For now this is a no-op
    // so the UI flow is testable without DB writes.
    // Tuck the banner — user just acted on it, it should get out of the way.
    setBannerCollapsed(true);
    logViewerClientAction(LogActions.VIEWER_ROTATE_SAVE, false);
  }

  const takeScreenshot = () => {
    setWaitingForScreenshot(true);

    const filename = imageID || 'image';
    getOSDViewerIframe().contentWindow!.postMessage({ messageType: 'downloadView', content: filename }, origin);

    logViewerClientAction(LogActions.VIEWER_SCREENSHOT, false);
  }

  //-------------------  render helpers:   --------------------//

  /**
   * The three icon buttons inside the Rotate trio. Returned as a fragment so
   * it can be dropped into each label-style variant below.
   */
  const renderRotateTrioButtons = () => (
    <>
      <ChaiseTooltip placement='top' tooltip='Rotate image 90° counterclockwise'>
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
      <ChaiseTooltip placement='top' tooltip='Rotate image 90° clockwise'>
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
      <ChaiseTooltip placement='top' tooltip='Discard rotation and return to original orientation'>
        <button
          className='chaise-btn chaise-btn-primary icon-btn'
          type='button'
          onClick={resetRotation}
          disabled={disableFeatures}
          aria-label='Discard rotation'
        >
          <span className='chaise-btn-icon fa-solid fa-rotate-left'></span>
        </button>
      </ChaiseTooltip>
    </>
  );

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

  // Find the iframe's containing element so the rotation banner can be
  // portal-ed in as an overlay at the top of the image area. Re-evaluated on
  // every render so it picks up the element once it mounts.
  const mainBodyEl = typeof document !== 'undefined' ? document.querySelector('.main-body') : null;

  const rotationBanner = currentRotation !== 0 && mainBodyEl ? createPortal(
    bannerCollapsed ? (
      // Collapsed: a small tab poking down from the top of the image area.
      // Clicking it expands the banner again.
      <ChaiseTooltip placement='bottom' tooltip='Show rotation controls'>
        <button
          type='button'
          className='viewer-rotation-banner-tab chaise-btn chaise-btn-primary'
          onClick={() => setBannerCollapsed(false)}
          aria-label='Show rotation controls'
        >
          <span className='chaise-btn-icon fa-solid fa-chevron-down'></span>
        </button>
      </ChaiseTooltip>
    ) : (
      <div className='viewer-rotation-banner'>
        <span className='viewer-rotation-banner-text'>
          Image is rotated {currentRotation}°. Save to keep this orientation, or discard to revert.
        </span>
        <ChaiseTooltip placement='bottom' tooltip='Save rotation'>
          <button
            className='chaise-btn chaise-btn-primary'
            type='button'
            onClick={saveRotation}
            disabled={disableFeatures}
          >
            <span className='chaise-btn-icon fa-solid fa-check'></span>
            <span>Save</span>
          </button>
        </ChaiseTooltip>
        <ChaiseTooltip placement='bottom' tooltip='Discard rotation and return to original orientation'>
          <button
            className='chaise-btn chaise-btn-secondary'
            type='button'
            onClick={resetRotation}
            disabled={disableFeatures}
          >
            <span className='chaise-btn-icon fa-solid fa-xmark'></span>
            <span>Discard</span>
          </button>
        </ChaiseTooltip>
        <ChaiseTooltip placement='bottom' tooltip='Hide this banner'>
          <button
            className='chaise-btn chaise-btn-secondary icon-btn viewer-rotation-banner-dismiss'
            type='button'
            onClick={() => setBannerCollapsed(true)}
            aria-label='Hide rotation banner'
          >
            <span className='chaise-btn-icon fa-solid fa-chevron-up'></span>
          </button>
        </ChaiseTooltip>
      </div>
    ),
    mainBodyEl,
  ) : null;

  return (
    <>
    {/* Banner overlay variant — commented out; the hamburger-menu variant is
        the chosen UI. Kept here so it's easy to revive later. */}
    {/* {rotationBanner} */}
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
      {/* Original three labeled Zoom buttons — commented out in favor of the
          trio variant below. Kept around so we can revive it for comparison. */}
      {/*
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
      */}
      {/* Trio variant: "Zoom" label + three icon-only buttons (in, out, reset). */}
      <div className='viewer-zoom-trio chaise-btn-group'>
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
            <span className='chaise-btn-icon fa-solid fa-rotate-left'></span>
          </button>
        </ChaiseTooltip>
      </div>
      {/* "Rotate" label + three icon-only buttons (left, right, discard). */}
      <div className='viewer-rotate-trio chaise-btn-group'>
        <span className='chaise-btn-group-text'>Rotate</span>
        {renderRotateTrioButtons()}
      </div>
      {/* Split-button: "Rotate Right" + a hamburger that opens a menu with the
          Save/Discard actions. Styled to mirror the faceting panel's dropdown
          (renderFacetDropdownMenu in faceting.tsx) so the menu look/positioning
          matches the rest of the app. */}
      <div className='viewer-rotate-menu chaise-btn-group'>
        <ChaiseTooltip placement='top' tooltip='Rotate image 90° clockwise'>
          <button
            className='chaise-btn chaise-btn-primary'
            type='button'
            onClick={() => rotateImage(90)}
            disabled={disableFeatures}
          >
            <RotateRightIcon className='chaise-btn-icon' width={17} />
            <span>Rotate Right</span>
          </button>
        </ChaiseTooltip>
        {/* Render as a nested chaise-btn-group so the outer group's CSS
            (border-radius/-margin reset) reaches the toggle button. Always
            shown so the toggle's geometry doesn't appear/disappear as the
            user rotates; individual items are disabled when not applicable. */}
        <Dropdown className='chaise-dropdown chaise-dropdown-no-icon chaise-btn-group'>
          <ChaiseTooltip placement='top' tooltip='Rotation actions'>
            <Dropdown.Toggle
              className='chaise-btn chaise-btn-primary'
              disabled={disableFeatures}
              aria-label='Rotation actions'
            >
              <span className='chaise-btn-icon fa-solid fa-bars'></span>
            </Dropdown.Toggle>
          </ChaiseTooltip>
          {/* `align='end'` anchors the menu's right edge to the toggle's right
              edge, so the menu opens leftward — landing under the Rotate Left
              button instead of hanging off to the right of the toggle. */}
          <Dropdown.Menu align='end'>
            <Dropdown.Item
              className='dropdown-item-w-icon save-rotation-btn'
              onClick={saveRotation}
              disabled={disableFeatures}
            >
              <span>
                <span className='dropdown-item-icon fa-solid fa-check-to-slot'></span>
                <span>Save rotation</span>
              </span>
            </Dropdown.Item>
            <Dropdown.Item
              className='dropdown-item-w-icon discard-rotation-btn'
              onClick={resetRotation}
              disabled={disableFeatures || currentRotation === 0}
            >
              <span>
                <span className='dropdown-item-icon fa-solid fa-undo'></span>
                <span>Discard rotation</span>
              </span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
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
      {/* Icon-only variant of the screenshot button. Same handler + state, so
          it swaps in the spinner alongside the labeled button. */}
      <ChaiseTooltip placement='top' tooltip={screenshotTooltip}>
        <button
          className='chaise-btn chaise-btn-primary icon-btn'
          type='button'
          onClick={takeScreenshot}
          disabled={waitingForScreenshot || disableFeatures}
          aria-label='Take a screenshot'
        >
          {!waitingForScreenshot && <span className='chaise-btn-icon fa-solid fa-camera'></span>}
          {waitingForScreenshot && (
            <span className='chaise-btn-icon'>
              <Spinner animation='border' size='sm' />
            </span>
          )}
        </button>
      </ChaiseTooltip>
    </div>
    </>
  );
}

export default ViewerMenuButtons;
