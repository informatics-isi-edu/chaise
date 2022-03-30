import '@chaise/assets/scss/_faceting.scss';

import Accordion from 'react-bootstrap/Accordion';
import DisplayValue from '@chaise/components/display-value';

// TODO subject to change
type FacetingProps = {
  reference: any
}

const Faceting = ({
  reference
}: FacetingProps) => {

  const renderFacets = () => {
    return reference.facetColumns.map((fc: any, index: number) => {
      return (
        <Accordion.Item eventKey={index + ''} key={index} className='facet-panel'>
          <Accordion.Header>
            <div className='accordion-toggle ellipsis' id={'fc-heading-' + index}>
              <span className='facet-header-text'><DisplayValue value={fc.displayname} /></span>
              <span className='facet-header-icon'></span>
            </div>
          </Accordion.Header>
          <Accordion.Body>
            Facet choices
          </Accordion.Body>
        </Accordion.Item>
      )
    })
  }

  return (
    <div className='faceting-columns-container'>
      <Accordion defaultActiveKey={['0']} alwaysOpen className='panel-group'>
        {renderFacets()}
      </Accordion>
    </div>
  )
}

export default Faceting;
