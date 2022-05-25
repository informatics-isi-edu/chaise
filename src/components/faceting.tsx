import '@isrd-isi-edu/chaise/src/assets/scss/_faceting.scss';

import { useEffect, useState } from 'react';

// Components
import Accordion from 'react-bootstrap/Accordion';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import FacetChoicePicker from '@isrd-isi-edu/chaise/src/components/facet-choice-picker';
import FacetRangePicker from '@isrd-isi-edu/chaise/src/components/facet-range-picker';

// TODO subject to change
type FacetingProps = {
  reference: any
}

const Faceting = ({
  reference
}: FacetingProps) => {

  const renderFacet = (fc: any, index: number) => {
    switch (fc.preferredMode) {
      case 'ranges':
        return <FacetRangePicker facetColumn={fc} index={index}></FacetRangePicker>
      case 'check_presence':
        return <>Check presence!</>;
      default:
        return <FacetChoicePicker facetColumn={fc} index={index}></FacetChoicePicker>
    }
  };

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
            {renderFacet(fc, index)}
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
