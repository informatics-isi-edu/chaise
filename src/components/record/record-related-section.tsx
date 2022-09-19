import '@isrd-isi-edu/chaise/src/assets/scss/_record-related-section.scss';

// components
import Accordion from 'react-bootstrap/Accordion';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { ConditionalWrapper } from '@isrd-isi-edu/chaise/src/components/cond-wrapper';
import RelatedTable from '@isrd-isi-edu/chaise/src/components/record/related-table';
import RelatedTableActions from '@isrd-isi-edu/chaise/src/components/record/related-table-actions';

// hooks
import { useState } from 'react';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

// models
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

/**
 * Returns Related Section of the record page.
 */
const RecordRelatedSection = (): JSX.Element => {

  const { relatedModels, relatedReferences, showEmptySections } = useRecord();

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

  /**
   * Function to display title in the related section of record page
   * @param RecordRelatedModel the related model
   * @returns what should be used in the title
   */
  const getTitle = (relatedModel: RecordRelatedModel) => {
    const usedRef = relatedModel.initialReference;
    const hasTooltip = usedRef.comment && usedRef.commentDisplay === 'tooltip'
    return (
      <div className='rt-section-header'>
        <span className='rt-displayname'>
          <ConditionalWrapper
            condition={hasTooltip}
            wrapper={children => (
              <ChaiseTooltip placement='right' tooltip={usedRef.comment}>
                {children}
              </ChaiseTooltip>
            )}
          >
            <>
              <DisplayValue value={usedRef.displayname} />
              {hasTooltip && <span className='chaise-icon-for-tooltip align-center-icon'></span>}
            </>
          </ConditionalWrapper>
        </span>
        {relatedModel.recordsetState.hasTimeoutError &&
          <ChaiseTooltip
            placement='bottom'
            tooltip={MESSAGE_MAP.queryTimeoutTooltip}
          >
            <span className='fa-solid fa-triangle-exclamation'></span>
          </ChaiseTooltip>
        }
        <span className='action-buttons'>
          <RelatedTableActions relatedModel={relatedModel} />
        </span>
      </div>
    );
  };

  if (relatedModels.length === 0) {
    return <></>;
  }

  return (
    <div id='rt-container'>
      <Accordion className='panel-group' activeKey={openSections} alwaysOpen >
        {relatedModels.map((rm: RecordRelatedModel) => (
          <Accordion.Item
            key={`record-related-${rm.index}`}
            eventKey={rm.index + ''}
            // TODO should be changed and just added for test purposes
            className={`related-table-accordion panel ${!showEmptySections && (!rm.recordsetState.page || rm.recordsetState.page.length == 0) ? 'hidden': ''}`}
            id='rt-heading-Gene'
            as='div'
          >
            <Accordion.Header
              as='div' className='panel-heading panel-title'
              onClick={() => toggleSection(rm)}
            >
              {getTitle(rm)}
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
