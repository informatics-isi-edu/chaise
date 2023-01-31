// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// models
import { appModes } from '@isrd-isi-edu/chaise/src/models/recordedit';

// hooks
import { useRef, useState } from 'react';

type ResultsetTableHeaderProps = {
  appMode: string;
  header: string,
  exploreLink?: string,
  editLink?: string;
}

const ResultsetTableHeader = ({
  appMode,
  header,
  exploreLink,
  editLink
}: ResultsetTableHeaderProps): JSX.Element => {
  /**
   * state variable to control whether to show tooltip or not
   */
  const [showTooltip, setShowTooltip] = useState(false);

  /**
   * variable to store ref of facet header text
   */
  const contentRef = useRef(null);

  const adj = appMode === appModes.EDIT ? 'updated' : 'created';

  /**
   * Function to check the text overflow.
   */
  const isTextOverflow = (element: HTMLElement) => {
    if (element) {
      return element.offsetWidth < element.scrollWidth;
    }
    return false;
  };

  /**
   * this is to avoid the accordion header to recieve the click
   */
  const avoidClick = (e: any) => {
    e.stopPropagation();
  };

  return (
    <div className='chaise-accordion-header'>
      <ChaiseTooltip
        placement='top-start'
        tooltip={header}
        onToggle={(nextshow: boolean) => {
          // Bootstrap onToggle prop to make tooltip visible or hidden
          if (contentRef && contentRef.current) {
            const isOverflow = isTextOverflow(contentRef.current);

            // If either text overflow or hasTooltip is true, show tooltip to right of the content
            setShowTooltip((isOverflow) && nextshow);
          }
        }}
        show={showTooltip}
      >
        <div className='chaise-accordion-displayname' ref={contentRef}>{header}</div>
      </ChaiseTooltip>

      <div className='chaise-accordion-header-buttons'>
        {editLink &&
          <ChaiseTooltip
            placement='top'
            tooltip={<span>Edit the {adj} records.</span>}
          >
            <a className='chaise-btn chaise-btn-secondary more-results-link' href={editLink} onClick={avoidClick}>
              <span className='chaise-btn-icon fa-solid fa-pen'></span>
              <span>Edit</span>
            </a>
          </ChaiseTooltip>
        }
        {exploreLink &&
          <ChaiseTooltip
            placement='top'
            tooltip={<span>Explore the {adj} records.</span>}
          >
            <a className='chaise-btn chaise-btn-secondary more-results-link' href={exploreLink} onClick={avoidClick}>
              <span className='chaise-btn-icon fa-solid fa-magnifying-glass'></span>
              <span>Explore</span>
            </a>
          </ChaiseTooltip>
        }
      </div>
    </div>
  )
}

export default ResultsetTableHeader;
