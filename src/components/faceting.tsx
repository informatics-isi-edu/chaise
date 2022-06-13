import '@isrd-isi-edu/chaise/src/assets/scss/_faceting.scss';

import { useEffect, useRef, useState } from 'react';

// Components
import Accordion from 'react-bootstrap/Accordion';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
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

  /**
   * 
   * @param param0 prop that holds content to show as header
   * @param param1 showTooltip prop to enable tooltip for header text
   * @returns FacetHeader Component
   */
  const FacetHeader = ({ key, content, showTooltip, tooltipContent }) => {
    /**
     * @contentRef variable to store ref of facet header text
     * @show state variable to control whether to show tooltip or not
     */
    const contentRef = useRef(null);
    const [show, setShow] = useState(false);

    // Function to check the text overflow.
    const isTextOverflow = (element) => {
      if (element) {
        return (element.offsetWidth < element.scrollWidth);
      }
      return false; 
    }
    
    return (
      <OverlayTrigger
        placement='right'
        overlay={<Tooltip><DisplayValue value={tooltipContent} /></Tooltip>}
        onToggle={(nextshow: boolean) => {
          if (contentRef && contentRef.current) {
            const isOverflow = isTextOverflow(contentRef.current);
            // If either text overflow or showtooltip is true, show tooltip to right of the content
            setShow((isOverflow || showTooltip) && nextshow);
          }
        }}
        onExiting={() => {
          setShow(false);
        }}
        show={show}
      >
        <div className='accordion-toggle ellipsis' id={key}>
          <div ref={contentRef} className='facet-header-text ellipsis'>
            <DisplayValue value={content} />
            <span className='chaise-icon-for-tooltip align-center-icon'></span>
          </div>
          <span className='facet-header-icon'></span>
        </div>
      </OverlayTrigger>
    );
  };

  const renderFacets = () => {
    return reference.facetColumns.map((fc: any, index: number) => {
      return (
        <Accordion.Item eventKey={index + ''} key={index} className='facet-panel'>
          <Accordion.Header>
              <FacetHeader 
                key={`fc-heading-${index}`}
                content={fc.displayname} 
                showTooltip={true} 
                tooltipContent={fc.displayname}
              />
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
