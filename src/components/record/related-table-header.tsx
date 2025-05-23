// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import RelatedTableActions from '@isrd-isi-edu/chaise/src/components/record/related-table-actions';
import Spinner from 'react-bootstrap/Spinner';
import EllipsisWrapper from '@isrd-isi-edu/chaise/src/components/ellipsis-wrapper';

// hooks
import { useRef, type JSX } from 'react';

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

  const usedRef = relatedModel.initialReference;
  const hasTooltip = !!usedRef.comment && !!usedRef.comment.value && usedRef.comment.displayMode === CommentDisplayModes.TOOLTIP;

  const renderedDisplayname = <DisplayValue value={usedRef.displayname} />;
  const renderedTooltip = hasTooltip ? <DisplayCommentValue comment={usedRef.comment} /> : <></>;

  const renderTooltipContent = (isOverflowing: boolean) => {
    if (isOverflowing) {
      if (hasTooltip) {
        return <>{renderedDisplayname}: {renderedTooltip}</>
      } else {
        return renderedDisplayname;
      }
    } else if (hasTooltip) {
      return renderedTooltip;
    } else {
      return null;
    }
  };

  return (
    <div className='chaise-accordion-header'>
      <EllipsisWrapper
        elementRef={contentRef}
        tooltip={renderTooltipContent}
      >
        <div className='chaise-accordion-displayname' ref={contentRef}>
          {renderedDisplayname}
          {hasTooltip && <span className='chaise-icon-for-tooltip chaise-accordion-header-icon-for-tooltip'></span>}
        </div>
      </EllipsisWrapper>

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
