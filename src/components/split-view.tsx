import '@isrd-isi-edu/chaise/src/assets/scss/_split-view.scss';
import { useRef, useEffect, useState } from 'react';
import { convertVWToPixel } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import useIsFirstRender from '@isrd-isi-edu/chaise/src/hooks/is-first-render';

type LeftPaneProps = {
  /**
   * The elements displayed on the left side of the page
   */
  children: (ref: React.RefObject<HTMLDivElement>) => JSX.Element,
  /**
   * default width of the left panel
   */
  leftWidth: number | undefined,
  /**
   * the elements that we should update while updating the width of the left panel.
   */
  leftPartners?: HTMLElement[]
};

const LeftPane = ({ children, leftWidth, leftPartners }: LeftPaneProps): JSX.Element => {
  const leftRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useIsFirstRender();

  useEffect(() => {
    /**
     *  The initial width (flex-basis) must be handled by CSS and we're not going
     *  to set the initial values.
     *
     * NOTE: I had to do this because leftPartners are not defined on the initial render,
     * so we have to delay doing this until all of them are available.
     * TODO can we improve this?
     */
    if (isFirstRender) return;

    if (leftRef?.current) {
      // NOTE while this is not needed, I left this in case we might need it later:
      // fireCustomEvent('resizable-width-change', '.split-view', { width: leftWidth });
      leftRef.current.style.flexBasis = `${leftWidth}px`;

      if (leftPartners) {
        leftPartners.forEach((el) => el.style.flexBasis = `${leftWidth}px`);
      }
    }

  }, [leftRef, leftWidth]);

  return children(leftRef);
};

type SplitViewProps = {
  parentContainer?: HTMLElement,

  /**
   * a function that returns the left-pane component in the resizable layout
   * pass the leftRef as a ref to the outermost element of your left-pane component
   */
  left: ((ref: React.RefObject<HTMLDivElement>) => JSX.Element),

  /**
   * the other elements that we should change their width alongside left
   */
  leftPartners?: HTMLElement[],

  /**
   * the right-pane component in the resizable layout or a function that returns the right-pane component
   */
  right: JSX.Element | (() => JSX.Element),

  /**
   * use for applying custom styles on the component
   */
  className?: string,

  /**
   * the minimum width limit on the left-pane component
   * defaults to 250px
   */
  minWidth?: number,

  /**
   * the maximum width limit on the left-pane component
   * defaults to 450px
   */
  maxWidth?: number,

  /**
   * the initial width for the left-pane component
   * defaults to 270px
   */
  initialWidth?: number,

  /**
   * set this flag in case you pass maxWidth in vw units instead of px units
   * defaults to false
   */
  convertMinWidth?: boolean,

  /**
   * set this flag in case you pass minWidth in vw units instead of px units
   * defaults to false
   */
  convertMaxWidth?: boolean,

  /**
   * set this flag in case you pass initialWidth in vw units instead of px units
   * defaults to false
   */
  convertInitialWidth?: boolean
};

type StateDef = {
  leftWidth: number,
  xPos: undefined | number,
  dragging: boolean,
}

/**
 * This component is used to implement a horizontal dragable and resizable component/div
 * Note:
 * To resize other components based on the resized value left-pane component add an event listener and listen to the 'resizable-width-change' event.
 * For usage refer to the recordset.tsx component
 */

const SplitView = ({
  parentContainer,
  left,
  leftPartners,
  right,
  className,
  minWidth = 250,
  maxWidth = 450,
  initialWidth = 270,
  convertMinWidth = false,
  convertMaxWidth = false,
  convertInitialWidth = false
}: SplitViewProps): JSX.Element => {

  let convertedMinWidth = minWidth;

  let convertedMaxWidth = maxWidth;

  let convertedInitialWidth = initialWidth;

  if (convertMinWidth) {
    convertedMinWidth = convertVWToPixel(minWidth);
  }

  if (convertMaxWidth) {
    convertedMaxWidth = convertVWToPixel(maxWidth);
  }

  if (convertInitialWidth) {
    convertedInitialWidth = convertVWToPixel(initialWidth);
  }

  const [leftState, setLeftState] = useState<StateDef>({ leftWidth: convertedInitialWidth, xPos: undefined, dragging: false });

  const onMouseDown = (e: React.MouseEvent) => setLeftState({ ...leftState, xPos: e.clientX, dragging: true });

  /**
   * This function is called on the parent for any mouse up event,
   * so the first thing that we're doing is to make sure we're only doing this when user has already started the drag event.
   */
  const onMouseUp = () => {
    if (leftState.dragging) {
      setLeftState({ ...leftState, dragging: false });
    }
  }

  /**
   * This function is called on the parent for any mouse movement,
   * so the first thing that we're doing is to make sure we're only doing this when user has already started the drag event.
   */
  const onMouseMove = (e: MouseEvent) => {
    const clientX = e.clientX;

    if (leftState.dragging && leftState.leftWidth && leftState.xPos) {
      // this will avoid selecting text while we're dragging the side spanel
      e.preventDefault();

      const newLeftWidth = leftState.leftWidth + clientX - leftState.xPos;

      if (newLeftWidth < convertedMinWidth) {
        setLeftState({ ...leftState, leftWidth: convertedMinWidth, xPos: clientX });
        return;
      }

      if (newLeftWidth > convertedMaxWidth) {
        setLeftState({ ...leftState, leftWidth: convertedMaxWidth, xPos: clientX });
        return;
      }

      setLeftState({ ...leftState, leftWidth: newLeftWidth, xPos: clientX });
    }
  };

  useEffect(() => {
    // NOTE does this make sense? parentContainer should be required
    const p = parentContainer ? parentContainer : document.querySelector('body') as HTMLElement;
    p.addEventListener('mousemove', onMouseMove);
    p.addEventListener('mouseup', onMouseUp);

    return () => {
      p.removeEventListener('mousemove', onMouseMove);
      p.removeEventListener('mouseup', onMouseUp);
    };
  });

  return (
    <div className={`split-view ${className ?? ''}`}>
      <LeftPane leftWidth={leftState.leftWidth} leftPartners={leftPartners}>
        {left}
      </LeftPane>
      <div
        className='divider-hitbox'
        onMouseDown={onMouseDown}
      >
        <span className='fas fa-ellipsis-v' />
      </div>
      {typeof right === 'function' ? right() : right}
    </div>
  );
};

export default SplitView;
