import '@isrd-isi-edu/chaise/src/assets/scss/_record-related-section.scss';

// components
import Accordion from 'react-bootstrap/Accordion';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

/**
 * Returns Related Section of the record page.
 */
const RecordRelatedSection = (): JSX.Element => {

  const { reference } = useRecord();

  /**
   * Function to display title in the related section of record page
   * @param reference takes reference parameter
   * @returns DisplayValue Component
   */
  const getTitle = (reference: any) => {
    return (
      <div className='rt-section-header'>
        <span className='rt-displayname'>
          {reference?.comment ? (
            <ChaiseTooltip placement='right' tooltip={reference?.comment}>
              <span>
                <DisplayValue value={reference.displayname}></DisplayValue>
                <span className='chaise-icon-for-tooltip align-center-icon'></span>
              </span>
            </ChaiseTooltip>
          ) : <DisplayValue value={reference.displayname}></DisplayValue>}
        </span>

        {/* TODO: ACTION BUTTONS */}
        <span className='action-buttons'>
          <ChaiseTooltip
            placement='top'
            tooltip={`Explore more ${reference?.displayname?.value} records related to this collection.`}
          >
            <div className='chaise-btn chaise-btn-secondary more-results-link'>
              <span className='chaise-btn-icon fa fa-search'></span>
              Explore
            </div>
          </ChaiseTooltip>
        </span>
      </div>
    );
  };

  return (
    <div id='rt-container'>
      <div className='faceting-columns-container'>
        <Accordion
          className='panel-group'
          alwaysOpen // allow multiple to be open together
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
