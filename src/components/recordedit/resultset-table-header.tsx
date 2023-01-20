// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { ConditionalWrapper } from '@isrd-isi-edu/chaise/src/components/cond-wrapper';

// hooks
import { useRef, useState } from 'react';

type ResultsetTableHeaderProps = {
  header: string,
  exploreLink?: string,
  exploreLinkTooltip?: string,
}

const ResultsetTableHeader = ({
  header
}: ResultsetTableHeaderProps): JSX.Element => {
  /**
   * state variable to control whether to show tooltip or not
   */
  const [showTooltip, setShowTooltip] = useState(false);

  /**
   * variable to store ref of facet header text
   */
  const contentRef = useRef(null);

  /**
   * Function to check the text overflow.
   */
  const isTextOverflow = (element: HTMLElement) => {
    if (element) {
      return element.offsetWidth < element.scrollWidth;
    }
    return false;
  };

  return (
    <div className='resultset-table-header'>
      <ChaiseTooltip
        placement='top-start'
        tooltip={header}
        onToggle={(nextshow: boolean) => {
          // Bootstrap onToggle prop to make tooltip visible or hidden
          if (contentRef && contentRef.current) {
            const isOverflow = isTextOverflow(contentRef.current);

            // If either text overflow or hasTooltip is true, show tooltip to right of the content
            setShowTooltip((isOverflow) && nextshow);
          }
        }}
        show={showTooltip}
      >
        <div className='header-displayname' ref={contentRef}>{header}</div>
      </ChaiseTooltip>
    </div>
  )
}

export default ResultsetTableHeader;
