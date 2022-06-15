import '@isrd-isi-edu/chaise/src/assets/scss/_faceting.scss';

import { useRef, useState } from 'react';

// Components
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

type FacetHeaderProps = {
  displayname: Displayname; // content to be displayed as panel header
  showTooltipIcon?: boolean; // prop to enable tooltip for displayname
  comment?: string; // Optional text to be shown on hover of displayname
};

/**
 * @returns FacetHeader Component
 */
const FacetHeader = ({
  displayname,
  showTooltipIcon=false,
  comment,
}: FacetHeaderProps) => {
  /**
   * @contentRef variable to store ref of facet header text
   * @show state variable to control whether to show tooltip or not
   */
  const contentRef = useRef(null);
  const [show, setShow] = useState(false);

  // Function to check the text overflow.
  const isTextOverflow = (element: HTMLElement) => {
    if (element) {
      return element.offsetWidth < element.scrollWidth;
    }
    return false;
  };

  /**
   * If header text overflowed, display tooltip on hover of header.
   * If comment is present and header text overflowed, then display tooltip in <header text>: <comment> format
   * @returns tooltip content that needs to be displayed on hover of panel header text
   */
  const renderTooltipContent = () => {
    if (contentRef && contentRef.current && isTextOverflow(contentRef.current) && comment) {
      return <><DisplayValue value={displayname} />: {comment}</>;
    } else if (comment) {
      return comment;
    } else {
      return <DisplayValue value={displayname} />;
    }
  }

  return (
    <OverlayTrigger
      placement='right'
      overlay={
        <Tooltip style={{ maxWidth: '50%', whiteSpace: 'nowrap' }}>
          {renderTooltipContent()}
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
      <div className='accordion-toggle ellipsis'>
        <div ref={contentRef} className='facet-header-text ellipsis'>
          <DisplayValue value={displayname} />
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
