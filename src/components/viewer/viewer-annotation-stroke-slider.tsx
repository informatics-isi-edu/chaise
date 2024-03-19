import { useEffect, useRef, useState } from 'react';

// hooks
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';
import useViewer from '@isrd-isi-edu/chaise/src/hooks/viewer';

// services
import ViewerAnnotationService from '@isrd-isi-edu/chaise/src/services/viewer-annotation';

// utils
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { VIEWER_CONSTANT } from '@isrd-isi-edu/chaise/src/utils/constants';

/**
 * since this function has to keep rerendering to show the new stroke, I decided to create a separate component for it.
 * this way it won't trigger the rerender for the rest of the page.
 */
const ViewerAnnotationStrokeSlider = (): JSX.Element => {

  const { logViewerClientAction } = useViewer();

  const [strokeValue, setStrokeValue, strokeValueRef] = useStateRef(1);

  const strokeChangePromise = useRef<any>(null);
  const oldStrokeValue = useRef<number>();

  useEffect(() => {
    const recieveIframeMessage = (event: any) => {
      if (event.origin !== windowRef.location.origin) return;

      const data = event.data.content;
      const messageType = event.data.messageType;
      switch (messageType) {
        case 'onChangeStrokeScale':
          setStrokeValue(+data.strokeScale.toFixed(2));
          break;
      }
    };

    windowRef.addEventListener('message', recieveIframeMessage);

    return () => {
      windowRef.removeEventListener('message', recieveIframeMessage);
    }
  }, []);

  const onStartChangeStroke = () => {
    if (strokeChangePromise.current) {
      clearTimeout(strokeChangePromise.current);
    } else {
      oldStrokeValue.current = strokeValueRef.current;
    }
  }

  const onStopChangeStroke = () => {
    // set a timer to log the action
    strokeChangePromise.current = setTimeout(() => {
      if (oldStrokeValue.current !== strokeValueRef.current) {
        logViewerClientAction(
          LogActions.VIEWER_ANNOT_LINE_THICKNESS,
          true,
          undefined,
          {
            old_thickness: oldStrokeValue.current,
            new_thickness: strokeValueRef.current
          }
        );
      }

      oldStrokeValue.current = undefined;
      strokeChangePromise.current = null;
    }, VIEWER_CONSTANT.ANNOTATIONS.LINE_THICKNESS_LOG_TIMEOUT);
  };

  const onChangeStrokeValue = (e: any) => {
    const val = e.target.value;
    ViewerAnnotationService.changeStrokeScale(val);
    setStrokeValue(val);
  }

  return (
    <div className='annotation-stroke-slider'>
      <span className='label'>Line Thickness <span className='stroke-value'>{strokeValue}</span></span>
      <input
        type='range' className='stroke-slider-input' min='1' max='6' step='0.05' value={strokeValue}
        onChange={onChangeStrokeValue} onPointerDown={onStartChangeStroke} onPointerUp={onStopChangeStroke}
      />
      <div className='stroke-slider-ticks'>
        <span className='stroke-slider-tick'>1</span>
        <span className='stroke-slider-tick'>2</span>
        <span className='stroke-slider-tick'>3</span>
        <span className='stroke-slider-tick'>4</span>
        <span className='stroke-slider-tick'>5</span>
        <span className='stroke-slider-tick'>6</span>
      </div>
    </div>
  )

}

export default ViewerAnnotationStrokeSlider;
