import { useState } from 'react'
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip'


export type EllipsisWrapperProps = {
  children: JSX.Element
  /**
   * This is a ref to the element we want to watch for text overflow
   */
  elementRef : React.MutableRefObject<any>
}

const EllipsisWrapper = ({
  children,
  elementRef,
}: EllipsisWrapperProps) => {

  const [showToolTip, setShowTooltip] = useState<boolean>(false);
  const [tooltip, setTooltip] = useState('');

  /**
   * Function to check the text overflow.
   */
   const isTextOverflow = (element: HTMLElement) => {
    if (element) {
      return element.offsetWidth < element.scrollWidth;
    }
    return false;
  };

  /**
   * Handle rendering of tooltip on Element hover
   * @param isHovering is user hovering over the element
   */
  const onHover = (isHovering : boolean)=>{  

    if(elementRef && elementRef.current && isTextOverflow(elementRef.current) && isHovering && elementRef.current.textContent){
           
      setTooltip(elementRef.current.textContent);
      setShowTooltip(true);
      return;
    }
    setShowTooltip(false);
  }

  return (
      <ChaiseTooltip
        tooltip={tooltip}
        placement={'top-start'}
        onToggle={onHover}
        show={showToolTip}
      >
        {children}
      </ChaiseTooltip>
  );
}

export default EllipsisWrapper;