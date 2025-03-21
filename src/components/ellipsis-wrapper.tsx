import { useState, type JSX } from 'react';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip'
import { Placement } from 'react-bootstrap/types';


export type EllipsisWrapperProps = {
  children: JSX.Element
  /**
   * This is a ref to the element we want to watch for text overflow
   */
  elementRef: React.MutableRefObject<any>
  /**
   * Tooltip to display.
   *
   * Notes:
   * - It can be a value or a callback function with a boolean prop returning a value.
   * - For a tooltip that is always visible on hover use a callback to pass value like so -
   * ```ts
   * <EllipsisWrapper
   *  tooltip={() => val}
   * >
   * </EllipsisWrapper>
   * ```
   * - Return `null` in the callback if you don't want the tooltip to show up.
   */
  tooltip: (string | JSX.Element) | ((isOverflowing: boolean) => (string | JSX.Element | null))
  /**
   * where the tooltip should be.
   * Default is 'top-start'
   */
  placement?: Placement,
}


/**
 * A component that wraps its children and displays a tooltip if the content overflows its container.
 * The tooltip is displayed when the user hovers over the wrapped content.
 */
const EllipsisWrapper = ({
  children,
  elementRef,
  tooltip,
  placement = 'top-start'
}: EllipsisWrapperProps) => {

  const [showToolTip, setShowTooltip] = useState<boolean>(false);
  const [tooltipValue, setTooltipValue] = useState<string | JSX.Element>('');

  /**
   * Function to check the text overflow.
   */
  const isTextOverflow = (element: HTMLElement) => {
    if (element) {
      return element.clientWidth < element.scrollWidth;
    }
    return false;
  };

  /**
   * Get tooltip value based on type of prop passed
   */
  const getTooltipValue = () => {
    const isOverflowing = isTextOverflow(elementRef.current);

    if (typeof tooltip === 'function') {
      return tooltip(isOverflowing);
    } else {
      return isOverflowing ? tooltip : null;
    }
  }

  const onToggle = (nextShow: boolean) => {
    const tt = getTooltipValue();
    if (elementRef && elementRef.current && tt && nextShow) {
      setTooltipValue(tt);
      setShowTooltip(true);
      return;
    }
    setShowTooltip(false);
  }

  return (
    <ChaiseTooltip
      tooltip={tooltipValue}
      placement={placement}
      onToggle={onToggle}
      show={showToolTip}
    >
      {children}
    </ChaiseTooltip>
  );
}

export default EllipsisWrapper;
