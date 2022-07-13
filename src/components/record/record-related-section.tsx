import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';
import { Accordion } from 'react-bootstrap';

export type RecordRelatedSectionProps = {
  /**
   * The displayed reference
   */
  reference: any;

  /**
   * tuple reference
   */
  tuple: any;
};

/**
 * Returns Related Section of the record page.
 */
const RecordRelatedSection = ({
  reference,
  tuple,
}: RecordRelatedSectionProps): JSX.Element => {

    
  return (
    <div className='side-panel-container' id='rt-container'>
      <div className='faceting-columns-container'>
        <Accordion
          className='panel-group'
          alwaysOpen // allow multiple to be open together
          //   activeKey={activeKeys}
        >
          <Accordion.Item
            eventKey={'0'}
            className='related-table-accordion'
            id='rt-heading-Gene'
          >
            <Accordion.Header
              as='h4'
              // className='panel-heading'
              //   className={`fc-heading-${index}`}
              //   onClick={() => toggleFacet(index)}
            >
              Gene
            </Accordion.Header>
            <Accordion.Body>
              <h5>Body</h5>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  );
};

export default RecordRelatedSection;
