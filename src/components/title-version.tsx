import type { JSX } from 'react';

// components
import FilterChiclet from '@isrd-isi-edu/chaise/src/components/recordset/filter-chiclet';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import {
  getHumanizeVersionDate,
  getVersionDate,
} from '@isrd-isi-edu/chaise/src/utils/date-time-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { addLogParams } from '@isrd-isi-edu/chaise/src/utils/menu-utils';

type TitleVersionProps = {
  /**
   * the reference object
   */
  reference: any;
  /**
   * whether to add paranthesis around the version info
   */
  addParanthesis?: boolean;
};

const TitleVersion = ({ reference, addParanthesis }: TitleVersionProps): JSX.Element | null => {
  /**
   * version info
   */
  let versionInfo: { [key: string]: string } | null = null;
  if (reference && reference.location.version) {
    versionInfo = {
      date: getVersionDate(reference.location),
      humanized: getHumanizeVersionDate(reference.location),
    };
  }

    const goToLive = () => {
      const catalogId = ConfigService.catalogID;
      const url = windowRef.location.href.replace(catalogId, catalogId.split('@')[0]);
      windowRef.location = addLogParams(url, ConfigService.contextHeaderParams);
      windowRef.location.reload();
    };


  if (!versionInfo || !versionInfo.humanized) return null;

  return (
    <div className='chaise-title-version-info'>
      {/* <ChaiseTooltip
        placement='bottom-start'
        tooltip={`${MESSAGE_MAP.tooltip.versionTime} ${versionInfo.date}`}
      >
        <small className='h3-class'>
          {addParanthesis && <span className='parenthesis-left'>(</span>}
          <i className='fa-solid fa-clock-rotate-left'></i>
          {versionInfo.humanized}
          {addParanthesis && <span className='parenthesis-right'>)</span>}
        </small>
      </ChaiseTooltip> */}
      <FilterChiclet
        identifier={0}
        value={versionInfo.humanized}
        valueTooltip={`${MESSAGE_MAP.tooltip.versionTime} ${versionInfo.date}`}
        iconTooltip={'Reload the page and display the live data.'}
        onRemove={goToLive}
        removeIcon={<i className='fa-solid fa-arrow-left'></i>}
      />
    </div>
  );
};

export default TitleVersion;
