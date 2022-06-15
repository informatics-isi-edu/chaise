import '@isrd-isi-edu/chaise/src/assets/scss/_faceting.scss';

import { useRef, useState } from 'react';

// Components
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

type FacetHeaderProps = {
  key: string;
  headerText: any;
  showTooltipIcon: any;
  tooltipContent: any;
};

/**
 * @param key key prop to uniquely identify panel header item
 * @param headerText headerText prop that holds content to show as header
 * @param showTooltipIcon prop to enable tooltip for header text
 * @param tooltipContent text to be shown on hover of header text
 * @returns FacetHeader Component
 */
const FacetHeader = ({
  key,
  headerText,
  showTooltipIcon,
  tooltipContent,
}: FacetHeaderProps) => {
  /**
   * @contentRef variable to store ref of facet header text
   * @show state variable to control whether to show tooltip or not
   */
  const contentRef = useRef(null);
  const [show, setShow] = useState(false);

  // Function to check the text overflow.
  const isTextOverflow = (element) => {
    if (element) {
      return element.offsetWidth < element.scrollWidth;
    }
    return false;
  };

  return (
    <OverlayTrigger
      trigger='hover'
      placement='right'
      overlay={
        <Tooltip style={{ maxWidth: '50%', whiteSpace: 'nowrap' }}>
          {contentRef &&
          contentRef.current &&
          isTextOverflow(contentRef.current) ? (
            <>
              <DisplayValue value={headerText} />: {tooltipContent}
            </>
          ) : tooltipContent ? (
            tooltipContent
          ) : (
            <DisplayValue value={headerText} />
          )}
        </Tooltip>
      }
      onToggle={(nextshow: boolean) => {
        // Bootstrap onToggle prop to make tooltip visible or hidden
        if (contentRef && contentRef.current) {
          const isOverflow = isTextOverflow(contentRef.current);

          // If either text overflow or showtooltip is true, show tooltip to right of the content
          setShow((isOverflow || showTooltipIcon) && nextshow);
        }
      }}
      show={show}
    >
      <div className='accordion-toggle ellipsis' id={key}>
        <div ref={contentRef} className='facet-header-text ellipsis'>
          <DisplayValue value={headerText} />
          {/* Condition to show tooltip icon */}
          {showTooltipIcon && (
            <span className='chaise-icon-for-tooltip align-center-icon'></span>
          )}
        </div>
        <span className='facet-header-icon'></span>
      </div>
    </OverlayTrigger>
  );
};

export default FacetHeader;
