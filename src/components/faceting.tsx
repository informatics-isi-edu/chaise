import '@chaise/assets/scss/_faceting.scss';

import Accordion from 'react-bootstrap/Accordion';
import DisplayValue from '@chaise/components/display-value';
import { useEffect, useState } from 'react';
import FacetChoicePicker from '@chaise/components/facet-choice-picker';

// TODO subject to change
type FacetingProps = {
  reference: any,
  // refresh?: number
}

const Faceting = ({
  reference,
  // refresh,
}: FacetingProps) => {

  const [showFacetModal, setShowFacetModal] = useState(false);

  // useEffect(()=> {
  //   $log.log('refreshing the faceting!');
  //   // $log.log(test.current);
  // }, [refresh]);

  const openRecordsetPopup = () => {
    setShowFacetModal(true);
  }

  const renderFacet = (fc: any, index: number) => {
    switch (fc.preferredMode) {
      case 'ranges':
        return <>Range picker!</>;
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
