// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import RelatedTableActions from '@isrd-isi-edu/chaise/src/components/record/related-table-actions';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import { useRef, useState } from 'react';

// models
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { CommentDisplayModes } from '@isrd-isi-edu/chaise/src/models/displayname';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

type RelatedTableHeaderProps = {
  relatedModel: RecordRelatedModel;
};

const RelatedTableHeader = ({ relatedModel }: RelatedTableHeaderProps): JSX.Element => {
  /**
   * variable to store ref of header text
   */
  const contentRef = useRef(null);
  /**
   * state variable to control whether to show tooltip or not
   */
  const [showTooltip, setShowTooltip] = useState(false);

  /**
   * Function to check the text overflow.
   */
  const isTextOverflow = (element: HTMLElement) => {
    if (element) {
      return element.offsetWidth < element.scrollWidth;
    }
    return false;
  };

  const usedRef = relatedModel.initialReference;
  const hasTooltip = usedRef.comment && usedRef.comment.displayMode === CommentDisplayModes.TOOLTIP;

  const renderedDisplayname = <DisplayValue value={usedRef.displayname} />;
  const renderedTooltip = hasTooltip ? <DisplayCommentValue comment={usedRef.comment} /> : <></>;

  const renderTooltipContent = () => {
    if (contentRef && contentRef.current && isTextOverflow(contentRef.current) && hasTooltip) {
      return (
        <>
          {renderedDisplayname}: {renderedTooltip}
        </>
      );
    } else if (hasTooltip) {
      return renderedTooltip;
    } else {
      return renderedDisplayname;
    }
  };

  return (
    <div className='chaise-accordion-header'>
      <ChaiseTooltip
        placement='top'
        tooltip={renderTooltipContent()}
        onToggle={(nextshow: boolean) => {
          // Bootstrap onToggle prop to make tooltip visible or hidden
          if (contentRef && contentRef.current) {
            const isOverflow = isTextOverflow(contentRef.current);

            // If either text overflow or hasTooltip is true, show tooltip to right of the content
            setShowTooltip((isOverflow || hasTooltip) && nextshow);
          }
        }}
        show={showTooltip}
      >
        <div className='chaise-accordion-displayname' ref={contentRef}>
          {renderedDisplayname}
          {hasTooltip && <span className='chaise-icon-for-tooltip align-center-icon'></span>}
        </div>
      </ChaiseTooltip>

      <div className='chaise-accordion-header-buttons'>
        <div className='chaise-accordion-header-icons'>
          {relatedModel.recordsetState.isLoading &&
            !relatedModel.recordsetState.hasTimeoutError && (
              <Spinner animation='border' size='sm' />
            )}
          {relatedModel.recordsetState.hasTimeoutError && (
            <ChaiseTooltip placement='bottom' tooltip={MESSAGE_MAP.queryTimeoutTooltip}>
              <span className='fa-solid fa-triangle-exclamation'></span>
            </ChaiseTooltip>
          )}
        </div>
        <RelatedTableActions relatedModel={relatedModel} />
      </div>
    </div>
  );
};

export default RelatedTableHeader;
