import '@isrd-isi-edu/chaise/src/assets/scss/_record-related-section.scss';

// components
import Accordion from 'react-bootstrap/Accordion';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { ConditionalWrapper } from '@isrd-isi-edu/chaise/src/components/cond-wrapper';
import RelatedTable from '@isrd-isi-edu/chaise/src/components/record/related-table';
import RelatedTableActions from '@isrd-isi-edu/chaise/src/components/record/related-table-actions';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Spinner from 'react-bootstrap/Spinner';
import Tooltip from 'react-bootstrap/Tooltip';

// hooks
import { useRef, useState } from 'react';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

// models
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

type RelatedTableHeaderProps = {
  relatedModel: RecordRelatedModel
};

const RelatedTableHeader = ({
  relatedModel
}: RelatedTableHeaderProps): JSX.Element => {
  /**
   * variable to store ref of facet header text
   */
  const contentRef = useRef(null);
  /**
   * state variable to control whether to show tooltip or not
   */
  const [show, setShow] = useState(false);

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
  const hasTooltip = usedRef.comment && usedRef.commentDisplay === 'tooltip';

  const renderedDisplayname = <DisplayValue value={usedRef.displayname} />;

  const renderTooltipContent = () => {
    if (contentRef && contentRef.current && isTextOverflow(contentRef.current) && hasTooltip) {
      return <>{renderedDisplayname}: {usedRef.comment}</>;
    } else if (hasTooltip) {
      return usedRef.comment;
    } else {
      return renderedDisplayname;
    }
  };

  return (
    <div className='rt-section-header'>
      <OverlayTrigger
        placement='bottom'
        overlay={<Tooltip>{renderTooltipContent()}</Tooltip>}
        onToggle={(nextshow: boolean) => {
          // Bootstrap onToggle prop to make tooltip visible or hidden
          if (contentRef && contentRef.current) {
            const isOverflow = isTextOverflow(contentRef.current);

            // If either text overflow or hasTooltip is true, show tooltip to right of the content
            setShow((isOverflow || hasTooltip) && nextshow);
          }
        }}
        show={show}
      >
        <div className='rt-displayname' ref={contentRef}>
          {renderedDisplayname}
          {hasTooltip && <span className='chaise-icon-for-tooltip align-center-icon'></span>}
        </div>
      </OverlayTrigger>

      <div className='rt-section-header-buttons'>
        <div className='rt-section-header-icons'>
          {relatedModel.recordsetState.isLoading && !relatedModel.recordsetState.hasTimeoutError &&
            <Spinner animation='border' size='sm' />
          }
          {relatedModel.recordsetState.hasTimeoutError &&
            <ChaiseTooltip
              placement='bottom'
              tooltip={MESSAGE_MAP.queryTimeoutTooltip}
            >
              <span className='fa-solid fa-triangle-exclamation'></span>
            </ChaiseTooltip>
          }
        </div>
        <RelatedTableActions relatedModel={relatedModel} />
      </div>
    </div>
  );
};

/**
 * Returns Related Section of the record page.
 */
const RecordRelatedSection = (): JSX.Element => {

  const { relatedModels, showEmptySections } = useRecord();

  // by default open all the sections
  const [openSections, setOpenSections] = useState<string[]>(Array.from(Array(relatedModels.length), (e, i) => `${i}`));

  const toggleSection = (relatedModel: RecordRelatedModel) => {
    setOpenSections((currState: string[]) => {
      const currIndex = currState.indexOf(relatedModel.index.toString());
      const isOpen = (currIndex !== -1);

      const action = isOpen ? LogActions.CLOSE : LogActions.OPEN;

      // TODO shouldn't we use logRecordCleintAction here?
      // TODO should technically be based on the latest reference
      // log the action
      // LogService.logClientAction({
      //   action: LogService.getActionString(action, relatedModel.recordsetProps.logInfo.logStackPath),
      //   stack: relatedModel.recordsetProps.logInfo.logStack
      // }, relatedModel.initialReference.defaultLogInfo);

      return isOpen ? [...currState.slice(0, currIndex), ...currState.slice(currIndex + 1)] : currState.concat(relatedModel.index.toString());
    });
  };

  if (relatedModels.length === 0) {
    return <></>;
  }

  return (
    <div className='related-section-container'>
      <Accordion className='panel-group' activeKey={openSections} alwaysOpen >
        {relatedModels.map((rm: RecordRelatedModel) => (
          <Accordion.Item
            key={`record-related-${rm.index}`}
            eventKey={rm.index + ''}
            // TODO should be changed and just added for test purposes
            className={`related-table-accordion panel ${!showEmptySections && (!rm.recordsetState.page || rm.recordsetState.page.length == 0) ? 'hidden' : ''}`}
            // TODO add id
            as='div'
          >
            <Accordion.Header
              as='div' className='panel-heading panel-title'
              onClick={() => toggleSection(rm)}
            >
              <RelatedTableHeader relatedModel={rm} />
            </Accordion.Header>
            <Accordion.Body>
              <RelatedTable relatedModel={rm} />
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

export default RecordRelatedSection;
