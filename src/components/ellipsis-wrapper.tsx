import { useState } from 'react'
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
   * It can be a value or a callback function with a boolean prop returning a value.
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

  /**
   * Handle rendering of tooltip on Element hover
   * @param isHovering is user hovering over the element
   */
  const onHover = (isHovering: boolean) => {

    let tt = getTooltipValue();

    if (elementRef && elementRef.current && tt && isHovering) {

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
      onToggle={onHover}
      show={showToolTip}
    >
      {children}
    </ChaiseTooltip>
  );
}

export default EllipsisWrapper;