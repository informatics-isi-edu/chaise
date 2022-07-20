import '@isrd-isi-edu/chaise/src/assets/scss/_record_related_container.scss';

import { Accordion, Button } from 'react-bootstrap';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

export type RecordRelatedSectionProps = {
  /**
   * The displayed reference
   */
  reference: any;
};

/**
 * Returns Related Section of the record page.
 */
const RecordRelatedSection = ({
  reference
}: RecordRelatedSectionProps): JSX.Element => {

  /**
   * Function to display title in the related section of record page
   * @param reference takes reference parameter
   * @returns DisplayValue Component
   */
   const getTitle = (reference: any) => {
    return (
      <div className='rt-section-header'>
        <span className='rt-displayname'>
          <DisplayValue value={reference.displayname}></DisplayValue>
          {reference?.comment && (
            <ChaiseTooltip placement='right' tooltip={reference?.comment}>
              <span className='chaise-icon-for-tooltip align-center-icon'></span>
            </ChaiseTooltip>
          )}
        </span>

        {/* TODO: ACTION BUTTONS */}
        {/* <span style={{ float: 'right' }}> */}
          <ChaiseTooltip
            placement='top'
            tooltip={`Explore more ${reference?.displayname?.value} records related to this collection.`}
          >
            <Button className='chaise-btn chaise-btn-secondary more-results-link' style={{ float: 'right' }}>
              <span className='chaise-btn-icon fa fa-search'></span>
              Explore
            </Button>
          </ChaiseTooltip>
        {/* </span> */}
      </div>
    );
  };

  return (
    <div className='side-panel-container' id='rt-container'>
      <div className='faceting-columns-container'>
        <Accordion
          className='panel-group'
          alwaysOpen // allow multiple to be open together
          //   activeKey={activeKeys}
        >
          {reference && Array.isArray(reference.related) && reference.related.map((ref: any, index: number) => {
            return (
              <Accordion.Item
                key={`record-related-${index}`}
                eventKey={'record-related-' + index}
                className='related-table-accordion panel'
                id='rt-heading-Gene'
                as='div'
              >
                <Accordion.Header
                  as='div'
                  className='panel-heading panel-title'
                >
                  {getTitle(ref)}
                </Accordion.Header>
                <Accordion.Body>
                  <h5>Body</h5>
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
};

export default RecordRelatedSection;
