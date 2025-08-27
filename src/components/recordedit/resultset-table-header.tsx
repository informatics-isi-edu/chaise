// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import EllipsisWrapper from '@isrd-isi-edu/chaise/src/components/ellipsis-wrapper';

// models
import { appModes } from '@isrd-isi-edu/chaise/src/models/recordedit';

// hooks
import { useRef, useState, type JSX } from 'react';

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
   * variable to store ref of facet header text
   */
  const contentRef = useRef(null);

  const adj = appMode === appModes.EDIT ? 'updated' : 'created';

  /**
   * this is to avoid the accordion header to recieve the click
   */
  const avoidClick = (e: any) => {
    e.stopPropagation();
  };

  return (
    <div className='chaise-accordion-header'>
      <EllipsisWrapper
        elementRef={contentRef}
        tooltip={header}
      >
        <div className='chaise-accordion-displayname' ref={contentRef}>{header}</div>
      </EllipsisWrapper>

      <div className='chaise-accordion-header-buttons'>
        {editLink &&
          <ChaiseTooltip
            placement='top'
            tooltip={<span>Edit the {adj} records.</span>}
          >
            <a className='chaise-btn chaise-btn-secondary bulk-edit-link' href={editLink} onClick={avoidClick}>
              <span className='chaise-btn-icon fa-solid fa-pen'></span>
              <span>Bulk edit</span>
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
