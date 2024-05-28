// Components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Spinner from 'react-bootstrap/Spinner';
import EllipsisWrapper from '@isrd-isi-edu/chaise/src/components/ellipsis-wrapper';

// hooks
import { useRef, useState } from 'react';

// models
import { CommentType, Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

type FacetHeaderProps = {
  /**
   * content to be displayed as panel header
   */
  displayname: Displayname;
  /**
   * Optional prop to enable tooltip for displayname
   */
  showTooltipIcon?: boolean;
  /**
   * Optional text to be shown on hover of displayname
   */
  comment?: CommentType;
  /**
   * whether we should show the spinner or not
   */
  isLoading: boolean;
  /**
   * Whether we're showing a timeout error or not
   */
  facetHasTimeoutError: boolean;
  /**
   * Whether the facet is displayed in a non-constrained mode
   */
  noConstraints: boolean;
};

/**
 * @returns {Component} FacetHeader Component that renders custom text (displayname) on facet header.
 */
const FacetHeader = ({
  displayname,
  showTooltipIcon = false,
  comment,
  isLoading,
  facetHasTimeoutError,
  noConstraints
}: FacetHeaderProps) => {

  /**
   * variable to store ref of facet header text
   */
  const contentRef = useRef(null);
  
  /**
   * If header text overflowed, display tooltip on hover of header.
   * If comment is present and header text overflowed, then display tooltip in <header text>: <comment> format
   * @returns tooltip content that needs to be displayed on hover of panel header text
   */
  const renderTooltipContent = (isOverflowing : boolean) => {
    if (contentRef && contentRef.current && isOverflowing && comment) {
      return <><DisplayValue value={displayname} />: <DisplayCommentValue comment={comment} /></>;
    } else if (comment) {
      return <DisplayCommentValue comment={comment} />;
    } else {
      return <DisplayValue value={displayname} />;
    }
  }

  return (
    <>
      <EllipsisWrapper
        placement='right'
        tooltip={renderTooltipContent}
        elementRef={contentRef}
      >
        <div className='accordion-toggle ellipsis'>
          <div ref={contentRef} className='facet-header-text ellipsis'>
            <DisplayValue value={displayname} />
            {/* Condition to show tooltip icon */}
            {showTooltipIcon && (
              <span className='chaise-icon-for-tooltip align-center-icon'></span>
            )}
          </div>
        </div>
      </EllipsisWrapper>
      <span className='facet-header-icon'>
        {
          (isLoading && (!facetHasTimeoutError || noConstraints)) &&
          <Spinner className='facet-spinner' size='sm' animation='border' />
        }
        {
          (facetHasTimeoutError || noConstraints) &&
          <ChaiseTooltip
            placement='right'
            tooltip={
              <>
                {noConstraints && <span>showing facet values without any constraints applied.</span>}
                {facetHasTimeoutError && <span>Request timeout: The facet values cannot be retrieved for updates.</span>}
              </>
            }
          >
            <span className='fa-solid fa-triangle-exclamation' />
          </ChaiseTooltip>
        }
      </span>
    </>

  );
};

export default FacetHeader;
