import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';
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
      <div className='record-accordion-title'>
        <DisplayValue value={reference.displayname}></DisplayValue>
        <ChaiseTooltip
          placement='top'
          tooltip={`Explore more ${reference?.displayname?.value} records related to this collection.`}
        >
          <Button className='chaise-btn chaise-btn-secondary more-results-link'>
            <span className='chaise-btn-icon fa fa-search'></span>
            Explore
          </Button>
        </ChaiseTooltip>
      </div>
    )
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
                className='related-table-accordion'
                id='rt-heading-Gene'
              >
                <Accordion.Header
                  as='h4'
                  className='panel-heading'
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
